<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Order matters due to FKs
        $this->call([
            RoleSeeder::class,
            SpecializationSeeder::class,
            TreatmentTypeSeeder::class,
            TeethSeeder::class,
            UserSeeder::class,
            PatientSeeder::class,
            DentistSeeder::class, // creates dentist_profiles and pivot links
            AppointmentSeeder::class,
            TreatmentRecordSeeder::class,
        ]);
    }
}
