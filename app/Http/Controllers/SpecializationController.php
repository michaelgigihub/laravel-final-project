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

        $specializations = collect($validated['names'])->map(fn($name) => [
            'name' => $name,
            'created_at' => now(),
            'updated_at' => now(),
        ])->toArray();

        Specialization::insert($specializations);

        return redirect()->route('admin.specializations.index')
            ->with('success', 'Specializations added successfully!');
    }

    public function update(\Illuminate\Http\Request $request, Specialization $specialization)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:specializations,name,' . $specialization->id,
        ]);

        $specialization->update($validated);

        return back()->with('success', 'Specialization updated successfully!');
    }

    public function destroy(Specialization $specialization)
    {
        // Check if any dentists have this specialization
        if ($specialization->dentists()->count() > 0) {
            return back()->withErrors(['error' => 'Cannot delete specialization that is assigned to dentists.']);
        }

        $specialization->delete();

        return back()->with('success', 'Specialization deleted successfully!');
    }
}
