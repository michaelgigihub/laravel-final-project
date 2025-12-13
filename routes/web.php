
<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\Auth\ChangePasswordController;
use App\Http\Controllers\ClinicAvailabilityController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DentistController;
use App\Http\Controllers\PatientController;
use App\Http\Controllers\SpecializationController;
use App\Http\Controllers\TreatmentRecordController;
use App\Http\Controllers\TreatmentTypeController;
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
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('api/search', [\App\Http\Controllers\SearchController::class, 'search'])->name('search');
    
    // Patient resource routes (full CRUD)
    Route::resource('patients', PatientController::class);
    
    // Appointment routes
    Route::resource('appointments', AppointmentController::class);
    Route::post('appointments/{appointment}/cancel', [AppointmentController::class, 'cancel'])->name('appointments.cancel');
    Route::post('appointments/{appointment}/complete', [AppointmentController::class, 'complete'])->name('appointments.complete');
    
    // Treatment records index (standalone page)
    Route::get('treatment-records', [TreatmentRecordController::class, 'index'])->name('treatment-records.index');
    
    // Treatment records (nested under appointments)
    Route::get('appointments/{appointment}/treatment-records/{treatmentRecord}', [TreatmentRecordController::class, 'show'])->name('treatment-records.show');
    Route::get('appointments/{appointment}/treatment-records/{treatmentRecord}/edit', [TreatmentRecordController::class, 'edit'])->name('treatment-records.edit');
    Route::put('appointments/{appointment}/treatment-records/{treatmentRecord}/notes', [TreatmentRecordController::class, 'updateNotes'])->name('treatment-records.update-notes');
    Route::put('appointments/{appointment}/treatment-records/{treatmentRecord}/teeth', [TreatmentRecordController::class, 'updateTeeth'])->name('treatment-records.update-teeth');
    Route::post('appointments/{appointment}/treatment-records/{treatmentRecord}/files', [TreatmentRecordController::class, 'uploadFile'])->name('treatment-records.upload-file');
    Route::delete('appointments/{appointment}/treatment-records/{treatmentRecord}/files/{file}', [TreatmentRecordController::class, 'deleteFile'])->name('treatment-records.delete-file');
});

// Admin-only routes for dentist management
Route::middleware(['auth', 'verified', 'password.changed', 'role:1'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dentists', [AdminController::class, 'indexDentists'])->name('dentists.index');
    Route::get('/dentists/create', [AdminController::class, 'createDentist'])->name('dentists.create');
    Route::post('/dentists', [AdminController::class, 'storeDentist'])->name('dentists.store');
    Route::get('/dentists/{dentist}', [AdminController::class, 'showDentist'])->name('dentists.show');
    Route::put('/dentists/{dentist}', [AdminController::class, 'updateDentist'])->name('dentists.update');
    Route::get('/audit-logs', [AdminController::class, 'indexAuditLogs'])->name('audit.logs');

    // Specializations management (Store/Update/Delete)
    Route::post('/specializations', [SpecializationController::class, 'store'])->name('specializations.store');
    Route::put('/specializations/{specialization}', [SpecializationController::class, 'update'])->name('specializations.update');
    Route::delete('/specializations/{specialization}', [SpecializationController::class, 'destroy'])->name('specializations.destroy');

    // Treatment types management (Store/Update/Delete)
    Route::post('/treatment-types', [TreatmentTypeController::class, 'store'])->name('treatment-types.store');
    Route::put('/treatment-types/{treatmentType}', [TreatmentTypeController::class, 'update'])->name('treatment-types.update');
    Route::delete('/treatment-types/{treatmentType}', [TreatmentTypeController::class, 'destroy'])->name('treatment-types.destroy');

    // Admin Users management
    Route::get('/users', [AdminController::class, 'indexAdmins'])->name('users.index');
    Route::post('/users', [AdminController::class, 'storeAdmin'])->name('users.store');
});

// Shared Management Routes (Admin & Dentist)
Route::middleware(['auth', 'verified', 'password.changed', 'role:1,2'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/specializations', [SpecializationController::class, 'index'])->name('specializations.index');
    Route::get('/treatment-types', [TreatmentTypeController::class, 'index'])->name('treatment-types.index');

    // Clinic Availability management
    Route::get('/clinic-availability', [ClinicAvailabilityController::class, 'index'])->name('clinic-availability.index');
    Route::post('/clinic-availability', [ClinicAvailabilityController::class, 'storeOrUpdate'])->name('clinic-availability.store');
    Route::delete('/clinic-availability/{clinicAvailability}', [ClinicAvailabilityController::class, 'destroy'])->name('clinic-availability.destroy');
    Route::post('/clinic-closures', [ClinicAvailabilityController::class, 'storeClosure'])->name('clinic-closures.store');
    Route::delete('/clinic-closures/{closure}', [ClinicAvailabilityController::class, 'destroyClosure'])->name('clinic-closures.destroy');

    // Reports
    Route::get('/reports', [\App\Http\Controllers\ReportsController::class, 'index'])->name('reports.index');
    Route::get('/reports/appointments', [\App\Http\Controllers\ReportsController::class, 'appointmentsReport'])->name('reports.appointments');
    Route::get('/reports/patients', [\App\Http\Controllers\ReportsController::class, 'patientsReport'])->name('reports.patients');
    Route::get('/reports/dentists', [\App\Http\Controllers\ReportsController::class, 'dentistsReport'])->name('reports.dentists');
    Route::get('/reports/treatments', [\App\Http\Controllers\ReportsController::class, 'treatmentsReport'])->name('reports.treatments');
});

// Dentist-only routes
Route::middleware(['auth', 'verified', 'password.changed', 'role:2'])->prefix('dentist')->name('dentist.')->group(function () {
    Route::get('/dashboard', [DentistController::class, 'dashboard'])->name('dashboard');
    Route::get('/profile', [DentistController::class, 'profile'])->name('profile');
    Route::put('/profile', [DentistController::class, 'updateProfile'])->name('profile.update');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
