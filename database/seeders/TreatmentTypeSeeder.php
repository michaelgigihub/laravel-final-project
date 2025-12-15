<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TreatmentTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * Per-tooth pricing (is_per_tooth = true):
     *   - Fillings, Extractions, Crowns, Root Canals, Dental Implants
     * 
     * Flat-rate pricing (is_per_tooth = false):
     *   - Cleanings, Consultations
     */
    public function run(): void
    {
        DB::table('treatment_types')->insert([
            [
                'name' => 'Dental Cleaning',
                'description' => 'Routine cleaning to remove plaque and tartar',
                'standard_cost' => 150.00,
                'duration_minutes' => 60,
                'is_active' => true,
                'is_per_tooth' => false, // Flat rate per session
            ],
            [
                'name' => 'Tooth Filling',
                'description' => 'Restoration of a tooth with a filling material',
                'standard_cost' => 200.00,
                'duration_minutes' => 45,
                'is_active' => true,
                'is_per_tooth' => true, // Priced per tooth
            ],
            [
                'name' => 'Root Canal',
                'description' => 'Treatment to remove infected pulp from a tooth',
                'standard_cost' => 800.00,
                'duration_minutes' => 90,
                'is_active' => true,
                'is_per_tooth' => true, // Priced per tooth
            ],
            [
                'name' => 'Dental Crown',
                'description' => 'Cap placed over a damaged tooth',
                'standard_cost' => 1200.00,
                'duration_minutes' => 120,
                'is_active' => true,
                'is_per_tooth' => true, // Priced per tooth
            ],
            [
                'name' => 'Tooth Extraction',
                'description' => 'Removal of a tooth from the socket',
                'standard_cost' => 150.00,
                'duration_minutes' => 30,
                'is_active' => true,
                'is_per_tooth' => true, // Priced per tooth
            ],
            [
                'name' => 'Orthodontic Consultation',
                'description' => 'Initial consultation for braces or aligners',
                'standard_cost' => 100.00,
                'duration_minutes' => 45,
                'is_active' => true,
                'is_per_tooth' => false, // Flat rate consultation
            ],
            [
                'name' => 'Dental Implant',
                'description' => 'Surgical placement of a dental implant',
                'standard_cost' => 2500.00,
                'duration_minutes' => 180,
                'is_active' => true,
                'is_per_tooth' => true, // Priced per implant/tooth
            ],
        ]);
    }
}
