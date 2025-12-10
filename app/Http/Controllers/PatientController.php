<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePatientRequest;
use App\Http\Requests\UpdatePatientRequest;
use App\Models\Patient;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PatientController extends Controller
{
    /**
     * Display a listing of patients with search, filter, and pagination.
     */
    public function index(Request $request)
    {
        $query = Patient::query();

        // Search by name, email, or contact number
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('fname', 'like', "%{$search}%")
                  ->orWhere('mname', 'like', "%{$search}%")
                  ->orWhere('lname', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('contact_number', 'like', "%{$search}%");
            });
        }

        // Filter by gender
        if ($gender = $request->input('gender')) {
            $query->where('gender', $gender);
        }

        // Paginate results (15 per page)
        $patients = $query->orderBy('lname')->orderBy('fname')->paginate(15)->withQueryString();

        return Inertia::render('patient/Index', [
            'patients' => $patients,
            'filters' => [
                'search' => $request->input('search', ''),
                'gender' => $request->input('gender', ''),
            ],
        ]);
    }

    /**
     * Show the form for creating a new patient.
     */
    public function create()
    {
        return Inertia::render('patient/Create');
    }

    /**
     * Store a newly created patient.
     */
    public function store(StorePatientRequest $request)
    {
        $validated = $request->validated();

        Patient::create($validated);

        return redirect()->route('patients.index')
            ->with('success', 'Patient added successfully!');
    }

    /**
     * Display the specified patient with their medical history.
     */
    public function show(Patient $patient)
    {
        // Load appointments with related data
        $patient->load([
            'appointments' => function ($query) {
                $query->with(['dentist:id,fname,mname,lname', 'treatmentRecords.treatmentType'])
                      ->orderBy('appointment_start_datetime', 'desc');
            }
        ]);

        return Inertia::render('patient/Show', [
            'patient' => $patient,
        ]);
    }

    /**
     * Show the form for editing the specified patient.
     */
    public function edit(Patient $patient)
    {
        return Inertia::render('patient/Edit', [
            'patient' => $patient,
        ]);
    }

    /**
     * Update the specified patient.
     */
    public function update(UpdatePatientRequest $request, Patient $patient)
    {
        $validated = $request->validated();

        $patient->update($validated);

        return redirect()->route('patients.show', $patient)
            ->with('success', 'Patient updated successfully!');
    }
}
