<?php

namespace App\Http\Controllers;

use App\Enums\AuditModuleType;
use App\Enums\AuditTargetType;
use App\Http\Requests\StoreTreatmentTypeRequest;
use App\Models\TreatmentType;
use App\Services\AdminAuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class TreatmentTypeController extends Controller
{
    public function __construct(
        protected AdminAuditService $auditService
    ) {}

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

        $treatmentType = TreatmentType::create($validated);

        // Audit log
        $this->auditService->log(
            adminId: Auth::id(),
            activityTitle: 'Treatment Type Created',
            message: "Created treatment type: {$treatmentType->name}",
            moduleType: AuditModuleType::SERVICES_MANAGEMENT,
            targetType: AuditTargetType::TREATMENT_TYPE,
            targetId: $treatmentType->id,
            newValue: [
                'name' => $treatmentType->name,
                'description' => $treatmentType->description,
                'standard_cost' => $treatmentType->standard_cost,
                'duration_minutes' => $treatmentType->duration_minutes,
            ]
        );

        return redirect()->route('admin.treatment-types.index')
            ->with('success', 'Treatment type added successfully!');
    }

    public function update(Request $request, TreatmentType $treatmentType)
    {
        // Check if this is a simple status toggle or a full update
        if ($request->has('name')) {
            // Full update
            $validated = $request->validate([
                'name' => ['required', 'string', 'max:255'],
                'description' => 'required|string|max:1000',
                'standard_cost' => 'required|numeric|min:0|max:999999.99',
                'is_per_tooth' => 'boolean',
                'duration_minutes' => 'required|integer|min:1|max:480',
                'is_active' => 'boolean',
            ]);

            $validated['name'] = ucwords($validated['name']);
            $oldValues = $treatmentType->only(['name', 'description', 'standard_cost', 'is_per_tooth', 'duration_minutes', 'is_active']);
            $treatmentType->update($validated);

            $this->auditService->log(
                adminId: Auth::id(),
                activityTitle: 'Treatment Type Updated',
                message: "Updated treatment type '{$treatmentType->name}'",
                moduleType: AuditModuleType::SERVICES_MANAGEMENT,
                targetType: AuditTargetType::TREATMENT_TYPE,
                targetId: $treatmentType->id,
                oldValue: $oldValues,
                newValue: $validated
            );
        } else {
            // Status toggle only
            $validated = $request->validate([
                'is_active' => 'required|boolean',
            ]);

            $oldStatus = $treatmentType->is_active;
            $treatmentType->update($validated);

            $this->auditService->log(
                adminId: Auth::id(),
                activityTitle: 'Treatment Type Updated',
                message: "Updated treatment type '{$treatmentType->name}' status",
                moduleType: AuditModuleType::SERVICES_MANAGEMENT,
                targetType: AuditTargetType::TREATMENT_TYPE,
                targetId: $treatmentType->id,
                oldValue: ['is_active' => $oldStatus],
                newValue: ['is_active' => $validated['is_active']]
            );
        }

        return back()->with('success', 'Treatment type updated successfully!');
    }

    public function destroy(TreatmentType $treatmentType)
    {
        // Check if any treatment records use this type
        if ($treatmentType->treatmentRecords()->count() > 0) {
            return back()->withErrors(['error' => 'Cannot delete treatment type that has treatment records.']);
        }

        $deletedData = [
            'id' => $treatmentType->id,
            'name' => $treatmentType->name,
            'description' => $treatmentType->description,
        ];
        $treatmentType->delete();

        // Audit log
        $this->auditService->log(
            adminId: Auth::id(),
            activityTitle: 'Treatment Type Deleted',
            message: "Deleted treatment type: {$deletedData['name']}",
            moduleType: AuditModuleType::SERVICES_MANAGEMENT,
            targetType: AuditTargetType::TREATMENT_TYPE,
            targetId: $deletedData['id'],
            oldValue: $deletedData
        );

        return back()->with('success', 'Treatment type deleted successfully!');
    }
}
