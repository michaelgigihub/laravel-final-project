<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\Patient;
use Illuminate\Support\Facades\Auth;

class AppointmentService
{
    /**
     * Find the next scheduled appointment for a patient by name.
     *
     * Performs a case-insensitive, partial match search on the patient's name
     * and returns the closest upcoming appointment.
     *
     * @param string $patientName The patient's name (partial or full)
     * @param int|null $dentistId Optional dentist ID to scope the search (RBAC)
     * @return array|null Appointment data or null if not found
     */
    public function findNextAppointment(string $patientName, ?int $dentistId = null): ?array
    {
        // Find patient(s) matching the name (case-insensitive, partial match)
        // Supports both individual name parts and full names (e.g., "Jane B. Smith")
        $searchTerm = '%' . strtolower($patientName) . '%';
        
        $patients = Patient::query()
            ->where(function ($query) use ($searchTerm) {
                // Search in concatenated full name using CONCAT_WS to avoid double spaces
                $query->whereRaw("CONCAT_WS(' ', LOWER(fname), NULLIF(LOWER(mname), ''), LOWER(lname)) LIKE ?", [$searchTerm])
                    // Also search fname + lname only (without middle name) for cases like "John Doe" matching "John A. Doe"
                    ->orWhereRaw("CONCAT(LOWER(fname), ' ', LOWER(lname)) LIKE ?", [$searchTerm])
                    // Also search individual fields for backward compatibility
                    ->orWhereRaw('LOWER(fname) LIKE ?', [$searchTerm])
                    ->orWhereRaw('LOWER(mname) LIKE ?', [$searchTerm])
                    ->orWhereRaw('LOWER(lname) LIKE ?', [$searchTerm]);
            })
            ->pluck('id');

        if ($patients->isEmpty()) {
            return null;
        }

        // Build the query
        $query = Appointment::query()
            ->whereIn('patient_id', $patients)
            ->where('status', 'Scheduled')
            ->where('appointment_start_datetime', '>=', now())
            ->orderBy('appointment_start_datetime', 'asc')
            ->with(['patient', 'dentist', 'treatmentTypes']);

        // Apply RBAC: If a dentist ID is provided, filter by it.
        if ($dentistId) {
            $query->where('dentist_id', $dentistId);
        }

        $appointment = $query->first();

        if (!$appointment) {
            return null;
        }

        // Format the response as a simple associative array
        return [
            'patient_name' => $appointment->patient?->name ?? 'Unknown',
            'date' => $appointment->appointment_start_datetime?->format('F j, Y') ?? 'No date',
            'time' => $appointment->appointment_start_datetime?->format('g:i A') ?? 'No time',
            'dentist_name' => $appointment->dentist?->name ?? 'Unknown',
            'treatment_types' => $appointment->treatmentTypes?->pluck('name')->toArray() ?? [],
            'purpose' => $appointment->purpose_of_appointment,
        ];
    }

    /**
     * Get appointment history for a patient.
     *
     * @param string $patientName The patient's name
     * @param int|null $dentistId Optional dentist ID to scope the search
     * @return array
     */
    public function getAppointmentHistory(string $patientName, ?int $dentistId = null): array
    {
        $searchTerm = '%' . strtolower($patientName) . '%';
        
        $patients = Patient::query()
            ->where(function ($query) use ($searchTerm) {
                // Search in concatenated full name using CONCAT_WS to avoid double spaces
                $query->whereRaw("CONCAT_WS(' ', LOWER(fname), NULLIF(LOWER(mname), ''), LOWER(lname)) LIKE ?", [$searchTerm])
                    // Also search fname + lname only (without middle name) for cases like "John Doe" matching "John A. Doe"
                    ->orWhereRaw("CONCAT(LOWER(fname), ' ', LOWER(lname)) LIKE ?", [$searchTerm])
                    // Also search individual fields for backward compatibility
                    ->orWhereRaw('LOWER(fname) LIKE ?', [$searchTerm])
                    ->orWhereRaw('LOWER(mname) LIKE ?', [$searchTerm])
                    ->orWhereRaw('LOWER(lname) LIKE ?', [$searchTerm]);
            })
            ->pluck('id');

        if ($patients->isEmpty()) {
            return [];
        }

        $query = Appointment::query()
            ->whereIn('patient_id', $patients)
            ->with(['patient', 'dentist', 'treatmentTypes'])
            ->orderBy('appointment_start_datetime', 'desc')
            ->limit(5);

        // RBAC Scoping
        if ($dentistId) {
            $query->where('dentist_id', $dentistId);
        }

        return $query->get()->map(function ($appt) {
            return [
                'date' => $appt->appointment_start_datetime?->format('F j, Y') ?? 'No date',
                'time' => $appt->appointment_start_datetime?->format('g:i A') ?? 'No time',
                'status' => $appt->status, // Scheduled, Completed, Cancelled
                'dentist' => $appt->dentist?->name ?? 'Unknown',
                'treatments' => $appt->treatmentTypes?->pluck('name')->join(', ') ?? '',
                'purpose' => $appt->purpose_of_appointment,
            ];
        })->toArray();
    }

    /**
     * Get unique patients scheduled for a dentist this week.
     *
     * @param int $dentistId The dentist's user ID
     * @return array
     */
    public function getWeeklyPatients(int $dentistId): array
    {
        $startOfWeek = now()->startOfWeek();
        $endOfWeek = now()->endOfWeek();

        return Appointment::query()
            ->where('dentist_id', $dentistId)
            ->where('status', 'Scheduled')
            ->whereBetween('appointment_start_datetime', [$startOfWeek, $endOfWeek])
            ->with(['patient'])
            ->get()
            ->unique('patient_id')
            ->map(function ($appt) {
                return [
                    'patient_name' => $appt->patient?->name ?? 'Unknown',
                    'contact' => $appt->patient?->contact_number ?? 'N/A',
                    'appointment_count' => Appointment::where('patient_id', $appt->patient_id)
                        ->where('dentist_id', $appt->dentist_id)
                        ->where('status', 'Scheduled')
                        ->whereBetween('appointment_start_datetime', [now()->startOfWeek(), now()->endOfWeek()])
                        ->count()
                ];
            })
            ->values()
            ->toArray();
    }

    /**
     * Get a dentist's daily schedule.
     *
     * @param int $dentistId The dentist's user ID
     * @param string $date Date in Y-m-d format (defaults to today)
     * @return array
     */
    public function getDailySchedule(int $dentistId, string $date = null): array
    {
        $targetDate = $date ? \Carbon\Carbon::parse($date) : now();
        $startOfDay = $targetDate->copy()->startOfDay();
        $endOfDay = $targetDate->copy()->endOfDay();

        return Appointment::query()
            ->where('dentist_id', $dentistId)
            ->whereBetween('appointment_start_datetime', [$startOfDay, $endOfDay])
            ->with(['patient', 'treatmentTypes'])
            ->orderBy('appointment_start_datetime')
            ->get()
            ->map(function ($appt) {
                return [
                    'time' => $appt->appointment_start_datetime?->format('g:i A') ?? 'No time',
                    'patient_name' => $appt->patient?->name ?? 'Unknown',
                    'status' => $appt->status,
                    'treatments' => $appt->treatmentTypes?->pluck('name')->join(', ') ?? '',
                    'purpose' => $appt->purpose_of_appointment,
                ];
            })
            ->toArray();
    }

    /**
     * Get all unique patients assigned to a dentist.
     *
     * @param int $dentistId The dentist's ID
     * @return array List of patients with their appointment counts
     */
    public function getAllPatients(int $dentistId): array
    {
        return Appointment::query()
            ->where('dentist_id', $dentistId)
            ->with(['patient'])
            ->get()
            ->unique('patient_id')
            ->map(function ($appt) use ($dentistId) {
                $appointmentCount = Appointment::where('patient_id', $appt->patient_id)
                    ->where('dentist_id', $dentistId)
                    ->count();
                
                $lastAppointment = Appointment::where('patient_id', $appt->patient_id)
                    ->where('dentist_id', $dentistId)
                    ->where('status', 'Completed')
                    ->latest('appointment_start_datetime')
                    ->first();

                return [
                    'name' => $appt->patient?->name ?? 'Unknown',
                    'contact' => $appt->patient?->contact_number ?? 'N/A',
                    'total_appointments' => $appointmentCount,
                    'last_visit' => $lastAppointment?->appointment_start_datetime 
                        ? $lastAppointment->appointment_start_datetime->format('M j, Y')
                        : 'No visits yet',
                ];
            })
            ->sortBy('name')
            ->values()
            ->toArray();
    }

    /**
     * Get all patients who have had appointments with a specific dentist by name.
     * Admin only - searches for dentist by name then returns all their patients.
     *
     * @param string $dentistName The dentist's name (partial or full)
     * @return array Patients with their appointment history
     */
    public function getPatientsByDentistName(string $dentistName): array
    {
        $searchTerm = '%' . strtolower($dentistName) . '%';
        
        // Find dentist(s) matching the name
        $dentists = \App\Models\User::query()
            ->where('role_id', 2) // Dentist role
            ->where(function ($query) use ($searchTerm) {
                $query->whereRaw("CONCAT_WS(' ', LOWER(fname), NULLIF(LOWER(mname), ''), LOWER(lname)) LIKE ?", [$searchTerm])
                    ->orWhereRaw("CONCAT(LOWER(fname), ' ', LOWER(lname)) LIKE ?", [$searchTerm])
                    ->orWhereRaw('LOWER(fname) LIKE ?', [$searchTerm])
                    ->orWhereRaw('LOWER(lname) LIKE ?', [$searchTerm]);
            })
            ->get();

        if ($dentists->isEmpty()) {
            return ['found' => false, 'message' => "No dentist found matching '{$dentistName}'."];
        }

        $dentist = $dentists->first();
        $dentistId = $dentist->id;

        // Get all patients who have had appointments with this dentist
        $patients = Appointment::query()
            ->where('dentist_id', $dentistId)
            ->with(['patient'])
            ->get()
            ->unique('patient_id')
            ->map(function ($appt) use ($dentistId) {
                $scheduledCount = Appointment::where('patient_id', $appt->patient_id)
                    ->where('dentist_id', $dentistId)
                    ->where('status', 'Scheduled')
                    ->count();
                    
                $completedCount = Appointment::where('patient_id', $appt->patient_id)
                    ->where('dentist_id', $dentistId)
                    ->where('status', 'Completed')
                    ->count();
                
                $lastAppointment = Appointment::where('patient_id', $appt->patient_id)
                    ->where('dentist_id', $dentistId)
                    ->latest('appointment_start_datetime')
                    ->first();

                return [
                    'name' => $appt->patient?->name ?? 'Unknown',
                    'contact' => $appt->patient?->contact_number ?: 'N/A',
                    'scheduled' => $scheduledCount,
                    'completed' => $completedCount,
                    'last_appointment' => $lastAppointment?->appointment_start_datetime 
                        ? $lastAppointment->appointment_start_datetime->format('M j, Y')
                        : 'N/A',
                ];
            })
            ->sortBy('name')
            ->values()
            ->toArray();

        return [
            'found' => true,
            'dentist_name' => $dentist->name,
            'patient_count' => count($patients),
            'patients' => $patients,
        ];
    }

    /**
     * Get all appointments by date range for admin viewing.
     *
     * @param string $period 'today', 'tomorrow', 'week', 'month', 'all', or a specific date
     * @return array
     */
    public function getAllAppointmentsByDateRange(string $period = 'today'): array
    {
        $query = Appointment::with(['patient', 'dentist', 'treatmentTypes']);

        // Determine date range
        $now = now();
        $isAll = false;
        switch (strtolower($period)) {
            case 'all':
            case 'all appointments':
            case 'all records':
                // No date filter - get all appointments
                $isAll = true;
                break;
            case 'today':
                $query->whereDate('appointment_start_datetime', $now->toDateString());
                break;
            case 'tomorrow':
                $query->whereDate('appointment_start_datetime', $now->addDay()->toDateString());
                break;
            case 'week':
            case 'this week':
                $query->whereBetween('appointment_start_datetime', [
                    $now->startOfWeek()->toDateTimeString(),
                    $now->endOfWeek()->toDateTimeString()
                ]);
                break;
            case 'month':
            case 'this month':
                $query->whereBetween('appointment_start_datetime', [
                    $now->startOfMonth()->toDateTimeString(),
                    $now->endOfMonth()->toDateTimeString()
                ]);
                break;
            default:
                // Try to parse as a specific date
                try {
                    $date = \Carbon\Carbon::parse($period);
                    $query->whereDate('appointment_start_datetime', $date->toDateString());
                } catch (\Exception $e) {
                    $query->whereDate('appointment_start_datetime', $now->toDateString());
                }
        }

        $appointments = $query
            ->orderBy('appointment_start_datetime', $isAll ? 'desc' : 'asc')
            ->limit($isAll ? 100 : 50)
            ->get();

        if ($appointments->isEmpty()) {
            return [
                'found' => false,
                'message' => "No appointments found for {$period}.",
            ];
        }

        return [
            'found' => true,
            'period' => $period,
            'count' => $appointments->count(),
            'appointments' => $appointments->map(function ($appt) {
                return [
                    'patient' => $appt->patient?->name ?? 'Unknown',
                    'dentist' => $appt->dentist?->name ?? 'Unknown',
                    'date' => $appt->appointment_start_datetime?->format('M j, Y') ?? 'No date',
                    'time' => $appt->appointment_start_datetime?->format('g:i A') ?? 'No time',
                    'treatment' => $appt->treatmentTypes?->pluck('name')->join(', ') ?: 'N/A',
                    'status' => $appt->status,
                ];
            })->toArray(),
        ];
    }

    /**
     * List all patients in the system for admin viewing.
     *
     * @return array
     */
    public function listAllPatients(): array
    {
        $patients = \App\Models\Patient::query()
            ->withCount('appointments')
            ->orderBy('lname')
            ->orderBy('fname')
            ->limit(100)
            ->get();

        if ($patients->isEmpty()) {
            return [
                'found' => false,
                'message' => 'No patients found in the system.',
            ];
        }

        return [
            'found' => true,
            'total_patients' => $patients->count(),
            'patients' => $patients->map(function ($patient) {
                return [
                    'name' => $patient->name,
                    'contact' => $patient->contact_number ?: 'N/A',
                    'email' => $patient->email ?: 'N/A',
                    'appointments' => $patient->appointments_count,
                ];
            })->toArray(),
        ];
    }

    /**
     * Find the next available appointment slot for a dentist.
     * Admin only - finds gaps in the dentist's schedule.
     *
     * @param string $dentistName The dentist's name
     * @param string $period 'today', 'tomorrow', 'week', or specific date
     * @return array Available slots or message
     */
    public function findNextAvailableSlot(string $dentistName, string $period = 'week'): array
    {
        $searchTerm = '%' . strtolower($dentistName) . '%';
        
        // Find the dentist
        $dentist = \App\Models\User::query()
            ->where('role_id', 2)
            ->whereHas('dentistProfile', function ($query) {
                $query->where('employment_status', 'Active');
            })
            ->where(function ($query) use ($searchTerm) {
                $query->whereRaw("CONCAT_WS(' ', LOWER(fname), NULLIF(LOWER(mname), ''), LOWER(lname)) LIKE ?", [$searchTerm])
                    ->orWhereRaw("CONCAT(LOWER(fname), ' ', LOWER(lname)) LIKE ?", [$searchTerm])
                    ->orWhereRaw('LOWER(fname) LIKE ?', [$searchTerm])
                    ->orWhereRaw('LOWER(lname) LIKE ?', [$searchTerm]);
            })
            ->first();

        if (!$dentist) {
            return ['found' => false, 'message' => "No active dentist found matching '{$dentistName}'."];
        }

        // Determine date range
        $now = now();
        $startDate = $now->copy()->startOfDay();
        $endDate = match(strtolower($period)) {
            'today' => $now->copy()->endOfDay(),
            'tomorrow' => $now->copy()->addDay()->endOfDay(),
            'week', 'this week' => $now->copy()->endOfWeek(),
            'month', 'this month' => $now->copy()->endOfMonth(),
            default => \Carbon\Carbon::parse($period)->endOfDay(),
        };

        // Get existing appointments for this dentist
        $existingAppointments = Appointment::query()
            ->where('dentist_id', $dentist->id)
            ->whereIn('status', ['Scheduled', 'In Progress'])
            ->whereBetween('appointment_start_datetime', [$startDate, $endDate])
            ->orderBy('appointment_start_datetime')
            ->get();

        // Get clinic hours
        $clinicHours = \Illuminate\Support\Facades\DB::table('clinic_availabilities')
            ->orderBy('day_of_week')
            ->get()
            ->keyBy('day_of_week');

        // Find available slots (checking each day)
        $availableSlots = [];
        $currentDate = $startDate->copy();
        $slotDuration = 60; // 60 minute slots by default

        while ($currentDate <= $endDate && count($availableSlots) < 5) {
            $dayOfWeek = $currentDate->dayOfWeekIso; // 1=Mon, 7=Sun
            $dayHours = $clinicHours->get($dayOfWeek);

            // Skip closed days
            if (!$dayHours || $dayHours->is_closed) {
                $currentDate->addDay()->startOfDay();
                continue;
            }

            // Check for closure exceptions
            $exception = \Illuminate\Support\Facades\DB::table('clinic_closure_exceptions')
                ->where('date', $currentDate->toDateString())
                ->where('is_closed', true)
                ->first();

            if ($exception) {
                $currentDate->addDay()->startOfDay();
                continue;
            }

            $openTime = \Carbon\Carbon::parse($currentDate->toDateString() . ' ' . $dayHours->open_time);
            $closeTime = \Carbon\Carbon::parse($currentDate->toDateString() . ' ' . $dayHours->close_time);

            // If today, start from now (rounded to next hour)
            if ($currentDate->isToday() && $now > $openTime) {
                $openTime = $now->copy()->ceilHour();
            }

            // Find appointments for this day
            $dayAppointments = $existingAppointments->filter(function ($appt) use ($currentDate) {
                return $appt->appointment_start_datetime->isSameDay($currentDate);
            })->sortBy('appointment_start_datetime');

            // Find gaps in schedule
            $slotStart = $openTime->copy();
            foreach ($dayAppointments as $appt) {
                $apptStart = $appt->appointment_start_datetime;
                $apptEnd = $appt->appointment_end_datetime ?? $apptStart->copy()->addMinutes($slotDuration);

                // If there's a gap before this appointment
                if ($slotStart < $apptStart && $slotStart->diffInMinutes($apptStart) >= $slotDuration) {
                    $availableSlots[] = [
                        'date' => $slotStart->format('l, M j, Y'),
                        'time' => $slotStart->format('g:i A'),
                        'duration' => min($slotStart->diffInMinutes($apptStart), $slotDuration) . ' minutes',
                    ];
                    if (count($availableSlots) >= 5) break;
                }

                // Move slot start to after this appointment
                $slotStart = $apptEnd > $slotStart ? $apptEnd->copy() : $slotStart;
            }

            // Check for slot after last appointment
            if (count($availableSlots) < 5 && $slotStart < $closeTime) {
                $availableSlots[] = [
                    'date' => $slotStart->format('l, M j, Y'),
                    'time' => $slotStart->format('g:i A'),
                    'duration' => $slotDuration . ' minutes',
                ];
            }

            $currentDate->addDay()->startOfDay();
        }

        if (empty($availableSlots)) {
            return [
                'found' => false,
                'dentist' => $dentist->name,
                'period' => $period,
                'message' => "No available slots found for {$dentist->name} during {$period}.",
            ];
        }

        return [
            'found' => true,
            'dentist' => $dentist->name,
            'period' => $period,
            'available_slots' => $availableSlots,
        ];
    }

    /**
     * Get appointment statistics for a time period.
     * Admin only - provides counts, completion rates, cancellation stats.
     *
     * @param string $period 'today', 'week', 'month', 'year', or 'all'
     * @return array Statistics
     */
    public function getAppointmentStatistics(string $period = 'month'): array
    {
        $now = now();
        $query = Appointment::query();

        // Apply date filter
        switch (strtolower($period)) {
            case 'today':
                $query->whereDate('appointment_start_datetime', $now->toDateString());
                $periodLabel = 'today';
                break;
            case 'week':
            case 'this week':
                $query->whereBetween('appointment_start_datetime', [
                    $now->copy()->startOfWeek(),
                    $now->copy()->endOfWeek()
                ]);
                $periodLabel = 'this week';
                break;
            case 'month':
            case 'this month':
                $query->whereBetween('appointment_start_datetime', [
                    $now->copy()->startOfMonth(),
                    $now->copy()->endOfMonth()
                ]);
                $periodLabel = 'this month';
                break;
            case 'year':
            case 'this year':
                $query->whereBetween('appointment_start_datetime', [
                    $now->copy()->startOfYear(),
                    $now->copy()->endOfYear()
                ]);
                $periodLabel = 'this year';
                break;
            default:
                $periodLabel = 'all time';
        }

        $total = $query->count();
        $scheduled = (clone $query)->where('status', 'Scheduled')->count();
        $completed = (clone $query)->where('status', 'Completed')->count();
        $cancelled = (clone $query)->where('status', 'Cancelled')->count();

        $completionRate = $total > 0 ? round(($completed / $total) * 100, 1) : 0;
        $cancellationRate = $total > 0 ? round(($cancelled / $total) * 100, 1) : 0;

        return [
            'period' => $periodLabel,
            'total_appointments' => $total,
            'scheduled' => $scheduled,
            'completed' => $completed,
            'cancelled' => $cancelled,
            'completion_rate' => $completionRate . '%',
            'cancellation_rate' => $cancellationRate . '%',
        ];
    }

    /**
     * Get treatment history for a specific patient.
     * Admin/Dentist - shows all treatments a patient has received.
     *
     * @param string $patientName Patient name to search
     * @param int|null $dentistId Optional dentist scope
     * @return array Treatment history
     */
    public function getPatientTreatmentHistory(string $patientName, ?int $dentistId = null): array
    {
        $searchTerm = '%' . strtolower($patientName) . '%';
        
        $patients = Patient::query()
            ->where(function ($query) use ($searchTerm) {
                $query->whereRaw("CONCAT_WS(' ', LOWER(fname), NULLIF(LOWER(mname), ''), LOWER(lname)) LIKE ?", [$searchTerm])
                    ->orWhereRaw("CONCAT(LOWER(fname), ' ', LOWER(lname)) LIKE ?", [$searchTerm])
                    ->orWhereRaw('LOWER(fname) LIKE ?', [$searchTerm])
                    ->orWhereRaw('LOWER(lname) LIKE ?', [$searchTerm]);
            })
            ->pluck('id');

        if ($patients->isEmpty()) {
            return ['found' => false, 'message' => "No patient found matching '{$patientName}'."];
        }

        $query = Appointment::query()
            ->whereIn('patient_id', $patients)
            ->whereIn('status', ['Completed', 'Scheduled'])
            ->with(['patient', 'treatmentTypes', 'treatmentRecords']);

        if ($dentistId) {
            $query->where('dentist_id', $dentistId);
        }

        $appointments = $query->orderBy('appointment_start_datetime', 'desc')->limit(10)->get();

        if ($appointments->isEmpty()) {
            return ['found' => false, 'message' => "No treatment history found for '{$patientName}'."];
        }

        $patient = $appointments->first()?->patient;
        $treatments = [];

        foreach ($appointments as $appt) {
            foreach ($appt->treatmentTypes ?? [] as $treatment) {
                $treatments[] = [
                    'treatment' => $treatment?->name ?? 'Unknown',
                    'date' => $appt->appointment_start_datetime?->format('M j, Y') ?? 'No date',
                    'status' => $appt->status,
                    'notes' => $appt->treatmentRecords?->where('treatment_type_id', $treatment?->id)->first()?->treatment_notes ?? null,
                ];
            }
        }

        return [
            'found' => true,
            'patient' => $patient?->name ?? 'Unknown',
            'treatment_count' => count($treatments),
            'treatments' => $treatments,
        ];
    }

    /**
     * Get most popular treatments by appointment count.
     * Admin only.
     *
     * @param string $period 'week', 'month', 'year', 'all'
     * @return array Popular treatments
     */
    public function getPopularTreatments(string $period = 'month'): array
    {
        $now = now();
        $query = \Illuminate\Support\Facades\DB::table('appointment_treatments_records')
            ->join('treatment_types', 'appointment_treatments_records.treatment_type_id', '=', 'treatment_types.id')
            ->join('appointments', 'appointment_treatments_records.appointment_id', '=', 'appointments.id');

        // Apply date filter
        switch (strtolower($period)) {
            case 'week':
            case 'this week':
                $query->whereBetween('appointments.appointment_start_datetime', [
                    $now->copy()->startOfWeek(),
                    $now->copy()->endOfWeek()
                ]);
                $periodLabel = 'this week';
                break;
            case 'month':
            case 'this month':
                $query->whereBetween('appointments.appointment_start_datetime', [
                    $now->copy()->startOfMonth(),
                    $now->copy()->endOfMonth()
                ]);
                $periodLabel = 'this month';
                break;
            case 'year':
            case 'this year':
                $query->whereBetween('appointments.appointment_start_datetime', [
                    $now->copy()->startOfYear(),
                    $now->copy()->endOfYear()
                ]);
                $periodLabel = 'this year';
                break;
            default:
                $periodLabel = 'all time';
        }

        $treatments = $query
            ->select('treatment_types.name', \Illuminate\Support\Facades\DB::raw('COUNT(*) as count'))
            ->groupBy('treatment_types.id', 'treatment_types.name')
            ->orderByDesc('count')
            ->limit(10)
            ->get();

        if ($treatments->isEmpty()) {
            return ['found' => false, 'message' => "No treatment data found for {$periodLabel}."];
        }

        return [
            'found' => true,
            'period' => $periodLabel,
            'treatments' => $treatments->map(function ($t) {
                return [
                    'name' => $t->name,
                    'count' => $t->count,
                ];
            })->toArray(),
        ];
    }

    /**
     * Get full patient details by name.
     * Admin/Dentist.
     *
     * @param string $patientName Patient name to search
     * @return array Patient details
     */
    public function getPatientDetails(string $patientName): array
    {
        $searchTerm = '%' . strtolower($patientName) . '%';
        
        $patient = Patient::query()
            ->where(function ($query) use ($searchTerm) {
                $query->whereRaw("CONCAT_WS(' ', LOWER(fname), NULLIF(LOWER(mname), ''), LOWER(lname)) LIKE ?", [$searchTerm])
                    ->orWhereRaw("CONCAT(LOWER(fname), ' ', LOWER(lname)) LIKE ?", [$searchTerm])
                    ->orWhereRaw('LOWER(fname) LIKE ?', [$searchTerm])
                    ->orWhereRaw('LOWER(lname) LIKE ?', [$searchTerm]);
            })
            ->first();

        if (!$patient) {
            return ['found' => false, 'message' => "No patient found matching '{$patientName}'."];
        }

        // Get appointment stats
        $totalAppointments = Appointment::where('patient_id', $patient->id)->count();
        $completedAppointments = Appointment::where('patient_id', $patient->id)->where('status', 'Completed')->count();
        $lastVisit = Appointment::where('patient_id', $patient->id)
            ->where('status', 'Completed')
            ->latest('appointment_start_datetime')
            ->first();
        $nextAppointment = Appointment::where('patient_id', $patient->id)
            ->where('status', 'Scheduled')
            ->where('appointment_start_datetime', '>=', now())
            ->oldest('appointment_start_datetime')
            ->first();

        return [
            'found' => true,
            'patient' => [
                'name' => $patient->name,
                'email' => $patient->email,
                'contact' => $patient->contact_number ?: 'N/A',
                'gender' => $patient->gender,
                'date_of_birth' => $patient->date_of_birth 
                    ? \Carbon\Carbon::parse($patient->date_of_birth)->format('F j, Y') 
                    : 'Unknown',
                'age' => $patient->date_of_birth 
                    ? \Carbon\Carbon::parse($patient->date_of_birth)->age . ' years old' 
                    : 'Unknown',
                'address' => $patient->address,
            ],
            'statistics' => [
                'total_appointments' => $totalAppointments,
                'completed_appointments' => $completedAppointments,
                'last_visit' => $lastVisit?->appointment_start_datetime 
                    ? $lastVisit->appointment_start_datetime->format('M j, Y') 
                    : 'Never',
                'next_appointment' => $nextAppointment?->appointment_start_datetime 
                    ? $nextAppointment->appointment_start_datetime->format('M j, Y g:i A') 
                    : 'None scheduled',
            ],
        ];
    }

    /**
     * Get estimated revenue from completed appointments.
     * Admin only - calculates total based on treatment standard costs.
     *
     * @param string $period 'today', 'week', 'month', 'year', 'all'
     * @return array Revenue data
     */
    public function getRevenueEstimate(string $period = 'month'): array
    {
        $now = now();
        $query = \Illuminate\Support\Facades\DB::table('appointments')
            ->join('appointment_treatments_records', 'appointments.id', '=', 'appointment_treatments_records.appointment_id')
            ->join('treatment_types', 'appointment_treatments_records.treatment_type_id', '=', 'treatment_types.id')
            ->where('appointments.status', 'Completed');

        // Apply date filter
        switch (strtolower($period)) {
            case 'today':
                $query->whereDate('appointments.appointment_start_datetime', $now->toDateString());
                $periodLabel = 'today';
                $dateRange = $now->format('F j, Y');
                break;
            case 'week':
            case 'this week':
                $startOfWeek = $now->copy()->startOfWeek();
                $endOfWeek = $now->copy()->endOfWeek();
                $query->whereBetween('appointments.appointment_start_datetime', [$startOfWeek, $endOfWeek]);
                $periodLabel = 'this week';
                $dateRange = $startOfWeek->format('M j') . ' - ' . $endOfWeek->format('M j, Y');
                break;
            case 'month':
            case 'this month':
                $startOfMonth = $now->copy()->startOfMonth();
                $endOfMonth = $now->copy()->endOfMonth();
                $query->whereBetween('appointments.appointment_start_datetime', [$startOfMonth, $endOfMonth]);
                $periodLabel = 'this month';
                $dateRange = $now->format('F Y');
                break;
            case 'year':
            case 'this year':
                $startOfYear = $now->copy()->startOfYear();
                $endOfYear = $now->copy()->endOfYear();
                $query->whereBetween('appointments.appointment_start_datetime', [$startOfYear, $endOfYear]);
                $periodLabel = 'this year';
                $dateRange = $now->format('Y');
                break;
            default:
                $periodLabel = 'all time';
                $dateRange = 'All records';
        }

        $totalRevenue = $query->sum('treatment_types.standard_cost');
        $appointmentCount = (clone $query)->distinct('appointments.id')->count('appointments.id');

        // Get breakdown by treatment
        $breakdown = \Illuminate\Support\Facades\DB::table('appointments')
            ->join('appointment_treatments_records', 'appointments.id', '=', 'appointment_treatments_records.appointment_id')
            ->join('treatment_types', 'appointment_treatments_records.treatment_type_id', '=', 'treatment_types.id')
            ->where('appointments.status', 'Completed');

        // Re-apply date filter for breakdown
        switch (strtolower($period)) {
            case 'today':
                $breakdown->whereDate('appointments.appointment_start_datetime', $now->toDateString());
                break;
            case 'week':
            case 'this week':
                $breakdown->whereBetween('appointments.appointment_start_datetime', [$now->copy()->startOfWeek(), $now->copy()->endOfWeek()]);
                break;
            case 'month':
            case 'this month':
                $breakdown->whereBetween('appointments.appointment_start_datetime', [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()]);
                break;
            case 'year':
            case 'this year':
                $breakdown->whereBetween('appointments.appointment_start_datetime', [$now->copy()->startOfYear(), $now->copy()->endOfYear()]);
                break;
        }

        $treatmentBreakdown = $breakdown
            ->select(
                'treatment_types.name',
                \Illuminate\Support\Facades\DB::raw('COUNT(*) as count'),
                \Illuminate\Support\Facades\DB::raw('SUM(treatment_types.standard_cost) as total')
            )
            ->groupBy('treatment_types.id', 'treatment_types.name')
            ->orderByDesc('total')
            ->limit(5)
            ->get();

        return [
            'period' => $periodLabel,
            'date_range' => $dateRange,
            'total_revenue' => '₱' . number_format($totalRevenue, 2),
            'completed_appointments' => $appointmentCount,
            'average_per_appointment' => $appointmentCount > 0 
                ? '₱' . number_format($totalRevenue / $appointmentCount, 2) 
                : '₱0.00',
            'top_revenue_treatments' => $treatmentBreakdown->map(function ($t) {
                return [
                    'treatment' => $t->name,
                    'count' => $t->count,
                    'revenue' => '₱' . number_format($t->total, 2),
                ];
            })->toArray(),
        ];
    }

    /**
     * Get dentist performance metrics.
     * Admin only - shows appointments completed, patients seen.
     *
     * @param string $period 'week', 'month', 'year', 'all'
     * @return array Performance data per dentist
     */
    public function getDentistPerformance(string $period = 'month'): array
    {
        $now = now();
        $query = Appointment::query()->where('status', 'Completed');

        // Apply date filter
        switch (strtolower($period)) {
            case 'week':
            case 'this week':
                $query->whereBetween('appointment_start_datetime', [
                    $now->copy()->startOfWeek(),
                    $now->copy()->endOfWeek()
                ]);
                $periodLabel = 'this week';
                break;
            case 'month':
            case 'this month':
                $query->whereBetween('appointment_start_datetime', [
                    $now->copy()->startOfMonth(),
                    $now->copy()->endOfMonth()
                ]);
                $periodLabel = 'this month';
                break;
            case 'year':
            case 'this year':
                $query->whereBetween('appointment_start_datetime', [
                    $now->copy()->startOfYear(),
                    $now->copy()->endOfYear()
                ]);
                $periodLabel = 'this year';
                break;
            default:
                $periodLabel = 'all time';
        }

        $appointments = $query->with(['dentist', 'patient'])->get();

        $dentistStats = $appointments->groupBy('dentist_id')->map(function ($dentistAppts) {
            $dentist = $dentistAppts->first()->dentist;
            $uniquePatients = $dentistAppts->pluck('patient_id')->unique()->count();
            return [
                'name' => $dentist->name,
                'appointments_completed' => $dentistAppts->count(),
                'unique_patients' => $uniquePatients,
            ];
        })->sortByDesc('appointments_completed')->values();

        if ($dentistStats->isEmpty()) {
            return ['found' => false, 'message' => "No completed appointments found for {$periodLabel}."];
        }

        return [
            'found' => true,
            'period' => $periodLabel,
            'dentist_count' => $dentistStats->count(),
            'performance' => $dentistStats->toArray(),
        ];
    }

    /**
     * Get treatment notes for a patient.
     * Admin sees all, dentist sees only their own notes.
     *
     * @param string $patientName Patient name to search
     * @param int|null $dentistId Scope to dentist if provided
     * @return array Treatment notes
     */
    public function getTreatmentNotes(string $patientName, ?int $dentistId = null): array
    {
        $searchTerm = '%' . strtolower($patientName) . '%';
        
        $patients = Patient::query()
            ->where(function ($query) use ($searchTerm) {
                $query->whereRaw("CONCAT_WS(' ', LOWER(fname), NULLIF(LOWER(mname), ''), LOWER(lname)) LIKE ?", [$searchTerm])
                    ->orWhereRaw("CONCAT(LOWER(fname), ' ', LOWER(lname)) LIKE ?", [$searchTerm])
                    ->orWhereRaw('LOWER(fname) LIKE ?', [$searchTerm])
                    ->orWhereRaw('LOWER(lname) LIKE ?', [$searchTerm]);
            })
            ->pluck('id');

        if ($patients->isEmpty()) {
            return ['found' => false, 'message' => "No patient found matching '{$patientName}'."];
        }

        $query = Appointment::query()
            ->whereIn('patient_id', $patients)
            ->where('status', 'Completed')
            ->with(['patient', 'dentist', 'treatmentRecords.treatmentType']);

        if ($dentistId) {
            $query->where('dentist_id', $dentistId);
        }

        $appointments = $query->orderBy('appointment_start_datetime', 'desc')->limit(10)->get();

        if ($appointments->isEmpty()) {
            return ['found' => false, 'message' => "No treatment records found for '{$patientName}'." . ($dentistId ? " (with you)" : "")];
        }

        $patient = $appointments->first()->patient;
        $notes = [];

        foreach ($appointments as $appt) {
            foreach ($appt->treatmentRecords as $record) {
                if (!empty($record->treatment_notes)) {
                    $notes[] = [
                        'date' => $appt->appointment_start_datetime->format('M j, Y'),
                        'treatment' => $record->treatmentType?->name ?? 'Unknown',
                        'dentist' => $appt->dentist->name,
                        'notes' => $record->treatment_notes,
                    ];
                }
            }
        }

        if (empty($notes)) {
            return ['found' => false, 'message' => "No treatment notes recorded for '{$patientName}'."];
        }

        return [
            'found' => true,
            'patient' => $patient->name,
            'notes_count' => count($notes),
            'notes' => $notes,
        ];
    }

    /**
     * Get upcoming busy periods based on scheduled appointments.
     * Admin only - identifies busy days/times.
     *
     * @param string $period 'week' or 'month'
     * @return array Busy periods data
     */
    public function getUpcomingBusyPeriods(string $period = 'week'): array
    {
        $now = now();
        $endDate = strtolower($period) === 'month' 
            ? $now->copy()->endOfMonth() 
            : $now->copy()->endOfWeek();

        $appointments = Appointment::query()
            ->where('status', 'Scheduled')
            ->whereBetween('appointment_start_datetime', [$now, $endDate])
            ->orderBy('appointment_start_datetime')
            ->get();

        if ($appointments->isEmpty()) {
            return ['found' => false, 'message' => "No scheduled appointments found for the upcoming {$period}."];
        }

        // Group by day
        $dailyCounts = $appointments->groupBy(function ($appt) {
            return $appt->appointment_start_datetime->format('Y-m-d');
        })->map(function ($dayAppts, $date) {
            return [
                'date' => \Carbon\Carbon::parse($date)->format('l, M j'),
                'appointment_count' => $dayAppts->count(),
                'dentists_busy' => $dayAppts->pluck('dentist_id')->unique()->count(),
            ];
        })->sortByDesc('appointment_count')->values();

        // Find busiest times
        $hourCounts = $appointments->groupBy(function ($appt) {
            return $appt->appointment_start_datetime->format('g A');
        })->map(function ($hourAppts, $hour) {
            return ['time' => $hour, 'count' => $hourAppts->count()];
        })->sortByDesc('count')->values()->take(3);

        $busiestDay = $dailyCounts->first();

        return [
            'found' => true,
            'period' => strtolower($period) === 'month' ? 'this month' : 'this week',
            'total_scheduled' => $appointments->count(),
            'busiest_day' => $busiestDay,
            'busiest_times' => $hourCounts->toArray(),
            'daily_breakdown' => $dailyCounts->take(5)->toArray(),
        ];
    }

    /**
     * Search patients by various criteria.
     * Admin/Dentist - supports name, email, gender, age range.
     *
     * @param array $criteria Search criteria
     * @param int|null $dentistId Scope to dentist's patients only
     * @return array Matching patients
     */
    public function searchPatients(array $criteria, ?int $dentistId = null): array
    {
        $query = Patient::query();

        // Name search
        if (!empty($criteria['name'])) {
            $searchTerm = '%' . strtolower($criteria['name']) . '%';
            $query->where(function ($q) use ($searchTerm) {
                $q->whereRaw("CONCAT_WS(' ', LOWER(fname), LOWER(lname)) LIKE ?", [$searchTerm])
                    ->orWhereRaw('LOWER(fname) LIKE ?', [$searchTerm])
                    ->orWhereRaw('LOWER(lname) LIKE ?', [$searchTerm]);
            });
        }

        // Gender filter
        if (!empty($criteria['gender'])) {
            $query->where('gender', ucfirst(strtolower($criteria['gender'])));
        }

        // Age range (using date_of_birth)
        if (!empty($criteria['minAge'])) {
            $maxBirthDate = now()->subYears((int)$criteria['minAge'])->toDateString();
            $query->where('date_of_birth', '<=', $maxBirthDate);
        }
        if (!empty($criteria['maxAge'])) {
            $minBirthDate = now()->subYears((int)$criteria['maxAge'] + 1)->toDateString();
            $query->where('date_of_birth', '>', $minBirthDate);
        }

        // If dentist, only show their patients
        if ($dentistId) {
            $patientIds = Appointment::where('dentist_id', $dentistId)
                ->pluck('patient_id')
                ->unique();
            $query->whereIn('id', $patientIds);
        }

        $patients = $query->withCount('appointments')
            ->orderBy('lname')
            ->limit(20)
            ->get();

        if ($patients->isEmpty()) {
            return ['found' => false, 'message' => 'No patients found matching the criteria.'];
        }

        return [
            'found' => true,
            'count' => $patients->count(),
            'patients' => $patients->map(function ($p) {
                $age = $p->date_of_birth 
                    ? \Carbon\Carbon::parse($p->date_of_birth)->age 
                    : 'Unknown';
                return [
                    'name' => $p->name,
                    'gender' => $p->gender,
                    'age' => $age,
                    'email' => $p->email,
                    'contact' => $p->contact_number ?: 'N/A',
                    'appointments' => $p->appointments_count,
                ];
            })->toArray(),
        ];
    }

    /**
     * Get patient age distribution statistics.
     * Admin only.
     *
     * @return array Age distribution by groups
     */
    public function getPatientAgeDistribution(): array
    {
        $patients = Patient::all();

        if ($patients->isEmpty()) {
            return ['found' => false, 'message' => 'No patients in the system.'];
        }

        $groups = [
            '0-12 (Children)' => 0,
            '13-17 (Teens)' => 0,
            '18-30 (Young Adults)' => 0,
            '31-50 (Adults)' => 0,
            '51-65 (Middle Age)' => 0,
            '65+ (Seniors)' => 0,
        ];

        $ages = [];
        foreach ($patients as $patient) {
            if (!$patient->date_of_birth) continue;
            
            $age = \Carbon\Carbon::parse($patient->date_of_birth)->age;
            $ages[] = $age;
            
            if ($age <= 12) $groups['0-12 (Children)']++;
            elseif ($age <= 17) $groups['13-17 (Teens)']++;
            elseif ($age <= 30) $groups['18-30 (Young Adults)']++;
            elseif ($age <= 50) $groups['31-50 (Adults)']++;
            elseif ($age <= 65) $groups['51-65 (Middle Age)']++;
            else $groups['65+ (Seniors)']++;
        }

        $averageAge = count($ages) > 0 ? round(array_sum($ages) / count($ages), 1) : 0;

        return [
            'found' => true,
            'total_patients' => $patients->count(),
            'distribution' => $groups,
            'average_age' => $averageAge,
        ];
    }

    /**
     * Get treatment history for a specific tooth.
     * Admin/Dentist.
     *
     * @param string $toothIdentifier Tooth number or name
     * @param int|null $dentistId Scope to dentist's patients
     * @return array Treatments on this tooth
     */
    public function getToothTreatmentHistory(string $toothIdentifier, ?int $dentistId = null): array
    {
        // Clean up the identifier - remove # symbol if present
        $cleanIdentifier = str_replace('#', '', trim($toothIdentifier));
        
        $tooth = \App\Models\Tooth::where('name', 'ilike', "%{$cleanIdentifier}%")->first();

        if (!$tooth) {
            return ['found' => false, 'message' => "No tooth found matching '{$toothIdentifier}'. Please check the tooth number or name."];
        }

        $query = \App\Models\TreatmentRecord::whereHas('teeth', function ($q) use ($tooth) {
            $q->where('teeth.id', $tooth->id);
        })
        ->with(['treatmentType', 'appointment.patient', 'appointment.dentist']);

        if ($dentistId) {
            $query->whereHas('appointment', fn($q) => $q->where('dentist_id', $dentistId));
        }

        $records = $query->orderBy('created_at', 'desc')->limit(20)->get();

        if ($records->isEmpty()) {
            return ['found' => false, 'message' => "No treatments found for tooth '{$tooth->name}'."];
        }

        return [
            'found' => true,
            'tooth' => $tooth->name,
            'treatment_count' => $records->count(),
            'treatments' => $records->map(function ($r) {
                $date = 'Unknown date';
                if ($r->appointment && $r->appointment->appointment_start_datetime) {
                    $date = $r->appointment->appointment_start_datetime->format('M j, Y');
                }
                
                return [
                    'date' => $date,
                    'treatment' => $r->treatmentType->name ?? 'Unknown',
                    'patient' => $r->appointment?->patient?->name ?? 'Unknown',
                    'dentist' => $r->appointment?->dentist?->name ?? 'Unknown',
                    'notes' => $r->treatment_notes ? substr($r->treatment_notes, 0, 100) . '...' : 'No notes',
                ];
            })->toArray(),
        ];
    }

    /**
     * Get cancellation insights and patterns.
     * Admin only.
     *
     * @param string $period 'week', 'month', 'year', 'all'
     * @return array Cancellation statistics
     */
    public function getCancellationInsights(string $period = 'month'): array
    {
        $query = Appointment::where('status', 'Cancelled');

        // Apply date filter
        $now = \Carbon\Carbon::now();
        switch ($period) {
            case 'week':
                $query->where('appointment_start_datetime', '>=', $now->copy()->startOfWeek());
                break;
            case 'month':
                $query->where('appointment_start_datetime', '>=', $now->copy()->startOfMonth());
                break;
            case 'year':
                $query->where('appointment_start_datetime', '>=', $now->copy()->startOfYear());
                break;
        }

        $cancelled = $query->with(['patient', 'dentist'])->get();
        $totalAppointments = Appointment::count();

        if ($cancelled->isEmpty()) {
            return [
                'found' => true,
                'message' => "No cancellations found for the selected period.",
                'cancellation_rate' => '0%',
            ];
        }

        // Analyze reasons
        $reasons = $cancelled->groupBy(function ($apt) {
            $reason = strtolower($apt->cancellation_reason ?? '');
            if (empty($reason)) return 'No reason provided';
            if (str_contains($reason, 'sick') || str_contains($reason, 'ill')) return 'Health/Illness';
            if (str_contains($reason, 'work') || str_contains($reason, 'busy')) return 'Work/Schedule conflict';
            if (str_contains($reason, 'emergency')) return 'Emergency';
            if (str_contains($reason, 'reschedule')) return 'Rescheduled';
            return 'Other';
        })->map->count();

        return [
            'found' => true,
            'period' => $period,
            'total_cancelled' => $cancelled->count(),
            'cancellation_rate' => round(($cancelled->count() / max($totalAppointments, 1)) * 100, 1) . '%',
            'reasons_breakdown' => $reasons->toArray(),
            'top_reason' => $reasons->sortDesc()->keys()->first(),
        ];
    }

    /**
     * Get patients with upcoming birthdays.
     * Admin/Dentist.
     *
     * @param string $period 'week', 'month'
     * @param int|null $dentistId Scope to dentist's patients
     * @return array Patients with birthdays
     */
    public function getUpcomingPatientBirthdays(string $period = 'month', ?int $dentistId = null): array
    {
        $now = \Carbon\Carbon::now();
        $endDate = $period === 'week' ? $now->copy()->addWeek() : $now->copy()->addMonth();

        $query = Patient::query();

        if ($dentistId) {
            $query->whereHas('appointments', fn($q) => $q->where('dentist_id', $dentistId));
        }

        $patients = $query->get()->filter(function ($patient) use ($now, $endDate) {
            $birthday = \Carbon\Carbon::parse($patient->date_of_birth);
            $thisYearBirthday = $birthday->copy()->year($now->year);
            
            // Handle year boundary
            if ($thisYearBirthday->lt($now)) {
                $thisYearBirthday->addYear();
            }
            
            return $thisYearBirthday->between($now, $endDate);
        })->values();

        if ($patients->isEmpty()) {
            return ['found' => false, 'message' => "No patient birthdays in the next {$period}."];
        }

        return [
            'found' => true,
            'period' => $period,
            'count' => $patients->count(),
            'patients' => $patients->map(function ($p) use ($now) {
                $birthday = \Carbon\Carbon::parse($p->date_of_birth);
                $thisYearBirthday = $birthday->copy()->year($now->year);
                if ($thisYearBirthday->lt($now)) $thisYearBirthday->addYear();
                
                return [
                    'name' => $p->name,
                    'birthday' => $thisYearBirthday->format('M j'),
                    'turning_age' => $thisYearBirthday->year - $birthday->year,
                    'days_until' => $now->diffInDays($thisYearBirthday),
                ];
            })->sortBy('days_until')->values()->toArray(),
        ];
    }

    /**
     * Compare workload between dentists.
     * Admin only.
     *
     * @param string $period 'week', 'month', 'year'
     * @return array Workload comparison
     */
    public function compareDentistWorkload(string $period = 'month'): array
    {
        $now = \Carbon\Carbon::now();
        $startDate = match ($period) {
            'week' => $now->copy()->startOfWeek(),
            'month' => $now->copy()->startOfMonth(),
            'year' => $now->copy()->startOfYear(),
            default => $now->copy()->startOfMonth(),
        };

        $dentists = \App\Models\User::where('role_id', 2)->get();

        if ($dentists->isEmpty()) {
            return ['found' => false, 'message' => 'No dentists found in the system.'];
        }

        $workload = $dentists->map(function ($dentist) use ($startDate) {
            $appointments = Appointment::where('dentist_id', $dentist->id)
                ->where('appointment_start_datetime', '>=', $startDate)
                ->get();

            $completed = $appointments->where('status', 'Completed')->count();
            $scheduled = $appointments->where('status', 'Scheduled')->count();
            $cancelled = $appointments->where('status', 'Cancelled')->count();

            return [
                'dentist' => $dentist->name,
                'total_appointments' => $appointments->count(),
                'completed' => $completed,
                'scheduled' => $scheduled,
                'cancelled' => $cancelled,
                'completion_rate' => $appointments->count() > 0 
                    ? round(($completed / $appointments->count()) * 100, 1) . '%' 
                    : 'N/A',
            ];
        })->sortByDesc('total_appointments')->values();

        return [
            'found' => true,
            'period' => $period,
            'dentist_count' => $dentists->count(),
            'comparison' => $workload->toArray(),
            'busiest_dentist' => $workload->first()['dentist'] ?? 'N/A',
            'average_load' => round($workload->avg('total_appointments'), 1),
        ];
    }
}

