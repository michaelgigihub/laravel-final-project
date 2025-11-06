<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePasswordChanged
{
    /**
     * Handle an incoming request.
     * Redirect users who must change their password to the change password page.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        /** @var \App\Models\User|null $user */
        $user = $request->user();

        // Skip if user is not authenticated
        if (! $user) {
            return $next($request);
        }

        // Routes that should be accessible even when password change is required
        $allowedRoutes = [
            'password.change',
            'password.change.update',
            'logout',
        ];

        // Check if current route is in the allowed list
        $currentRoute = $request->route()?->getName();
        if (in_array($currentRoute, $allowedRoutes)) {
            return $next($request);
        }

        // Redirect to change password page if required
        if ($user->must_change_password) {
            return redirect()->route('password.change')
                ->with('warning', 'You must change your password before accessing the system.');
        }

        return $next($request);
    }
}
