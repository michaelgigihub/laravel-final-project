<?php

namespace App\Http\Controllers;

use App\Http\Requests\CancelAppointmentRequest;
use App\Http\Requests\StoreAppointmentRequest;
use App\Http\Requests\UpdateAppointmentRequest;
use App\Models\Appointment;
use App\Models\Patient;
use App\Models\TreatmentRecord;
use App\Models\TreatmentType;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AppointmentController extends Controller
{
    /**
     * Display a listing of appointments (calendar view).
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        $query = Appointment::with([
            'patient:id,fname,mname,lname',
            'dentist:id,fname,mname,lname',
            'treatmentTypes:id,name'
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
                'treatment_records' => $appointment->treatmentRecords->map(function ($record) {
                    return [
                        'id' => $record->id,
                        'treatment_type' => $record->treatmentType,
                        'treatment_notes' => $record->treatment_notes,
                        'files' => $record->files,
                        'teeth' => $record->teeth,
                        'created_at' => $record->created_at?->format('Y-m-d H:i'),
                    ];
                }),
                'created_at' => $appointment->created_at?->format('Y-m-d H:i'),
            ],
            'treatmentTypes' => $treatmentTypes,
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

        $appointment->update([
            'status' => 'Cancelled',
            'cancellation_reason' => $request->validated()['cancellation_reason'],
        ]);

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

        $appointment->update(['status' => 'Completed']);

        return redirect()->route('appointments.show', $appointment)
            ->with('success', 'Appointment marked as completed.');
    }
}
