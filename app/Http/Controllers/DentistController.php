<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;

class DentistController extends Controller
{
    /**
     * Display a listing of dentists.
     */
    public function index()
    {
        // Get all users with dentist role (role_id = 2)
        $dentists = User::where('role_id', 2)
            ->with(['dentistProfile', 'specializations'])
            ->get();

        return Inertia::render('DentistsTable', [
            'dentists' => $dentists
        ]);
    }

    /**
     * Store a newly created dentist.
     * Only admins can create dentists.
     */
    public function store(Request $request)
    {
        // Validate the incoming request
        $validated = $request->validate([
            'fname' => 'required|string|max:255',
            'mname' => 'nullable|string|max:255',
            'lname' => 'required|string|max:255',
            'gender' => 'required|string|in:Male,Female,Other',
            'contact_number' => 'nullable|string|max:20|unique:users,contact_number',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'specialization_ids' => 'nullable|array',
            'specialization_ids.*' => 'exists:specializations,id',
            'employment_status' => 'nullable|string|in:Active,Un-hire',
            'hire_date' => 'nullable|date',
        ]);

        DB::beginTransaction();

        try {
            // Create the dentist user with role_id = 2 (Dentist)
            $dentist = User::create([
                'fname' => $validated['fname'],
                'mname' => $validated['mname'] ?? null,
                'lname' => $validated['lname'],
                'gender' => $validated['gender'],
                'role_id' => 2, // Dentist role
                'contact_number' => $validated['contact_number'] ?? null,
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'must_change_password' => true, // Force password change on first login
                'email_verified_at' => null,
            ]);

            // Create dentist profile
            DB::table('dentist_profiles')->insert([
                'dentist_id' => $dentist->id,
                'employment_status' => $validated['employment_status'] ?? 'Active',
                'hire_date' => $validated['hire_date'] ?? now()->toDateString(),
                'archived_at' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Attach specializations if provided
            if (!empty($validated['specialization_ids'])) {
                foreach ($validated['specialization_ids'] as $specializationId) {
                    DB::table('dentist_specialization')->insert([
                        'dentist_id' => $dentist->id,
                        'specialization_id' => $specializationId,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }

            // Log admin activity
            DB::table('admin_audit')->insert([
                'admin_id' => $request->user()->id,
                'activityTitle' => 'Dentist Created',
                'moduleType' => 'user-management',
                'message' => "Admin created a new dentist account for {$dentist->name}",
                'targetType' => 'dentist',
                'targetId' => $dentist->id,
                'oldValue' => null,
                'newValue' => json_encode([
                    'email' => $dentist->email,
                    'name' => $dentist->name,
                    'contact_number' => $dentist->contact_number,
                ]),
                'ipAddress' => $request->ip(),
                'userAgent' => $request->userAgent(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::commit();

            return redirect()->route('dentists.index')
                ->with('success', 'Dentist registered successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors([
                'error' => 'Failed to register dentist: ' . $e->getMessage()
            ])->withInput();
        }
    }
}
