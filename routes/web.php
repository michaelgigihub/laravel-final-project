
<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PatientController;
use App\Http\Controllers\DentistController;
use Inertia\Inertia;

// API routes for React frontend
Route::get('/api/patients', [PatientController::class, 'apiIndex']);
Route::get('/api/dentists', [DentistController::class, 'apiIndex']);

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

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
