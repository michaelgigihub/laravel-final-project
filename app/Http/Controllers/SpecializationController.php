<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSpecializationRequest;
use App\Models\Specialization;
use Inertia\Inertia;

class SpecializationController extends Controller
{
    public function index()
    {
        $specializations = Specialization::all();

        return Inertia::render('admin/SpecializationsTable', [
            'specializations' => $specializations,
        ]);
    }



    public function store(StoreSpecializationRequest $request)
    {
        $validated = $request->validated();

        $specializations = collect($validated['names'])->map(fn ($name) => [
            'name' => $name,
            'created_at' => now(),
            'updated_at' => now(),
        ])->toArray();

        Specialization::insert($specializations);

        return redirect()->route('admin.specializations.index')
            ->with('success', 'Specializations added successfully!');
    }
}
