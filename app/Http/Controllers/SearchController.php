<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Patient;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    /**
     * Global search across patients, dentists, and appointments.
     */
    public function search(Request $request)
    {
        $query = $request->input('q', '');
        $results = [];

        if (strlen($query) < 2) {
            return response()->json(['results' => []]);
        }

        $user = $request->user();
        $isAdmin = $user->role_id === 1;

        // Search patients
        $patients = Patient::where(function ($q) use ($query) {
            $q->where('fname', 'like', "%{$query}%")
                ->orWhere('lname', 'like', "%{$query}%")
                ->orWhere('email', 'like', "%{$query}%");
        })
            ->limit(5)
            ->get()
            ->map(function ($patient) {
                return [
                    'id' => $patient->id,
                    'type' => 'patient',
                    'title' => trim("{$patient->fname} {$patient->lname}"),
                    'subtitle' => $patient->email ?: 'No email',
                    'url' => "/patients/{$patient->id}",
                ];
            });

        $results = array_merge($results, $patients->toArray());

        // Search dentists (admin only)
        if ($isAdmin) {
            $dentists = User::where('role_id', 2)
                ->where(function ($q) use ($query) {
                    $q->where('fname', 'like', "%{$query}%")
                        ->orWhere('lname', 'like', "%{$query}%")
                        ->orWhere('email', 'like', "%{$query}%");
                })
                ->limit(5)
                ->get()
                ->map(function ($dentist) {
                    return [
                        'id' => $dentist->id,
                        'type' => 'dentist',
                        'title' => trim("{$dentist->fname} {$dentist->lname}"),
                        'subtitle' => $dentist->email,
                        'url' => "/admin/dentists/{$dentist->id}",
                    ];
                });

            $results = array_merge($results, $dentists->toArray());
        }

        // Search appointments by patient name or purpose
        $appointmentQuery = Appointment::with(['patient', 'dentist'])
            ->where(function ($q) use ($query) {
                $q->whereHas('patient', function ($pq) use ($query) {
                    $pq->where('fname', 'like', "%{$query}%")
                        ->orWhere('lname', 'like', "%{$query}%");
                })
                    ->orWhere('purpose_of_appointment', 'like', "%{$query}%");
            });

        // Dentists can only see their own appointments
        if (!$isAdmin) {
            $appointmentQuery->where('dentist_id', $user->id);
        }

        $appointments = $appointmentQuery
            ->orderBy('appointment_start_datetime', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($apt) {
                $patientName = $apt->patient ? trim("{$apt->patient->fname} {$apt->patient->lname}") : 'N/A';
                return [
                    'id' => $apt->id,
                    'type' => 'appointment',
                    'title' => "Appointment: {$patientName}",
                    'subtitle' => Carbon::parse($apt->appointment_start_datetime)->format('M d, Y g:i A'),
                    'url' => "/appointments/{$apt->id}",
                ];
            });

        $results = array_merge($results, $appointments->toArray());

        return response()->json(['results' => $results]);
    }
}
