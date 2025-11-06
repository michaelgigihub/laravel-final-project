<?php

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Create roles
    Role::create(['id' => 1, 'name' => 'Admin']);
    Role::create(['id' => 2, 'name' => 'Dentist']);
});

test('user with must_change_password is redirected to change password page', function () {
    $user = User::create([
        'fname' => 'John',
        'lname' => 'Doe',
        'email' => 'john@example.com',
        'password' => Hash::make('password'),
        'role_id' => 2,
        'gender' => 'Male',
        'email_verified_at' => now(),
        'must_change_password' => true,
    ]);

    $response = $this->actingAs($user)->get('/dashboard');

    $response->assertRedirect('/change-password');
});

test('user without must_change_password can access dashboard', function () {
    $user = User::create([
        'fname' => 'John',
        'lname' => 'Doe',
        'email' => 'john@example.com',
        'password' => Hash::make('password'),
        'role_id' => 2,
        'gender' => 'Male',
        'email_verified_at' => now(),
        'must_change_password' => false,
    ]);

    $response = $this->actingAs($user)->get('/dashboard');

    $response->assertStatus(200);
});

test('user can access change password page', function () {
    $user = User::create([
        'fname' => 'John',
        'lname' => 'Doe',
        'email' => 'john@example.com',
        'password' => Hash::make('password'),
        'role_id' => 2,
        'gender' => 'Male',
        'email_verified_at' => now(),
        'must_change_password' => true,
    ]);

    $response = $this->actingAs($user)->get('/change-password');

    $response->assertStatus(200);
    $response->assertInertia(
        fn ($page) => $page
            ->component('auth/ChangePassword')
            ->has('mustChangePassword')
            ->where('mustChangePassword', true)
    );
});

test('user can change password successfully', function () {
    $user = User::create([
        'fname' => 'John',
        'lname' => 'Doe',
        'email' => 'john@example.com',
        'password' => Hash::make('old-password'),
        'role_id' => 2,
        'gender' => 'Male',
        'email_verified_at' => now(),
        'must_change_password' => true,
    ]);

    $response = $this->actingAs($user)->post('/change-password', [
        'password' => 'new-password',
        'password_confirmation' => 'new-password',
    ]);

    $response->assertRedirect('/dashboard');

    $user->refresh();

    expect($user->must_change_password)->toBe(0);
    expect(Hash::check('new-password', $user->password))->toBe(true);
});

test('user cannot change password with mismatched confirmation', function () {
    $user = User::create([
        'fname' => 'John',
        'lname' => 'Doe',
        'email' => 'john@example.com',
        'password' => Hash::make('old-password'),
        'role_id' => 2,
        'gender' => 'Male',
        'email_verified_at' => now(),
        'must_change_password' => true,
    ]);

    $response = $this->actingAs($user)->post('/change-password', [
        'password' => 'new-password',
        'password_confirmation' => 'different-password',
    ]);

    $response->assertSessionHasErrors(['password']);
});

test('user cannot change password to same as current password', function () {
    $user = User::create([
        'fname' => 'John',
        'lname' => 'Doe',
        'email' => 'john@example.com',
        'password' => Hash::make('current-password'),
        'role_id' => 2,
        'gender' => 'Male',
        'email_verified_at' => now(),
        'must_change_password' => true,
    ]);

    $response = $this->actingAs($user)->post('/change-password', [
        'password' => 'current-password',
        'password_confirmation' => 'current-password',
    ]);

    $response->assertSessionHasErrors(['password']);

    $user->refresh();
    expect($user->must_change_password)->toBe(1);
});

test('after changing password user can access protected routes', function () {
    $user = User::create([
        'fname' => 'John',
        'lname' => 'Doe',
        'email' => 'john@example.com',
        'password' => Hash::make('old-password'),
        'role_id' => 2,
        'gender' => 'Male',
        'email_verified_at' => now(),
        'must_change_password' => true,
    ]);

    // First, try to access dashboard - should be redirected
    $this->actingAs($user)->get('/dashboard')->assertRedirect('/change-password');

    // Change password
    $this->actingAs($user)->post('/change-password', [
        'password' => 'new-password',
        'password_confirmation' => 'new-password',
    ]);

    $user->refresh();

    // Now should be able to access dashboard
    $response = $this->actingAs($user)->get('/dashboard');
    $response->assertStatus(200);
});
