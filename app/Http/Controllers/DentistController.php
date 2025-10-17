<?php

namespace App\Http\Controllers;

use App\Models\Dentist;

class DentistController extends Controller
{
    public function index()
    {
        $dentists = Dentist::all();

        return response()->json($dentists);
    }
}
