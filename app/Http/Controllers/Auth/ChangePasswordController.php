<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class ChangePasswordController extends Controller
{
    /**
     * Show the change password form.
     */
    public function show(Request $request): Response
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        return Inertia::render('auth/ChangePassword', [
            'mustChangePassword' => $user->must_change_password,
        ]);
    }

    /**
     * Handle the password change request.
     */
    public function update(Request $request): RedirectResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $validated = $request->validate([
            'password' => [
                'required',
                'confirmed',
                Password::defaults(),
                function ($attribute, $value, $fail) use ($user) {
                    if (Hash::check($value, $user->password)) {
                        $fail('The new password cannot be the same as your current password.');
                    }
                },
            ],
        ]);

        // Update the password
        $user->update([
            'password' => Hash::make($validated['password']),
            'must_change_password' => false,
        ]);

        // Invalidate all other sessions for security
        // Since this is first-time password change, we delete all other sessions from DB
        if (config('session.driver') === 'database') {
            DB::table('sessions')
                ->where('user_id', $user->id)
                ->where('id', '!=', $request->session()->getId())
                ->delete();
        }

        return redirect()->route('dashboard')
            ->with('success', 'Password changed successfully. You can now access the system.');
    }
}
