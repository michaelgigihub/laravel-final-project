<?php

namespace Database\Seeders;

use App\Models\Dentist;
use Illuminate\Database\Seeder;

class DentistSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Dentist::create([
            'dentist_fname' => 'John',
            'dentist_mname' => 'Alo',
            'dentist_lname' => 'Doe',
            'specialization' => 1, // Assuming 1 is for General Dentistry
            'contact_number' => '123-456-7890',
            'email' => 'john.doe@example.com',
        ]);

        Dentist::create([
            'dentist_fname' => 'Jane',
            'dentist_mname' => 'Baba',
            'dentist_lname' => 'Smith',
            'specialization' => 2, // Assuming 2 is for Orthodontics
            'contact_number' => '098-765-4321',
            'email' => 'jane.smith@example.com',
        ]);

        // Add more dentists as needed
    }
}
