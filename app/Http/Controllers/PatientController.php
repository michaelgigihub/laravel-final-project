<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use Inertia\Inertia;

class PatientController extends Controller
{
    public function index()
    {
        $patients = Patient::all();

        return Inertia::render('PatientsTable', [
            'patients' => $patients,
        ]);
    }
}
