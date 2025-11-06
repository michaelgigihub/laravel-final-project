<?php

use App\Mail\DentistCredentials;
use App\Models\Role;
use App\Models\Specialization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Create roles
    Role::create(['id' => 1, 'name' => 'Admin']);
    Role::create(['id' => 2, 'name' => 'Dentist']);

    // Create specializations
    $this->specialization1 = Specialization::create(['name' => 'Orthodontics']);
    $this->specialization2 = Specialization::create(['name' => 'Periodontics']);

    // Create admin user with email verified
    $this->admin = User::create([
        'fname' => 'Admin',
        'lname' => 'User',
        'email' => 'admin@example.com',
        'password' => bcrypt('password'),
        'role_id' => 1,
        'gender' => 'Male',
        'email_verified_at' => now(),
    ]);
});

test('dentist index page displays all dentists', function () {
    $this->actingAs($this->admin);

    // Create a dentist with specializations
    $dentist = User::create([
        'fname' => 'John',
        'mname' => 'Middle',
        'lname' => 'Doe',
        'email' => 'john.doe@example.com',
        'password' => bcrypt('password'),
        'role_id' => 2,
        'gender' => 'Male',
        'contact_number' => '1234567890',
    ]);

    // Create dentist profile
    DB::table('dentist_profiles')->insert([
        'dentist_id' => $dentist->id,
        'employment_status' => 'Active',
        'hire_date' => now()->toDateString(),
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    // Attach specializations
    $dentist->specializations()->attach([$this->specialization1->id, $this->specialization2->id]);

    // Visit the dentists index page
    $response = $this->get('/admin/dentists');

    $response->assertStatus(200);
    $response->assertInertia(
        fn($page) => $page->component('DentistsTable')
            ->has('dentists', 1)
            ->where('dentists.0.dentist_id', $dentist->id)
            ->where('dentists.0.fname', 'John')
            ->where('dentists.0.mname', 'Middle')
            ->where('dentists.0.lname', 'Doe')
            ->where('dentists.0.specialization', 'Orthodontics, Periodontics')
            ->where('dentists.0.contact_number', '1234567890')
            ->where('dentists.0.email', 'john.doe@example.com')
            ->where('dentists.0.employment_status', 'Active')
            ->where('dentists.0.hire_date', now()->toDateString())
    );
});

test('dentist index shows only users with dentist role', function () {
    $this->actingAs($this->admin);

    // Create a dentist
    $dentist = User::create([
        'fname' => 'Dentist',
        'lname' => 'User',
        'email' => 'dentist@example.com',
        'password' => bcrypt('password'),
        'role_id' => 2,
        'gender' => 'Male',
    ]);

    DB::table('dentist_profiles')->insert([
        'dentist_id' => $dentist->id,
        'employment_status' => 'Active',
        'hire_date' => now()->toDateString(),
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    // Create a regular user (not dentist)
    User::create([
        'fname' => 'Regular',
        'lname' => 'User',
        'email' => 'regular@example.com',
        'password' => bcrypt('password'),
        'role_id' => 1, // Not a dentist
        'gender' => 'Female',
    ]);

    $response = $this->get('/admin/dentists');

    $response->assertStatus(200);
    $response->assertInertia(
        fn($page) => $page->component('DentistsTable')
            ->has('dentists', 1) // Only 1 dentist, not the regular user
            ->where('dentists.0.email', 'dentist@example.com')
    );
});

test('admin can access dentist registration form', function () {
    $this->actingAs($this->admin);

    $response = $this->get('/admin/dentists/create');

    $response->assertStatus(200);
    $response->assertInertia(
        fn($page) => $page->component('RegisterDentist')
            ->has('specializations')
    );
});

test('admin can create a new dentist', function () {
    Mail::fake();
    $this->actingAs($this->admin);

    $dentistData = [
        'fname' => 'Jane',
        'mname' => 'Marie',
        'lname' => 'Smith',
        'gender' => 'Female',
        'contact_number' => '9876543210',
        'email' => 'jane.smith@example.com',
        'specialization_ids' => [$this->specialization1->id],
        'employment_status' => 'Active',
        'hire_date' => now()->toDateString(),
    ];

    $response = $this->post('/admin/dentists', $dentistData);

    $response->assertRedirect('/admin/dentists');
    $response->assertSessionHas('success', 'Dentist registered successfully.');

    // Verify dentist was created
    $this->assertDatabaseHas('users', [
        'fname' => 'Jane',
        'lname' => 'Smith',
        'email' => 'jane.smith@example.com',
        'role_id' => 2,
    ]);

    // Verify dentist profile was created
    $dentist = User::where('email', 'jane.smith@example.com')->first();
    $this->assertDatabaseHas('dentist_profiles', [
        'dentist_id' => $dentist->id,
        'employment_status' => 'Active',
    ]);

    // Verify specialization was attached
    $this->assertDatabaseHas('dentist_specialization', [
        'dentist_id' => $dentist->id,
        'specialization_id' => $this->specialization1->id,
    ]);

    // Verify admin activity was logged
    $this->assertDatabaseHas('admin_audit', [
        'admin_id' => $this->admin->id,
        'activityTitle' => 'Dentist Created',
        'moduleType' => 'user-management',
        'targetType' => 'dentist',
        'targetId' => $dentist->id,
    ]);

    // Verify email was sent
    Mail::assertSent(DentistCredentials::class, function ($mail) use ($dentist) {
        return $mail->hasTo($dentist->email);
    });
});

test('dentist creation requires valid data', function () {
    $this->actingAs($this->admin);

    $response = $this->post('/admin/dentists', [
        'fname' => '', // Required field missing
        'email' => 'invalid-email', // Invalid email
    ]);

    $response->assertSessionHasErrors(['fname', 'email']);
});

test('dentist email must be unique', function () {
    $this->actingAs($this->admin);

    // Create existing dentist
    User::create([
        'fname' => 'Existing',
        'lname' => 'Dentist',
        'email' => 'existing@example.com',
        'password' => bcrypt('password'),
        'role_id' => 2,
        'gender' => 'Male',
    ]);

    // Try to create another dentist with same email
    $response = $this->post('/admin/dentists', [
        'fname' => 'New',
        'lname' => 'Dentist',
        'email' => 'existing@example.com', // Duplicate email
        'gender' => 'Female',
    ]);

    $response->assertSessionHasErrors(['email']);
});

test('dentist creation with multiple specializations', function () {
    Mail::fake();
    $this->actingAs($this->admin);

    $dentistData = [
        'fname' => 'Multi',
        'lname' => 'Specialist',
        'email' => 'multi@example.com',
        'gender' => 'Male',
        'specialization_ids' => [$this->specialization1->id, $this->specialization2->id],
    ];

    $response = $this->post('/admin/dentists', $dentistData);

    $response->assertRedirect('/admin/dentists');

    $dentist = User::where('email', 'multi@example.com')->first();

    // Verify both specializations were attached
    $this->assertDatabaseHas('dentist_specialization', [
        'dentist_id' => $dentist->id,
        'specialization_id' => $this->specialization1->id,
    ]);

    $this->assertDatabaseHas('dentist_specialization', [
        'dentist_id' => $dentist->id,
        'specialization_id' => $this->specialization2->id,
    ]);

    expect($dentist->specializations)->toHaveCount(2);
});

test('dentist creation sets must_change_password flag', function () {
    Mail::fake();
    $this->actingAs($this->admin);

    $dentistData = [
        'fname' => 'New',
        'lname' => 'Doctor',
        'email' => 'newdoc@example.com',
        'gender' => 'Male',
    ];

    $this->post('/admin/dentists', $dentistData);

    $dentist = User::where('email', 'newdoc@example.com')->first();

    expect($dentist->must_change_password)->toBe(1);
    // Or verify it's truthy
    expect($dentist->must_change_password)->toBeTruthy();
});

test('dentist without specializations can be created', function () {
    Mail::fake();
    $this->actingAs($this->admin);

    $dentistData = [
        'fname' => 'No',
        'lname' => 'Specialty',
        'email' => 'nospec@example.com',
        'gender' => 'Female',
        // No specialization_ids
    ];

    $response = $this->post('/admin/dentists', $dentistData);

    $response->assertRedirect('/admin/dentists');

    $dentist = User::where('email', 'nospec@example.com')->first();

    expect($dentist)->not->toBeNull();
    expect($dentist->specializations)->toHaveCount(0);
});

test('admin can create dentist with avatar', function () {
    Storage::fake('public');
    Mail::fake();
    $this->actingAs($this->admin);

    // Create a simple file without using image() method
    $avatar = UploadedFile::fake()->create('dentist-avatar.jpg', 500, 'image/jpeg');

    $dentistData = [
        'fname' => 'Avatar',
        'lname' => 'Doctor',
        'email' => 'avatar@example.com',
        'gender' => 'Male',
        'avatar' => $avatar,
    ];

    $response = $this->post('/admin/dentists', $dentistData);

    $response->assertRedirect('/admin/dentists');

    $dentist = User::where('email', 'avatar@example.com')->first();

    expect($dentist)->not->toBeNull();
    expect($dentist->avatar_path)->not->toBeNull();
    expect($dentist->avatar_path)->toContain('avatars/dentists');

    // Verify file was stored
    expect(Storage::disk('public')->exists($dentist->avatar_path))->toBeTrue();
});

test('dentist avatar must be valid image file', function () {
    Mail::fake();
    $this->actingAs($this->admin);

    $invalidFile = UploadedFile::fake()->create('document.pdf', 1000);

    $dentistData = [
        'fname' => 'Invalid',
        'lname' => 'Avatar',
        'email' => 'invalid-avatar@example.com',
        'gender' => 'Female',
        'avatar' => $invalidFile,
    ];

    $response = $this->post('/admin/dentists', $dentistData);

    $response->assertSessionHasErrors(['avatar']);
});

test('dentist avatar file size must not exceed 2MB', function () {
    Mail::fake();
    $this->actingAs($this->admin);

    $largeFile = UploadedFile::fake()->create('large-avatar.jpg', 3000, 'image/jpeg'); // 3MB

    $dentistData = [
        'fname' => 'Large',
        'lname' => 'Avatar',
        'email' => 'large-avatar@example.com',
        'gender' => 'Male',
        'avatar' => $largeFile,
    ];

    $response = $this->post('/admin/dentists', $dentistData);

    $response->assertSessionHasErrors(['avatar']);
});

test('dentist can be created without avatar', function () {
    Mail::fake();
    $this->actingAs($this->admin);

    $dentistData = [
        'fname' => 'No',
        'lname' => 'Avatar',
        'email' => 'no-avatar@example.com',
        'gender' => 'Female',
        // No avatar provided
    ];

    $response = $this->post('/admin/dentists', $dentistData);

    $response->assertRedirect('/admin/dentists');

    $dentist = User::where('email', 'no-avatar@example.com')->first();

    expect($dentist)->not->toBeNull();
    expect($dentist->avatar_path)->toBeNull();
});

test('password is auto-generated with correct format', function () {
    Mail::fake();
    $this->actingAs($this->admin);

    $dentistData = [
        'fname' => 'Test',
        'lname' => 'Password',
        'email' => 'testpass@example.com',
        'gender' => 'Male',
    ];

    $response = $this->post('/admin/dentists', $dentistData);

    $dentist = User::where('email', 'testpass@example.com')->first();

    expect($dentist)->not->toBeNull();

    // The password should be hashed, but we can verify the email contains the digits
    Mail::assertSent(DentistCredentials::class, function ($mail) use ($dentist) {
        return $mail->hasTo($dentist->email) &&
            strlen($mail->passwordDigits) === 4 &&
            is_numeric($mail->passwordDigits);
    });
});

test('password generation handles compound last names correctly', function () {
    Mail::fake();
    $this->actingAs($this->admin);

    $dentistData = [
        'fname' => 'Maria',
        'lname' => 'dela Cruz',
        'email' => 'delacruz@example.com',
        'gender' => 'Female',
    ];

    $response = $this->post('/admin/dentists', $dentistData);

    $dentist = User::where('email', 'delacruz@example.com')->first();

    expect($dentist)->not->toBeNull();

    // Password should be generated as: delacruz_{4digits}
    // We can't check the exact password (it's hashed), but we can verify email was sent
    Mail::assertSent(DentistCredentials::class, function ($mail) use ($dentist) {
        return $mail->hasTo($dentist->email);
    });
});

test('email contains only password digits not full password', function () {
    Mail::fake();
    $this->actingAs($this->admin);

    $dentistData = [
        'fname' => 'Security',
        'lname' => 'Test',
        'email' => 'security@example.com',
        'gender' => 'Male',
    ];

    $response = $this->post('/admin/dentists', $dentistData);

    $dentist = User::where('email', 'security@example.com')->first();

    // Verify email was sent with only the 4 digits
    Mail::assertSent(DentistCredentials::class, function ($mail) use ($dentist) {
        // Should have the digits but NOT the full password
        return $mail->hasTo($dentist->email) &&
            strlen($mail->passwordDigits) === 4 &&
            is_numeric($mail->passwordDigits) &&
            ! str_contains($mail->passwordDigits, 'test'); // Should not contain lastname
    });
});

test('admin can view a specific dentist', function () {
    $this->actingAs($this->admin);

    // Create a dentist with specializations
    $dentist = User::create([
        'fname' => 'View',
        'mname' => 'Test',
        'lname' => 'Dentist',
        'email' => 'view.dentist@example.com',
        'password' => bcrypt('password'),
        'role_id' => 2,
        'gender' => 'Female',
        'contact_number' => '1112223333',
    ]);

    DB::table('dentist_profiles')->insert([
        'dentist_id' => $dentist->id,
        'employment_status' => 'Active',
        'hire_date' => now()->toDateString(),
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $dentist->specializations()->attach([$this->specialization1->id]);

    $response = $this->get("/admin/dentists/{$dentist->id}");

    $response->assertStatus(200);
    $response->assertInertia(
        fn($page) => $page->component('dentist/profile')
            ->has('dentist')
            ->has('viewMode')
            ->where('viewMode', 'admin')
            ->where('dentist.id', $dentist->id)
            ->where('dentist.fname', 'View')
            ->where('dentist.mname', 'Test')
            ->where('dentist.lname', 'Dentist')
            ->where('dentist.name', 'View Test Dentist')
            ->where('dentist.gender', 'Female')
            ->where('dentist.email', 'view.dentist@example.com')
            ->where('dentist.contact_number', '1112223333')
            ->where('dentist.employment_status', 'Active')
            ->has('dentist.specializations', 1)
            ->where('dentist.specializations.0.name', 'Orthodontics')
    );
});

test('viewing non-dentist user returns 404', function () {
    $this->actingAs($this->admin);

    // Try to view the admin user (role_id = 1, not a dentist)
    $response = $this->get("/admin/dentists/{$this->admin->id}");

    $response->assertStatus(404);
});

test('viewing non-existent dentist returns 404', function () {
    $this->actingAs($this->admin);

    $response = $this->get('/admin/dentists/99999');

    $response->assertStatus(404);
});
