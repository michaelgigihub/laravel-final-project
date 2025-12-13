<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Patient;
use App\Models\TreatmentRecord;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReportsController extends Controller
{
    /**
     * Display reports index page.
     */
    public function index()
    {
        return Inertia::render('admin/Reports');
    }

    /**
     * Generate appointments report.
     */
    public function appointmentsReport(Request $request)
    {
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->input('end_date', Carbon::now()->endOfMonth()->format('Y-m-d'));

        $appointments = Appointment::with(['patient', 'dentist', 'treatmentRecords.treatmentType'])
            ->whereBetween('appointment_start_datetime', [$startDate, $endDate . ' 23:59:59'])
            ->orderBy('appointment_start_datetime')
            ->get()
            ->map(function ($apt) {
                return [
                    'id' => $apt->id,
                    'date' => Carbon::parse($apt->appointment_start_datetime)->format('M d, Y h:i A'),
                    'patient' => $apt->patient ? trim("{$apt->patient->fname} {$apt->patient->lname}") : 'N/A',
                    'dentist' => $apt->dentist ? trim("{$apt->dentist->fname} {$apt->dentist->lname}") : 'N/A',
                    'status' => $apt->status,
                    'treatments' => $apt->treatmentRecords->pluck('treatmentType.name')->filter()->implode(', ') ?: '-',
                ];
            });

        $stats = [
            'total' => $appointments->count(),
            'completed' => $appointments->where('status', 'Completed')->count(),
            'cancelled' => $appointments->where('status', 'Cancelled')->count(),
            'scheduled' => $appointments->where('status', 'Scheduled')->count(),
        ];

        $pdf = Pdf::loadView('reports.appointments', [
            'appointments' => $appointments,
            'stats' => $stats,
            'startDate' => Carbon::parse($startDate)->format('M d, Y'),
            'endDate' => Carbon::parse($endDate)->format('M d, Y'),
            'generatedAt' => Carbon::now()->format('M d, Y h:i A'),
        ]);

        return $pdf->download("appointments_report_{$startDate}_to_{$endDate}.pdf");
    }

    /**
     * Generate patients report.
     */
    public function patientsReport(Request $request)
    {
        $patients = Patient::orderBy('fname')
            ->get()
            ->map(function ($patient) {
                return [
                    'id' => $patient->id,
                    'name' => trim("{$patient->fname} " . ($patient->mname ? "{$patient->mname} " : '') . $patient->lname),
                    'gender' => $patient->gender,
                    'age' => Carbon::parse($patient->date_of_birth)->age,
                    'contact' => $patient->contact_number ?: '-',
                    'email' => $patient->email ?: '-',
                ];
            });

        $stats = [
            'total' => $patients->count(),
            'male' => $patients->where('gender', 'Male')->count(),
            'female' => $patients->where('gender', 'Female')->count(),
        ];

        $pdf = Pdf::loadView('reports.patients', [
            'patients' => $patients,
            'stats' => $stats,
            'generatedAt' => Carbon::now()->format('M d, Y h:i A'),
        ]);

        return $pdf->download("patients_report_" . Carbon::now()->format('Y-m-d') . ".pdf");
    }

    /**
     * Generate dentists report.
     */
    public function dentistsReport(Request $request)
    {
        $dentists = User::where('role_id', 2)
            ->with(['dentistProfile', 'specializations'])
            ->orderBy('fname')
            ->get()
            ->map(function ($dentist) {
                return [
                    'id' => $dentist->id,
                    'name' => trim("{$dentist->fname} {$dentist->lname}"),
                    'email' => $dentist->email,
                    'contact' => $dentist->contact_number ?: '-',
                    'status' => $dentist->dentistProfile?->employment_status ?? 'Active',
                    'specializations' => $dentist->specializations->pluck('name')->implode(', ') ?: '-',
                ];
            });

        $stats = [
            'total' => $dentists->count(),
            'active' => $dentists->where('status', 'Active')->count(),
            'unhired' => $dentists->where('status', 'Un-hired')->count(),
        ];

        $pdf = Pdf::loadView('reports.dentists', [
            'dentists' => $dentists,
            'stats' => $stats,
            'generatedAt' => Carbon::now()->format('M d, Y h:i A'),
        ]);

        return $pdf->download("dentists_report_" . Carbon::now()->format('Y-m-d') . ".pdf");
    }

    /**
     * Generate treatments summary report.
     */
    public function treatmentsReport(Request $request)
    {
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->input('end_date', Carbon::now()->endOfMonth()->format('Y-m-d'));

        $records = TreatmentRecord::with(['appointment.patient', 'appointment.dentist', 'treatmentType'])
            ->whereHas('appointment', function ($q) use ($startDate, $endDate) {
                $q->whereBetween('appointment_start_datetime', [$startDate, $endDate . ' 23:59:59']);
            })
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($record) {
                return [
                    'id' => $record->id,
                    'date' => $record->appointment ? Carbon::parse($record->appointment->appointment_start_datetime)->format('M d, Y') : '-',
                    'patient' => $record->appointment?->patient ? trim("{$record->appointment->patient->fname} {$record->appointment->patient->lname}") : 'N/A',
                    'dentist' => $record->appointment?->dentist ? trim("{$record->appointment->dentist->fname} {$record->appointment->dentist->lname}") : 'N/A',
                    'treatment' => $record->treatmentType?->name ?? 'Unknown',
                ];
            });

        $pdf = Pdf::loadView('reports.treatments', [
            'records' => $records,
            'total' => $records->count(),
            'startDate' => Carbon::parse($startDate)->format('M d, Y'),
            'endDate' => Carbon::parse($endDate)->format('M d, Y'),
            'generatedAt' => Carbon::now()->format('M d, Y h:i A'),
        ]);

        return $pdf->download("treatments_report_{$startDate}_to_{$endDate}.pdf");
    }
}
