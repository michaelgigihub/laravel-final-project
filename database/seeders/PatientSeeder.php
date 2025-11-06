<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PatientSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('patients')->upsert([
            [
                'id' => 1,
                'fname' => 'John',
                'mname' => 'A.',
                'lname' => 'Doe',
                'date_of_birth' => '1990-01-01',
                'gender' => 'Male',
                'contact_number' => '09171234567',
                'email' => 'john.doe@example.com',
                'address' => '123 Main St, Sampaloc, Manila',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 2,
                'fname' => 'Jane',
                'mname' => 'B.',
                'lname' => 'Smith',
                'date_of_birth' => '1985-05-15',
                'gender' => 'Female',
                'contact_number' => '09179876543',
                'email' => 'jane.smith@example.com',
                'address' => '456 Elm St, Sampaloc, Manila',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ], ['id'], ['fname', 'mname', 'lname', 'date_of_birth', 'gender', 'contact_number', 'email', 'address', 'updated_at']);
    }
}
