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
            'patient_name' => $appointment->patient->name,
            'date' => $appointment->appointment_start_datetime->format('F j, Y'),
            'time' => $appointment->appointment_start_datetime->format('g:i A'),
            'dentist_name' => $appointment->dentist->name,
            'treatment_types' => $appointment->treatmentTypes->pluck('name')->toArray(),
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
                'date' => $appt->appointment_start_datetime->format('F j, Y'),
                'time' => $appt->appointment_start_datetime->format('g:i A'),
                'status' => $appt->status, // Scheduled, Completed, Cancelled
                'dentist' => $appt->dentist->name,
                'treatments' => $appt->treatmentTypes->pluck('name')->join(', '),
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
                    'patient_name' => $appt->patient->name,
                    'contact' => $appt->patient->contact_number,
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
                    'time' => $appt->appointment_start_datetime->format('g:i A'),
                    'patient_name' => $appt->patient->name,
                    'status' => $appt->status,
                    'treatments' => $appt->treatmentTypes->pluck('name')->join(', '),
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
                    'name' => $appt->patient->name,
                    'contact' => $appt->patient->contact_number,
                    'total_appointments' => $appointmentCount,
                    'last_visit' => $lastAppointment 
                        ? $lastAppointment->appointment_start_datetime->format('M j, Y')
                        : 'No visits yet',
                ];
            })
            ->sortBy('name')
            ->values()
            ->toArray();
    }
}
