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

    public function __construct(AdminAuditService $auditService)
    {
        $this->auditService = $auditService;
    }

    /**
     * Generate a default password for a dentist.
     * Format: lastname_{4 random digits}
     * Handles compound last names (e.g., "dela cruz" -> "delacruz")
     *
     * @return array ['password' => full password, 'digits' => 4 digits only]
     */
    private function generateDefaultPassword(string $lastName): array
    {
        // Remove spaces and convert to lowercase for compound last names
        $normalizedLastName = strtolower(str_replace(' ', '', $lastName));

        // Generate 4 random digits
        $digits = str_pad(rand(0, 9999), 4, '0', STR_PAD_LEFT);

        // Construct the password
        $password = $normalizedLastName . '_' . $digits;

        return [
            'password' => $password,
            'digits' => $digits,
        ];
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
            $passwordData = $this->generateDefaultPassword($validated['lname']);

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
}
