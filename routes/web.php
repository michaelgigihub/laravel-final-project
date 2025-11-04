
<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PatientController;
use App\Http\Controllers\DentistController;
use Inertia\Inertia;

// API routes for React frontend
Route::get('/api/patients', [\App\Http\Controllers\Api\PatientController::class, 'index']);
Route::get('/api/dentists', [\App\Http\Controllers\Api\DentistController::class, 'index']);

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

Route::get('/patients', [PatientController::class, 'index'])->name('patients.index');
Route::get('/dentists', [DentistController::class, 'index'])->name('dentists.index');

// Admin-only routes for dentist management
Route::middleware(['auth', 'role:1'])->group(function () {
    Route::post('/dentists', [DentistController::class, 'store'])->name('dentists.store');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
