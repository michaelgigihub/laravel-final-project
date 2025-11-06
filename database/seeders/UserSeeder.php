<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Admin
        User::updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'fname' => 'Admin',
                'mname' => null,
                'lname' => 'User',
                'gender' => 'Male',
                'role_id' => 1,
                'contact_number' => '09170000001',
                'password' => Hash::make('user_0001'),
                'must_change_password' => true,
                'email_verified_at' => now(),
            ]
        );

        // Dentist
        User::updateOrCreate(
            ['email' => 'dentist@example.com'],
            [
                'fname' => 'Dentist',
                'mname' => null,
                'lname' => 'User',
                'gender' => 'Male',
                'role_id' => 2,
                'contact_number' => '09170000002',
                'password' => Hash::make('user_0002'),
                'must_change_password' => true,
                'email_verified_at' => now(),
            ]
        );
    }
}
