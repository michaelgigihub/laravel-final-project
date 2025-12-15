
<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\Auth\ChangePasswordController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\ClinicAvailabilityController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DentistController;
use App\Http\Controllers\PatientController;
use App\Http\Controllers\SpecializationController;
use App\Http\Controllers\TreatmentRecordController;
use App\Http\Controllers\TreatmentTypeController;
use App\Http\Controllers\ToothController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// API routes for React frontend
Route::get('/api/patients', [\App\Http\Controllers\Api\PatientController::class, 'index']);

// AI Chat API endpoints (authenticated users)
Route::middleware(['auth', 'verified', 'password.changed'])->group(function () {
    // Rate limit chat endpoint: 30 requests per minute to prevent abuse
    Route::post('/api/chat', [ChatController::class, 'sendMessage'])
        ->middleware('throttle:30,1')
        ->name('chat.send');
    Route::get('/api/chat/conversations', [ChatController::class, 'getConversations'])->name('chat.conversations');
    Route::get('/api/chat/conversations/{id}/messages', [ChatController::class, 'getConversationMessages'])->name('chat.messages');
    Route::delete('/api/chat/conversations/{id}', [ChatController::class, 'deleteConversation'])->name('chat.delete');
    Route::delete('/api/chat/messages/{id}', [ChatController::class, 'deleteMessage'])->name('chat.message.delete');
    Route::delete('/api/chat/conversations/{id}/cancel', [ChatController::class, 'cancelLastMessage'])->name('chat.cancel');
});

// Guest chat endpoint (no auth, stricter rate limit: 5 requests per minute)
Route::post('/api/chat/guest', [ChatController::class, 'sendGuestMessage'])
    ->middleware('throttle:5,1')
    ->name('chat.guest');

Route::get('/', function () {
    $treatmentTypes = \App\Models\TreatmentType::query()
        ->where('is_active', true)
        ->orderBy('name')
        ->get(['id', 'name', 'description', 'standard_cost', 'duration_minutes']);

    $dentists = \App\Models\User::dentists()
        ->with(['specializations', 'dentistProfile'])
        ->whereHas('dentistProfile', fn ($q) => $q->whereIn('employment_status', ['active', 'Active']))
        ->get()
        ->map(fn ($d) => [
            'id' => $d->id,
            'name' => $d->name,
            'avatar_url' => $d->avatar_url,
            'specializations' => $d->specializations->pluck('name')->toArray(),
            'experience_label' => $d->dentistProfile?->hire_date
                ? $d->dentistProfile->hire_date->diffForHumans(null, \Carbon\CarbonInterface::DIFF_ABSOLUTE, false, 1) . ' of Experience'
                : 'Experienced Dentist',
        ])
        ->values()
        ->toArray();

    return Inertia::render('welcome', [
        'treatmentTypes' => $treatmentTypes,
        'dentists' => $dentists,
    ]);
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
    Route::post('appointments/{appointment}/treatment-records/{treatmentRecord}/update', [TreatmentRecordController::class, 'update'])->name('treatment-records.update');
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
    Route::get('/teeth', [ToothController::class, 'index'])->name('teeth.index');
    Route::put('/teeth/{tooth}', [ToothController::class, 'update'])->name('teeth.update');

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
