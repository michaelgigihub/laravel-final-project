
<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\Auth\ChangePasswordController;
use App\Http\Controllers\DentistController;
use App\Http\Controllers\PatientController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// API routes for React frontend
Route::get('/api/patients', [\App\Http\Controllers\Api\PatientController::class, 'index']);

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

// Password change routes (accessible even when must_change_password is true)
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/change-password', [ChangePasswordController::class, 'show'])->name('password.change');
    Route::post('/change-password', [ChangePasswordController::class, 'update'])->name('password.change.update');
});

// Protected routes (require password change if needed)
Route::middleware(['auth', 'verified', 'password.changed'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
    Route::get('/patients', [PatientController::class, 'index'])->name('patients.index');
});

// Admin-only routes for dentist management
Route::middleware(['auth', 'verified', 'password.changed', 'role:1'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dentists', [AdminController::class, 'indexDentists'])->name('dentists.index');
    Route::get('/dentists/create', [AdminController::class, 'createDentist'])->name('dentists.create');
    Route::post('/dentists', [AdminController::class, 'storeDentist'])->name('dentists.store');
    Route::get('/dentists/{dentist}', [AdminController::class, 'showDentist'])->name('dentists.show');
});

// Dentist-only routes
Route::middleware(['auth', 'verified', 'password.changed', 'role:2'])->prefix('dentist')->name('dentist.')->group(function () {
    Route::get('/profile', [DentistController::class, 'profile'])->name('profile');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
