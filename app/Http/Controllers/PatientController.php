<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Patient;
use Inertia\Inertia;

class PatientController extends Controller
{
    public function index()
    {
        $patients = Patient::all();
        return Inertia::render('PatientsTable', [
            'patients' => $patients
        ]);
    }

    public function apiIndex()
    {
        return response()->json(Patient::all());
    }
}
