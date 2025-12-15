<?php

namespace App\Http\Controllers;

use App\Enums\AuditModuleType;
use App\Enums\AuditTargetType;
use App\Http\Requests\CancelAppointmentRequest;
use App\Http\Requests\StoreAppointmentRequest;
use App\Http\Requests\UpdateAppointmentRequest;
use App\Models\Appointment;
use App\Models\Patient;
use App\Models\TreatmentRecord;
use App\Models\TreatmentType;
use App\Models\User;
use App\Services\AdminAuditService;
use App\Services\PricingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AppointmentController extends Controller
{
    public function __construct(
        protected AdminAuditService $auditService,
        protected PricingService $pricingService
    ) {}
    /**
     * Display a listing of appointments (calendar view).
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        $query = Appointment::with([
            'patient:id,fname,mname,lname',
            'dentist:id,fname,mname,lname',
            'treatmentTypes:id,name',
            'treatmentRecords.treatmentType:id,name,standard_cost,is_per_tooth',
            'treatmentRecords.teeth:id',
        ]);

        // If user is a dentist (role_id = 2), only show their assigned appointments
        if ($user->role_id === 2) {
            $query->where('dentist_id', $user->id);
        }

        // Filter by date range
        if ($request->filled('start_date')) {
            $query->whereDate('appointment_start_datetime', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('appointment_start_datetime', '<=', $request->end_date);
        }

        // Filter by dentist
        if ($request->filled('dentist_id')) {
            $query->where('dentist_id', $request->dentist_id);
        }

        // Filter by patient
        if ($request->filled('patient_id')) {
            $query->where('patient_id', $request->patient_id);
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Search by patient or dentist name
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('patient', function ($pq) use ($search) {
                    $pq->where('fname', 'like', "%{$search}%")
                        ->orWhere('lname', 'like', "%{$search}%");
                })->orWhereHas('dentist', function ($dq) use ($search) {
                    $dq->where('fname', 'like', "%{$search}%")
                        ->orWhere('lname', 'like', "%{$search}%");
                });
            });
        }

        $appointments = $query->orderBy('appointment_start_datetime', 'desc')->get()
            ->map(function ($appointment) {
                // Calculate total amount using PricingService
                $totalAmount = $this->pricingService->calculateTotalPrice($appointment->treatmentRecords);

                return [
                    'id' => $appointment->id,
                    'patient_id' => $appointment->patient_id,
                    'patient_name' => $appointment->patient ? 
                        trim("{$appointment->patient->fname} {$appointment->patient->mname} {$appointment->patient->lname}") : 'N/A',
                    'dentist_id' => $appointment->dentist_id,
                    'dentist_name' => $appointment->dentist ? 
                        trim("{$appointment->dentist->fname} {$appointment->dentist->mname} {$appointment->dentist->lname}") : 'N/A',
                    'appointment_start_datetime' => $appointment->appointment_start_datetime?->format('Y-m-d H:i'),
                    'appointment_end_datetime' => $appointment->appointment_end_datetime?->format('Y-m-d H:i'),
                    'status' => $appointment->status,
                    'purpose_of_appointment' => $appointment->purpose_of_appointment,
                    'treatment_types' => $appointment->treatmentTypes->pluck('name')->join(', '),
                    'total_amount' => $totalAmount,
                ];
            });

        // Get data for filters
        $dentists = User::where('role_id', 2)->get(['id', 'fname', 'mname', 'lname']);
        $patients = Patient::all(['id', 'fname', 'mname', 'lname']);

        return Inertia::render('appointments/Index', [
            'appointments' => $appointments,
            'dentists' => $dentists,
            'patients' => $patients,
            'filters' => [
                'start_date' => $request->input('start_date', ''),
                'end_date' => $request->input('end_date', ''),
                'dentist_id' => $request->input('dentist_id', ''),
                'patient_id' => $request->input('patient_id', ''),
                'status' => $request->input('status', ''),
                'search' => $request->input('search', ''),
            ],
        ]);
    }

    /**
     * Show the form for creating a new appointment.
     */
    public function create()
    {
        $patients = Patient::orderBy('lname')->get(['id', 'fname', 'mname', 'lname']);
        $dentists = User::where('role_id', 2)
            ->with('specializations:id,name')
            ->get(['id', 'fname', 'mname', 'lname']);
        $treatmentTypes = TreatmentType::where('is_active', true)
            ->get(['id', 'name', 'standard_cost', 'duration_minutes']);

        return Inertia::render('appointments/Create', [
            'patients' => $patients,
            'dentists' => $dentists,
            'treatmentTypes' => $treatmentTypes,
        ]);
    }

    /**
     * Store a newly created appointment.
     */
    public function store(StoreAppointmentRequest $request)
    {
        $validated = $request->validated();

        // Create the appointment
        $appointment = Appointment::create([
            'patient_id' => $validated['patient_id'],
            'dentist_id' => $validated['dentist_id'],
            'appointment_start_datetime' => $validated['appointment_start_datetime'],
            'appointment_end_datetime' => $validated['appointment_end_datetime'] ?? null,
            'purpose_of_appointment' => $validated['purpose_of_appointment'] ?? null,
            'status' => 'Scheduled',
        ]);

        // Create treatment records for each selected treatment type
        foreach ($validated['treatment_type_ids'] as $treatmentTypeId) {
            TreatmentRecord::create([
                'appointment_id' => $appointment->id,
                'treatment_type_id' => $treatmentTypeId,
            ]);
        }

        // Load relations for audit log
        $appointment->load(['patient:id,fname,lname', 'dentist:id,fname,lname']);

        // Audit log
        $this->auditService->log(
            adminId: Auth::id(),
            activityTitle: 'Appointment Created',
            message: "Created appointment for {$appointment->patient->fname} {$appointment->patient->lname}",
            moduleType: AuditModuleType::APPOINTMENT_MANAGEMENT,
            targetType: AuditTargetType::APPOINTMENT,
            targetId: $appointment->id,
            newValue: [
                'patient' => trim("{$appointment->patient->fname} {$appointment->patient->lname}"),
                'dentist' => trim("{$appointment->dentist->fname} {$appointment->dentist->lname}"),
                'datetime' => $appointment->appointment_start_datetime,
                'status' => $appointment->status,
            ]
        );

        return redirect()->route('appointments.show', $appointment)
            ->with('success', 'Appointment scheduled successfully.');
    }

    /**
     * Display the specified appointment.
     */
    public function show(Appointment $appointment)
    {
        $appointment->load([
            'patient',
            'dentist',
            'treatmentRecords.treatmentType',
            'treatmentRecords.files',
            'treatmentRecords.teeth',
        ]);

        // Get treatment types for potential editing
        $treatmentTypes = TreatmentType::where('is_active', true)
            ->get(['id', 'name', 'standard_cost', 'duration_minutes']);

        // Get all teeth for treatment record editing
        $allTeeth = \App\Models\Tooth::orderBy('id')->get(['id', 'name']);

        // Pre-calculate prices for each treatment record
        $treatmentRecords = $appointment->treatmentRecords->map(function ($record) {
            return [
                'id' => $record->id,
                'treatment_type' => $record->treatmentType,
                'treatment_notes' => $record->treatment_notes,
                'files' => $record->files->map(fn($file) => [
                    'id' => $file->id,
                    'file_path' => $file->file_path,
                    'original_name' => $file->original_name,
                    'url' => asset('storage/' . $file->file_path),
                ]),
                'teeth' => $record->teeth,
                'price' => $this->pricingService->calculateTreatmentPrice($record),
                'created_at' => $record->created_at?->format('Y-m-d H:i'),
            ];
        });

        // Calculate total amount
        $totalAmount = $this->pricingService->calculateTotalPrice($appointment->treatmentRecords);

        return Inertia::render('appointments/Show', [
            'appointment' => [
                'id' => $appointment->id,
                'patient' => $appointment->patient,
                'dentist' => $appointment->dentist,
                'appointment_start_datetime' => $appointment->appointment_start_datetime?->format('Y-m-d\TH:i'),
                'appointment_end_datetime' => $appointment->appointment_end_datetime?->format('Y-m-d\TH:i'),
                'status' => $appointment->status,
                'purpose_of_appointment' => $appointment->purpose_of_appointment,
                'cancellation_reason' => $appointment->cancellation_reason,
                'treatment_records' => $treatmentRecords,
                'total_amount' => $totalAmount,
                'created_at' => $appointment->created_at?->format('Y-m-d H:i'),
            ],
            'treatmentTypes' => $treatmentTypes,
            'allTeeth' => $allTeeth,
        ]);
    }

    /**
     * Show the form for editing the specified appointment.
     */
    public function edit(Appointment $appointment)
    {
        $appointment->load(['patient', 'dentist', 'treatmentRecords.treatmentType']);

        $dentists = User::where('role_id', 2)
            ->with('specializations:id,name')
            ->get(['id', 'fname', 'mname', 'lname']);
        $treatmentTypes = TreatmentType::where('is_active', true)
            ->get(['id', 'name', 'standard_cost', 'duration_minutes']);

        return Inertia::render('appointments/Edit', [
            'appointment' => [
                'id' => $appointment->id,
                'patient' => $appointment->patient,
                'dentist_id' => $appointment->dentist_id,
                'appointment_start_datetime' => $appointment->appointment_start_datetime?->format('Y-m-d\TH:i'),
                'appointment_end_datetime' => $appointment->appointment_end_datetime?->format('Y-m-d\TH:i'),
                'purpose_of_appointment' => $appointment->purpose_of_appointment,
                'treatment_type_ids' => $appointment->treatmentRecords->pluck('treatment_type_id')->toArray(),
                'status' => $appointment->status,
            ],
            'dentists' => $dentists,
            'treatmentTypes' => $treatmentTypes,
        ]);
    }

    /**
     * Update the specified appointment.
     */
    public function update(UpdateAppointmentRequest $request, Appointment $appointment)
    {
        $validated = $request->validated();

        // Load relations and capture old data for audit
        $appointment->load(['patient:id,fname,lname', 'dentist:id,fname,lname']);
        $oldData = [
            'dentist' => $appointment->dentist ? trim("{$appointment->dentist->fname} {$appointment->dentist->lname}") : null,
            'datetime' => $appointment->appointment_start_datetime?->format('Y-m-d H:i'),
            'purpose' => $appointment->purpose_of_appointment,
        ];

        $appointment->update([
            'dentist_id' => $validated['dentist_id'],
            'appointment_start_datetime' => $validated['appointment_start_datetime'],
            'appointment_end_datetime' => $validated['appointment_end_datetime'] ?? null,
            'purpose_of_appointment' => $validated['purpose_of_appointment'] ?? null,
        ]);

        // Update treatment records
        $currentTypeIds = $appointment->treatmentRecords->pluck('treatment_type_id')->toArray();
        $newTypeIds = $validated['treatment_type_ids'];

        // Remove treatment records not in new list
        $appointment->treatmentRecords()
            ->whereNotIn('treatment_type_id', $newTypeIds)
            ->delete();

        // Add new treatment records
        foreach ($newTypeIds as $typeId) {
            if (!in_array($typeId, $currentTypeIds)) {
                TreatmentRecord::create([
                    'appointment_id' => $appointment->id,
                    'treatment_type_id' => $typeId,
                ]);
            }
        }

        // Reload for new values
        $appointment->load(['dentist:id,fname,lname']);

        // Audit log
        $this->auditService->log(
            adminId: Auth::id(),
            activityTitle: 'Appointment Updated',
            message: "Updated appointment #{$appointment->id}",
            moduleType: AuditModuleType::APPOINTMENT_MANAGEMENT,
            targetType: AuditTargetType::APPOINTMENT,
            targetId: $appointment->id,
            oldValue: $oldData,
            newValue: [
                'dentist' => $appointment->dentist ? trim("{$appointment->dentist->fname} {$appointment->dentist->lname}") : null,
                'datetime' => $appointment->appointment_start_datetime?->format('Y-m-d H:i'),
                'purpose' => $appointment->purpose_of_appointment,
            ]
        );

        return redirect()->route('appointments.show', $appointment)
            ->with('success', 'Appointment updated successfully.');
    }

    /**
     * Cancel the specified appointment.
     */
    public function cancel(CancelAppointmentRequest $request, Appointment $appointment)
    {
        if ($appointment->status === 'Cancelled') {
            return back()->withErrors(['error' => 'This appointment is already cancelled.']);
        }

        $oldStatus = $appointment->status;
        $cancellationReason = $request->validated()['cancellation_reason'];

        $appointment->update([
            'status' => 'Cancelled',
            'cancellation_reason' => $cancellationReason,
        ]);

        // Load relations for audit
        $appointment->load(['patient:id,fname,lname']);

        // Audit log
        $this->auditService->log(
            adminId: Auth::id(),
            activityTitle: 'Appointment Cancelled',
            message: "Cancelled appointment #{$appointment->id} for {$appointment->patient->fname} {$appointment->patient->lname}",
            moduleType: AuditModuleType::APPOINTMENT_MANAGEMENT,
            targetType: AuditTargetType::APPOINTMENT,
            targetId: $appointment->id,
            oldValue: ['status' => $oldStatus],
            newValue: [
                'status' => 'Cancelled',
                'cancellation_reason' => $cancellationReason,
            ]
        );

        return redirect()->route('appointments.show', $appointment)
            ->with('success', 'Appointment cancelled successfully.');
    }

    /**
     * Mark appointment as completed.
     */
    public function complete(Appointment $appointment)
    {
        if ($appointment->status !== 'Scheduled') {
            return back()->withErrors(['error' => 'Only scheduled appointments can be marked as completed.']);
        }

        $oldStatus = $appointment->status;
        $appointment->update(['status' => 'Completed']);

        // Load relations for audit
        $appointment->load(['patient:id,fname,lname']);

        // Audit log
        $this->auditService->log(
            adminId: Auth::id(),
            activityTitle: 'Appointment Completed',
            message: "Marked appointment #{$appointment->id} as completed",
            moduleType: AuditModuleType::APPOINTMENT_MANAGEMENT,
            targetType: AuditTargetType::APPOINTMENT,
            targetId: $appointment->id,
            oldValue: ['status' => $oldStatus],
            newValue: ['status' => 'Completed']
        );

        return redirect()->route('appointments.show', $appointment)
            ->with('success', 'Appointment marked as completed.');
    }
}
