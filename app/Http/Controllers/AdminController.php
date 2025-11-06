<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDentistRequest;
use App\Http\Resources\DentistProfileResource;
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

    /**
     * Display a listing of dentists.
     */
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

        return Inertia::render('DentistsTable', [
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

        return Inertia::render('RegisterDentist', [
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

        return Inertia::render('dentist/profile', [
            'dentist' => (new DentistProfileResource($dentist, includeAdminFields: true))->resolve(),
            'viewMode' => 'admin',
        ]);
    }
}
