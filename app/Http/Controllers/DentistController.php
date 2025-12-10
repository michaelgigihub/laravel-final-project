<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateOwnProfileRequest;
use App\Http\Resources\DentistProfileResource;
use App\Models\Appointment;
use App\Models\ClinicAvailability;
use App\Models\Specialization;
use App\Models\TreatmentRecord;
use App\Services\DentistService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DentistController extends Controller
{
    public function __construct(
        protected DentistService $dentistService
    ) {}
    /**
     * Display the dentist dashboard with appointments and stats.
     */
    public function dashboard(Request $request): Response
    {
        $user = $request->user();
        $dentistId = $user->id;

        // Get today's and upcoming appointments
        $todayAppointments = Appointment::with(['patient:id,fname,mname,lname', 'treatmentTypes:id,name'])
            ->where('dentist_id', $dentistId)
            ->whereDate('appointment_start_datetime', Carbon::today())
            ->where('status', '!=', 'Cancelled')
            ->orderBy('appointment_start_datetime')
            ->get()
            ->map(function ($apt) {
                return [
                    'id' => $apt->id,
                    'patient_name' => trim("{$apt->patient->fname} {$apt->patient->mname} {$apt->patient->lname}"),
                    'time' => Carbon::parse($apt->appointment_start_datetime)->format('g:i A'),
                    'status' => $apt->status,
                    'treatments' => $apt->treatmentTypes->pluck('name')->join(', '),
                ];
            });

        $upcomingAppointments = Appointment::with(['patient:id,fname,mname,lname', 'treatmentTypes:id,name'])
            ->where('dentist_id', $dentistId)
            ->where('appointment_start_datetime', '>', Carbon::now())
            ->where('status', 'Scheduled')
            ->orderBy('appointment_start_datetime')
            ->limit(10)
            ->get()
            ->map(function ($apt) {
                return [
                    'id' => $apt->id,
                    'patient_name' => trim("{$apt->patient->fname} {$apt->patient->mname} {$apt->patient->lname}"),
                    'datetime' => Carbon::parse($apt->appointment_start_datetime)->format('M d, Y g:i A'),
                    'treatments' => $apt->treatmentTypes->pluck('name')->join(', '),
                ];
            });

        // Get stats
        $stats = [
            'total_appointments' => Appointment::where('dentist_id', $dentistId)->count(),
            'completed_appointments' => Appointment::where('dentist_id', $dentistId)
                ->where('status', 'Completed')->count(),
            'scheduled_appointments' => Appointment::where('dentist_id', $dentistId)
                ->where('status', 'Scheduled')->count(),
            'today_appointments' => $todayAppointments->count(),
        ];

        // Recent treatments (completed)
        $recentTreatments = TreatmentRecord::with([
            'appointment.patient:id,fname,mname,lname',
            'treatmentType:id,name'
        ])
            ->whereHas('appointment', function ($q) use ($dentistId) {
                $q->where('dentist_id', $dentistId)
                    ->where('status', 'Completed');
            })
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($record) {
                return [
                    'id' => $record->id,
                    'appointment_id' => $record->appointment_id,
                    'patient_name' => $record->appointment->patient 
                        ? trim("{$record->appointment->patient->fname} {$record->appointment->patient->lname}")
                        : 'N/A',
                    'treatment_type' => $record->treatmentType?->name ?? 'Unknown',
                    'date' => $record->created_at?->format('M d, Y'),
                ];
            });

        // Clinic availability for the week
        $clinicAvailability = ClinicAvailability::orderBy('day_of_week')->get()
            ->map(function ($avail) {
                return [
                    'day_name' => $avail->day_name,
                    'is_closed' => $avail->is_closed,
                    'open_time' => $avail->open_time ? Carbon::parse($avail->open_time)->format('g:i A') : null,
                    'close_time' => $avail->close_time ? Carbon::parse($avail->close_time)->format('g:i A') : null,
                ];
            });

        return Inertia::render('dentist/Dashboard', [
            'todayAppointments' => $todayAppointments,
            'upcomingAppointments' => $upcomingAppointments,
            'stats' => $stats,
            'recentTreatments' => $recentTreatments,
            'clinicAvailability' => $clinicAvailability,
        ]);
    }

    /**
     * Display the authenticated dentist's profile.
     *
     * Uses session-based authentication (via Fortify/Laravel's default auth).
     * The authenticated user is retrieved from the session.
     */
    public function profile(Request $request): Response
    {
        $user = $request->user();

        // Eager load all necessary relationships
        $user->load(['role', 'dentistProfile', 'specializations']);

        // Get all available specializations for editing
        $specializations = Specialization::all()->map(function ($spec) {
            return [
                'id' => $spec->id,
                'name' => $spec->name,
            ];
        });

        return Inertia::render('dentist/profile', [
            'dentist' => (new DentistProfileResource($user, includeAdminFields: false))->resolve(),
            'specializations' => $specializations,
            'viewMode' => 'self',
        ]);
    }

    /**
     * Update the authenticated dentist's own profile.
     */
    public function updateProfile(UpdateOwnProfileRequest $request)
    {
        $user = $request->user();
        $validated = $request->validated();

        // Update user basic info only (personal information)
        // Professional information (employment_status, hire_date, specializations) can only be edited by admins
        $user->update([
            'fname' => $validated['fname'],
            'mname' => $validated['mname'] ?? null,
            'lname' => $validated['lname'],
            'gender' => $validated['gender'],
            'contact_number' => $validated['contact_number'] ?? null,
        ]);

        return redirect()->route('dentist.profile')->with('success', 'Profile updated successfully.');
    }
}

