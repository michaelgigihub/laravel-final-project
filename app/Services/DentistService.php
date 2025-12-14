<?php

namespace App\Services;

use App\Enums\AuditModuleType;
use App\Enums\AuditTargetType;
use App\Jobs\SendDentistCredentials;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DentistService
{
    protected AdminAuditService $auditService;
    protected PasswordService $passwordService;

    public function __construct(AdminAuditService $auditService, PasswordService $passwordService)
    {
        $this->auditService = $auditService;
        $this->passwordService = $passwordService;
    }

    /**
     * Create a new dentist with profile and specializations.
     *
     * @param  array  $validated  Validated data
     *
     * @throws \Exception
     */
    public function createDentist(array $validated): User
    {
        DB::beginTransaction();

        try {
            // Generate default password
            $passwordData = $this->passwordService->generateDefaultPassword($validated['lname']);

            // Handle avatar upload if provided
            $avatarPath = null;
            if (isset($validated['avatar']) && $validated['avatar'] instanceof \Illuminate\Http\UploadedFile) {
                $avatarPath = $validated['avatar']->store('avatars/dentists', 'public');
            }

            // Create the dentist user with role_id = 2 (Dentist)
            $dentist = User::create([
                'fname' => $validated['fname'],
                'mname' => $validated['mname'] ?? null,
                'lname' => $validated['lname'],
                'gender' => $validated['gender'],
                'role_id' => 2, // Dentist role
                'contact_number' => $validated['contact_number'] ?? null,
                'email' => $validated['email'],
                'password' => Hash::make($passwordData['password']),
                'avatar_path' => $avatarPath,
                'must_change_password' => true,
                'email_verified_at' => now(),
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
            if (! empty($validated['specialization_ids'])) {
                foreach ($validated['specialization_ids'] as $specializationId) {
                    DB::table('dentist_specialization')->insert([
                        'dentist_id' => $dentist->id,
                        'specialization_id' => $specializationId,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }

            DB::commit();

            // Dispatch job to send credentials email asynchronously
            $dentistFullName = trim($dentist->fname . ' ' . ($dentist->mname ? $dentist->mname . ' ' : '') . $dentist->lname);
            SendDentistCredentials::dispatch(
                $dentist->email,
                $dentistFullName,
                $passwordData['digits']
            );

            // Reload with relationships
            return $dentist->load(['dentistProfile', 'specializations']);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Update an existing dentist.
     *
     * @throws \Exception
     */
    public function updateDentist(User $dentist, array $validated): User
    {
        DB::beginTransaction();

        try {
            // Handle avatar upload if provided
            if (isset($validated['avatar']) && $validated['avatar'] instanceof \Illuminate\Http\UploadedFile) {
                // Delete old avatar if exists
                if ($dentist->avatar_path) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($dentist->avatar_path);
                }
                // Store new avatar
                $validated['avatar_path'] = $validated['avatar']->store('avatars/dentists', 'public');
                unset($validated['avatar']);
            } else {
                unset($validated['avatar']);
            }

            $dentist->update($validated);

            // Update specializations if provided
            if (isset($validated['specialization_ids'])) {
                DB::table('dentist_specialization')
                    ->where('dentist_id', $dentist->id)
                    ->delete();

                foreach ($validated['specialization_ids'] as $specializationId) {
                    DB::table('dentist_specialization')->insert([
                        'dentist_id' => $dentist->id,
                        'specialization_id' => $specializationId,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }

            // Update dentist profile if employment_status is provided
                $updateData = ['updated_at' => now()];
                
                if (isset($validated['employment_status'])) {
                    $updateData['employment_status'] = $validated['employment_status'];
                }

                if (isset($validated['hire_date'])) {
                    $updateData['hire_date'] = $validated['hire_date'];
                }

                if (count($updateData) > 1) { // Check if we have more than just updated_at
                    DB::table('dentist_profiles')
                        ->where('dentist_id', $dentist->id)
                        ->update($updateData);
                }

            DB::commit();

            return $dentist->load(['dentistProfile', 'specializations']);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Delete a dentist and related records.
     *
     * @throws \Exception
     */
    public function deleteDentist(User $dentist): void
    {
        DB::beginTransaction();

        try {
            // Delete related records
            DB::table('dentist_specialization')->where('dentist_id', $dentist->id)->delete();
            DB::table('dentist_profiles')->where('dentist_id', $dentist->id)->delete();

            $dentist->delete();

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Log dentist creation activity.
     */
    public function logDentistCreated(int $adminId, User $dentist): void
    {
        $this->auditService->log(
            adminId: $adminId,
            activityTitle: 'Dentist Created',
            message: "Created {$dentist->name} dentist account",
            moduleType: AuditModuleType::USER_MANAGEMENT,
            targetType: AuditTargetType::DENTIST,
            targetId: $dentist->id,
            newValue: [
                'email' => $dentist->email,
                'name' => $dentist->name,
                'contact_number' => $dentist->contact_number,
            ]
        );
    }

    /**
     * Log dentist update activity.
     */
    public function logDentistUpdated(int $adminId, User $dentist, array $oldData, array $newData): void
    {
        $this->auditService->log(
            adminId: $adminId,
            activityTitle: 'Dentist Updated',
            message: "Updated {$dentist->name} dentist account",
            moduleType: AuditModuleType::USER_MANAGEMENT,
            targetType: AuditTargetType::DENTIST,
            targetId: $dentist->id,
            oldValue: $oldData,
            newValue: $newData
        );
    }

    /**
     * Log dentist deletion activity.
     */
    public function logDentistDeleted(int $adminId, User $dentist): void
    {
        $this->auditService->log(
            adminId: $adminId,
            activityTitle: 'Dentist Deleted',
            message: "Deleted {$dentist->name} dentist account",
            moduleType: AuditModuleType::USER_MANAGEMENT,
            targetType: AuditTargetType::DENTIST,
            targetId: $dentist->id,
            oldValue: [
                'email' => $dentist->email,
                'name' => $dentist->name,
                'contact_number' => $dentist->contact_number,
            ]
        );
    }

    /**
     * List all employed (active) dentists for AI chat.
     *
     * @return \Illuminate\Support\Collection
     */
    public function listEmployedDentists(): \Illuminate\Support\Collection
    {
        return User::query()
            ->where('role_id', 2) // Dentist role
            ->whereHas('dentistProfile', function ($query) {
                $query->where('employment_status', 'Active');
            })
            ->with(['dentistProfile', 'specializations'])
            ->get()
            ->map(function ($dentist) {
                return [
                    'name' => $dentist->name,
                    'email' => $dentist->email,
                    'contact' => $dentist->contact_number,
                    'hire_date' => $dentist->dentistProfile?->hire_date 
                        ? \Carbon\Carbon::parse($dentist->dentistProfile->hire_date)->format('F j, Y')
                        : 'N/A',
                    'specializations' => $dentist->specializations->pluck('name')->join(', ') ?: 'General Dentistry'
                ];
            });
    }

    /**
     * Find dentists by specialization for AI chat.
     *
     * @param string $specializationName
     * @return \Illuminate\Support\Collection
     */
    public function findDentistsBySpecialization(string $specializationName): \Illuminate\Support\Collection
    {
        $searchTerm = '%' . strtolower($specializationName) . '%';

        return User::query()
            ->where('role_id', 2)
            ->whereHas('dentistProfile', function ($query) {
                $query->where('employment_status', 'Active');
            })
            ->whereHas('specializations', function ($query) use ($searchTerm) {
                $query->whereRaw('LOWER(name) LIKE ?', [$searchTerm]);
            })
            ->with(['specializations'])
            ->get()
            ->map(function ($dentist) {
                return [
                    'name' => $dentist->name,
                    'email' => $dentist->email,
                    'contact' => $dentist->contact_number,
                    'specializations' => $dentist->specializations->pluck('name')->join(', ')
                ];
            });
    }
}
