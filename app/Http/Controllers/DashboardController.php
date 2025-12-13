<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Patient;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the admin dashboard with stats.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        // Redirect dentists to their own dashboard
        if ($user->role_id === 2) {
            return redirect()->route('dentist.dashboard');
        }
        
        // Stats
        $stats = [
            'total_patients' => Patient::count(),
            'total_appointments' => Appointment::count(),
            'scheduled_appointments' => Appointment::where('status', 'Scheduled')->count(),
            'completed_appointments' => Appointment::where('status', 'Completed')->count(),
            'cancelled_appointments' => Appointment::where('status', 'Cancelled')->count(),
            'total_dentists' => User::where('role_id', 2)->count(),
            'today_appointments' => Appointment::whereDate('appointment_start_datetime', Carbon::today())->count(),
        ];

        // Upcoming appointments (next 10)
        $upcomingAppointments = Appointment::with([
            'patient:id,fname,mname,lname',
            'dentist:id,fname,mname,lname',
            'treatmentTypes:id,name'
        ])
            ->where('appointment_start_datetime', '>=', Carbon::now())
            ->where('status', 'Scheduled')
            ->orderBy('appointment_start_datetime')
            ->limit(10)
            ->get()
            ->map(function ($apt) {
                return [
                    'id' => $apt->id,
                    'patient_name' => $apt->patient 
                        ? trim("{$apt->patient->fname} {$apt->patient->lname}") 
                        : 'N/A',
                    'dentist_name' => $apt->dentist 
                        ? trim("{$apt->dentist->fname} {$apt->dentist->lname}") 
                        : 'N/A',
                    'datetime' => Carbon::parse($apt->appointment_start_datetime)->format('M d, Y g:i A'),
                    'date' => Carbon::parse($apt->appointment_start_datetime)->format('Y-m-d'),
                    'time' => Carbon::parse($apt->appointment_start_datetime)->format('g:i A'),
                    'treatments' => $apt->treatmentTypes->pluck('name')->join(', '),
                    'status' => $apt->status,
                ];
            });

        // Today's appointments
        $todayAppointments = Appointment::with([
            'patient:id,fname,mname,lname',
            'dentist:id,fname,mname,lname',
        ])
            ->whereDate('appointment_start_datetime', Carbon::today())
            ->where('status', '!=', 'Cancelled')
            ->orderBy('appointment_start_datetime')
            ->get()
            ->map(function ($apt) {
                return [
                    'id' => $apt->id,
                    'patient_name' => $apt->patient 
                        ? trim("{$apt->patient->fname} {$apt->patient->lname}") 
                        : 'N/A',
                    'dentist_name' => $apt->dentist 
                        ? trim("{$apt->dentist->fname} {$apt->dentist->lname}") 
                        : 'N/A',
                    'time' => Carbon::parse($apt->appointment_start_datetime)->format('g:i A'),
                    'status' => $apt->status,
                ];
            });

        // Recent patients (last 5 added)
        $recentPatients = Patient::orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($patient) {
                return [
                    'id' => $patient->id,
                    'name' => trim("{$patient->fname} {$patient->lname}"),
                    'created_at' => $patient->created_at?->format('M d, Y'),
                ];
            });

        return Inertia::render('dashboard', [
            'stats' => $stats,
            'upcomingAppointments' => $upcomingAppointments,
            'todayAppointments' => $todayAppointments,
            'recentPatients' => $recentPatients,
            'userRole' => $user->role_id,
        ]);
    }
}
