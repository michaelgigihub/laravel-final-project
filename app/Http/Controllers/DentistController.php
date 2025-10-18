<?php

namespace App\Http\Controllers;

use App\Models\Dentist;
use Inertia\Inertia;

class DentistController extends Controller
{
    public function index()
    {
        $dentists = Dentist::all();
        return Inertia::render('DentistsTable', [
            'dentists' => $dentists
        ]);
    }

    public function apiIndex()
    {
        return response()->json(Dentist::all());
    }
}
