<?php

namespace App\Http\Controllers\Auth;

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Laravel\Fortify\Contracts\CreatesNewUsers;

use App\Services\AdminAuditService;
use App\Services\PasswordService;
use App\Enums\AuditModuleType;
use App\Enums\AuditTargetType;

class CreateNewAdminController implements CreatesNewUsers
{


    protected PasswordService $passwordService;

    public function __construct(protected AdminAuditService $auditService, PasswordService $passwordService)
    {
        $this->passwordService = $passwordService;
    }

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            'fname' => ['required', 'string', 'max:255'],
            'mname' => ['nullable', 'string', 'max:255'],
            'lname' => ['required', 'string', 'max:255'],
            'gender' => ['required', 'string', Rule::in(['Male', 'Female', 'Other'])],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique(User::class),
            ],
        ])->validate();

        $passwordData = $this->passwordService->generateDefaultPassword($input['lname']);

        $user = User::create([
            'fname' => $input['fname'],
            'mname' => $input['mname'],
            'lname' => $input['lname'],
            'gender' => $input['gender'],
            'email' => $input['email'],
            'password' => Hash::make($passwordData['password']),
            'role_id' => 1, // Admin Role
            'must_change_password' => true,
        ]);

        $this->auditService->log(
            adminId: Auth::id(),
            activityTitle: 'Admin Created',
            message: "Created admin user {$user->fname} {$user->lname}",
            moduleType: AuditModuleType::USER_MANAGEMENT,
            targetType: AuditTargetType::ADMIN,
            targetId: $user->id,
            newValue: [
                'name' => "{$user->fname} {$user->lname}",
                'email' => $user->email,
                'gender' => $user->gender,
                'role_id' => $user->role_id,
            ]
        );

        return $user;
    }
}
