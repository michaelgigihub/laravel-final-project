# Role-based Access Control Middleware

## Overview

The `CheckRole` middleware provides reusable role-based access control for your Laravel routes.

## Role IDs

Based on your `RoleSeeder`, the following role IDs are defined:

- **Admin**: `1`
- **Dentist**: `2`

## Usage

### Single Role

To restrict a route to only admins:

```php
Route::get('/admin/dashboard', [AdminController::class, 'index'])
    ->middleware('role:1');
```

To restrict a route to only dentists:

```php
Route::get('/dentist/patients', [DentistController::class, 'patients'])
    ->middleware('role:2');
```

### Multiple Roles

To allow multiple roles to access the same route:

```php
Route::get('/reports', [ReportController::class, 'index'])
    ->middleware('role:1,2'); // Both Admin and Dentist can access
```

### Route Groups

Apply to multiple routes at once:

```php
Route::middleware(['role:1'])->group(function () {
    Route::get('/admin/users', [UserController::class, 'index']);
    Route::post('/admin/users', [UserController::class, 'store']);
    Route::delete('/admin/users/{id}', [UserController::class, 'destroy']);
});
```

### Combined with Authentication

The middleware automatically checks if the user is authenticated. If not, it redirects to login.

```php
Route::middleware(['auth', 'role:1'])->group(function () {
    // Admin-only routes
});
```

## Error Handling

- **Unauthenticated users**: Redirected to the login page
- **Unauthorized users** (wrong role): Returns a 403 Forbidden error

## Best Practices

### Use Constants for Role IDs

Consider creating constants in your User model for better maintainability:

```php
// app/Models/User.php
class User extends Authenticatable
{
    const ROLE_ADMIN = 1;
    const ROLE_DENTIST = 2;

    // ... rest of your model
}
```

Then use them in routes:

```php
use App\Models\User;

Route::middleware(['role:' . User::ROLE_ADMIN])->group(function () {
    // Admin routes
});
```

### Create Helper Methods

Add helper methods to your User model:

```php
public function isAdmin(): bool
{
    return $this->role_id === self::ROLE_ADMIN;
}

public function isDentist(): bool
{
    return $this->role_id === self::ROLE_DENTIST;
}
```

## Example Routes File

```php
// routes/web.php
use App\Http\Controllers\AdminController;
use App\Http\Controllers\DentistController;
use App\Models\User;

// Admin-only routes
Route::middleware(['auth', 'role:1'])->prefix('admin')->group(function () {
    Route::get('/dashboard', [AdminController::class, 'dashboard']);
    Route::resource('/users', AdminController::class);
});

// Dentist-only routes
Route::middleware(['auth', 'role:2'])->prefix('dentist')->group(function () {
    Route::get('/appointments', [DentistController::class, 'appointments']);
    Route::get('/patients', [DentistController::class, 'patients']);
});

// Both Admin and Dentist can access
Route::middleware(['auth', 'role:1,2'])->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit']);
    Route::get('/settings', [SettingsController::class, 'index']);
});
```
