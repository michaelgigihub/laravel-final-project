<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTreatmentTypeRequest;
use App\Models\TreatmentType;
use Inertia\Inertia;

class TreatmentTypeController extends Controller
{
    public function index()
    {
        $treatmentTypes = TreatmentType::orderBy('is_active', 'desc')->orderBy('id', 'asc')->get();

        return Inertia::render('admin/TreatmentTypesTable', [
            'treatmentTypes' => $treatmentTypes,
        ]);
    }


    public function store(StoreTreatmentTypeRequest $request)
    {
        $validated = $request->validated();

        $validated['name'] = ucwords($validated['name']);

        TreatmentType::create($validated);

        return redirect()->route('admin.treatment-types.index')
            ->with('success', 'Treatment type added successfully!');
    }

    public function update(\Illuminate\Http\Request $request, TreatmentType $treatmentType)
    {
        $validated = $request->validate([
            'is_active' => 'required|boolean',
        ]);

        $treatmentType->update($validated);

        return back()->with('success', 'Treatment status updated successfully!');
    }

    public function destroy(TreatmentType $treatmentType)
    {
        // Check if any treatment records use this type
        if ($treatmentType->treatmentRecords()->count() > 0) {
            return back()->withErrors(['error' => 'Cannot delete treatment type that has treatment records.']);
        }

        $treatmentType->delete();

        return back()->with('success', 'Treatment type deleted successfully!');
    }
}
