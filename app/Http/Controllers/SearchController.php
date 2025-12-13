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

        // Search Pages (Navigation)
        $pages = [
            ['title' => 'Dashboard', 'url' => '/dashboard', 'keywords' => 'home start stats', 'roles' => [1, 2]],
            ['title' => 'Appointments', 'url' => '/appointments', 'keywords' => 'calendar schedule booking', 'roles' => [1, 2]],
            ['title' => 'Patients', 'url' => '/patients', 'keywords' => 'people clients', 'roles' => [1, 2]],
            ['title' => 'Treatment Records', 'url' => '/treatment-records', 'keywords' => 'history medical logs', 'roles' => [1, 2]],
            ['title' => 'Clinic Availability', 'url' => '/admin/clinic-availability', 'keywords' => 'hours schedule open close', 'roles' => [1, 2]],
            ['title' => 'Specializations', 'url' => '/admin/specializations', 'keywords' => 'categories types', 'roles' => [1, 2]],
            ['title' => 'Treatment Types', 'url' => '/admin/treatment-types', 'keywords' => 'services procedures prices', 'roles' => [1, 2]],
            ['title' => 'Reports', 'url' => '/admin/reports', 'keywords' => 'analytics stats data export', 'roles' => [1, 2]],
            ['title' => 'Manage Dentists', 'url' => '/admin/dentists', 'keywords' => 'doctors staff employees', 'roles' => [1]],
            ['title' => 'Manage Users', 'url' => '/admin/users', 'keywords' => 'admins accounts', 'roles' => [1]],
            ['title' => 'Audit Logs', 'url' => '/admin/audit-logs', 'keywords' => 'history tracking security', 'roles' => [1]],
            ['title' => 'My Profile', 'url' => '/dentist/profile', 'keywords' => 'account settings me', 'roles' => [2]],
        ];

        $pageResults = collect($pages)
            ->filter(function ($page) use ($query, $user) {
                // Check role access
                if (!in_array($user->role_id, $page['roles'])) {
                    return false;
                }
                // Check match
                return stripos($page['title'], $query) !== false || 
                       stripos($page['keywords'], $query) !== false;
            })
            ->map(function ($page) {
                return [
                    'id' => rand(1000, 9999), // Randomized ID for key uniqueness
                    'type' => 'page',
                    'title' => $page['title'],
                    'subtitle' => 'Navigation',
                    'url' => $page['url'],
                ];
            })
            ->values()
            ->toArray();

        $results = array_merge($results, $pageResults);

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
