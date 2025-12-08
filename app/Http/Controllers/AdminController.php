<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDentistRequest;
use App\Http\Requests\UpdateDentistRequest;
use App\Http\Resources\DentistProfileResource;
use App\Models\AdminAudit;
use App\Models\Specialization;
use App\Models\User;
use App\Services\DentistService;
use Inertia\Inertia;

class AdminController extends Controller
{
    protected $dentistService;

    public function __construct(DentistService $dentistService)
    {
        $this->dentistService = $dentistService;
    }
    
    // Display a listing of dentists
    public function indexDentists()
    {
        // Get all dentists with eager loading to prevent N+1 queries
        $dentists = User::where('role_id', 2)
            ->with(['dentistProfile', 'specializations'])
            ->get()
            ->map(function ($dentist) {
                return [
                    'dentist_id' => $dentist->id,
                    'fname' => $dentist->fname,
                    'mname' => $dentist->mname,
                    'lname' => $dentist->lname,
                    'specialization' => $dentist->specializations->pluck('name')->join(', '),
                    'contact_number' => $dentist->contact_number,
                    'email' => $dentist->email,
                    'employment_status' => $dentist->dentistProfile?->employment_status,
                    'hire_date' => $dentist->dentistProfile?->hire_date?->format('Y-m-d'),
                ];
            });

        return Inertia::render('admin/DentistsTable', [
            'dentists' => $dentists,
        ]);
    }

    /**
     * Show the form for creating a new dentist.
     * Only admins can access this.
     */
    public function createDentist()
    {
        // Get all available specializations
        $specializations = Specialization::all()->map(function ($spec) {
            return [
                'id' => $spec->id,
                'name' => $spec->name,
            ];
        });

        return Inertia::render('admin/RegisterDentist', [
            'specializations' => $specializations,
        ]);
    }

    /**
     * Store a newly created dentist.
     * Only admins can create dentists.
     */
    public function storeDentist(StoreDentistRequest $request)
    {
        try {
            // Get validated data from the Form Request
            $validated = $request->validated();

            // Use the service to create the dentist
            $dentist = $this->dentistService->createDentist($validated);

            // Log admin activity
            /** @var \App\Models\User $user */
            $user = $request->user();
            $this->dentistService->logDentistCreated(
                $user->id,
                $dentist
            );

            return redirect()->route('admin.dentists.index')
                ->with('success', 'Dentist registered successfully.');
        } catch (\Exception $e) {
            return back()->withErrors([
                'error' => 'Failed to register dentist: ' . $e->getMessage(),
            ])->withInput();
        }
    }

    /**
     * Display the specified dentist.
     *
     * @return \Inertia\Response
     */
    public function showDentist(User $dentist)
    {
        // Ensure the user is a dentist
        if ($dentist->role_id !== 2) {
            abort(404, 'Dentist not found.');
        }

        // Eager load all necessary relationships in one query
        $dentist->load(['dentistProfile', 'specializations', 'role']);

        // Get all available specializations
        $specializations = Specialization::all()->map(function ($spec) {
            return [
                'id' => $spec->id,
                'name' => $spec->name,
            ];
        });

        return Inertia::render('dentist/profile', [
            'dentist' => (new DentistProfileResource($dentist, includeAdminFields: true))->resolve(),
            'specializations' => $specializations,
            'viewMode' => 'admin',
        ]);
    }

    /**
     * Update the specified dentist.
     */
    public function updateDentist(UpdateDentistRequest $request, User $dentist)
    {
        try {
            $validated = $request->validated();
            
            // Capture old data for auditing
            $oldDataForAudit = [
                'email' => $dentist->email,
                'name' => $dentist->name,
                'contact_number' => $dentist->contact_number,
                'employment_status' => $dentist->dentistProfile?->employment_status,
            ];

            $this->dentistService->updateDentist($dentist, $validated);

            // Log admin activity
            /** @var \App\Models\User $user */
            $user = $request->user();
            
            $newDataForAudit = [
                'email' => $validated['email'],
                'name' => $validated['fname'] . ' ' . ($validated['mname'] ? $validated['mname'] . ' ' : '') . $validated['lname'],
                'contact_number' => $validated['contact_number'] ?? null,
                'employment_status' => $validated['employment_status'] ?? null,
            ];
            
            $this->dentistService->logDentistUpdated($user->id, $dentist, $oldDataForAudit, $newDataForAudit);

            return back()->with('success', 'Dentist profile updated successfully.');
        } catch (\Exception $e) {
            return back()->withErrors([
                'error' => 'Failed to update dentist: ' . $e->getMessage(),
            ]);
        }
    }

    /**
     * Display the admin audit logs.
     * Only admins can access this.
     */
    public function indexAuditLogs()
    {
        // Get all audit logs with admin information, ordered by latest first
        $auditLogs = AdminAudit::with('admin:id,fname,mname,lname,email')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'admin_name' => $log->admin ? trim($log->admin->fname . ' ' . ($log->admin->mname ?? '') . ' ' . $log->admin->lname) : 'N/A',
                    'admin_email' => $log->admin?->email ?? 'N/A',
                    'activityTitle' => $log->activityTitle,
                    'moduleType' => $log->moduleType,
                    'message' => $log->message,
                    'targetType' => $log->targetType,
                    'targetId' => $log->targetId,
                    'oldValue' => $log->oldValue,
                    'newValue' => $log->newValue,
                    'ipAddress' => $log->ipAddress,
                    'userAgent' => $log->userAgent,
                    'created_at' => $log->created_at?->format('Y-m-d H:i:s'),
                ];
            });

        return Inertia::render('admin/AdminAuditLogs', [
            'auditLogs' => $auditLogs,
        ]);
    }
}
