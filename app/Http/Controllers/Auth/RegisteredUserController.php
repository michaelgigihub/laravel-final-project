<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Show the registration page.
     */
    public function create(): Response
    {
        return Inertia::render('auth/register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        // Accept either a single 'name' or split fields (fname, mname, lname)
        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'fname' => 'nullable|string|max:255',
            'mname' => 'nullable|string|max:255',
            'lname' => 'nullable|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);
        Log::info('Registration validated', ['payload' => array_keys($validated)]);

        // Derive name parts
        $fname = $validated['fname'] ?? null;
        $mname = $validated['mname'] ?? null;
        $lname = $validated['lname'] ?? null;

        if ((! $fname || ! $lname) && ! empty($validated['name'])) {
            $parts = preg_split('/\s+/', trim($validated['name']));
            $fname = $fname ?: array_shift($parts);
            $lname = $lname ?: (count($parts) ? array_pop($parts) : null);
            $mname = $mname ?: (count($parts) ? implode(' ', $parts) : null);
        }

        // Ensure a default role exists for new registrations
        $role = DB::table('roles')->where('name', 'Patient')->first();
        $roleId = $role?->id ?? DB::table('roles')->insertGetId([
            'name' => 'Patient',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Log::info('Creating user', ['email' => $validated['email'], 'fname' => $fname, 'lname' => $lname, 'role_id' => $roleId]);

        $user = User::create([
            'fname' => $fname ?? '',
            'mname' => $mname,
            'lname' => $lname ?? '',
            'gender' => 'Other',
            'role_id' => $roleId,
            'email' => $validated['email'],
            'password' => $validated['password'],
        ]);

        event(new Registered($user));

        Auth::login($user);
        Log::info('User logged in', ['id' => $user->id]);

        $request->session()->regenerate();

        return redirect()->intended(route('dashboard', absolute: false));
    }
}
