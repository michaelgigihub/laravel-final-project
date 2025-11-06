<?php

namespace App\Http\Controllers;

use App\Http\Resources\DentistProfileResource;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DentistController extends Controller
{
    /**
     * Display the authenticated dentist's profile.
     *
     * Uses session-based authentication (via Fortify/Laravel's default auth).
     * The authenticated user is retrieved from the session.
     */
    public function profile(Request $request): Response
    {
        $user = $request->user();

        // Eager load all necessary relationships
        $user->load(['role', 'dentistProfile', 'specializations']);

        return Inertia::render('dentist/profile', [
            'dentist' => (new DentistProfileResource($user, includeAdminFields: false))->resolve(),
            'viewMode' => 'self',
        ]);
    }
}
