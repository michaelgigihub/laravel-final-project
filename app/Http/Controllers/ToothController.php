<?php

namespace App\Http\Controllers;

use App\Enums\AuditModuleType;
use App\Enums\AuditTargetType;
use App\Models\Tooth;
use App\Services\AdminAuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ToothController extends Controller
{
    public function __construct(
        protected AdminAuditService $auditService
    ) {}

    public function index()
    {
        $teeth = Tooth::orderBy('id', 'asc')->get();

        return Inertia::render('admin/TeethConfigTable', [
            'teeth' => $teeth,
        ]);
    }

    public function update(Request $request, Tooth $tooth)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
        ]);

        $oldName = $tooth->name;
        $tooth->update($validated);

        // Audit log
        $this->auditService->log(
            adminId: Auth::id(),
            activityTitle: 'Tooth Renamed',
            message: "Renamed tooth from '{$oldName}' to '{$validated['name']}'",
            moduleType: AuditModuleType::SERVICES_MANAGEMENT,
            targetType: AuditTargetType::TREATMENT_TYPE, // Reusing this for simplicity
            targetId: $tooth->id,
            oldValue: ['name' => $oldName],
            newValue: ['name' => $validated['name']]
        );

        return back()->with('success', 'Tooth name updated successfully!');
    }
}
