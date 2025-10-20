<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TreatmentTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
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
            ],
            [
                'name' => 'Tooth Filling',
                'description' => 'Restoration of a tooth with a filling material',
                'standard_cost' => 200.00,
                'duration_minutes' => 45,
                'is_active' => true,
            ],
            [
                'name' => 'Root Canal',
                'description' => 'Treatment to remove infected pulp from a tooth',
                'standard_cost' => 800.00,
                'duration_minutes' => 90,
                'is_active' => true,
            ],
            [
                'name' => 'Dental Crown',
                'description' => 'Cap placed over a damaged tooth',
                'standard_cost' => 1200.00,
                'duration_minutes' => 120,
                'is_active' => true,
            ],
            [
                'name' => 'Tooth Extraction',
                'description' => 'Removal of a tooth from the socket',
                'standard_cost' => 150.00,
                'duration_minutes' => 30,
                'is_active' => true,
            ],
            [
                'name' => 'Orthodontic Consultation',
                'description' => 'Initial consultation for braces or aligners',
                'standard_cost' => 100.00,
                'duration_minutes' => 45,
                'is_active' => true,
            ],
            [
                'name' => 'Dental Implant',
                'description' => 'Surgical placement of a dental implant',
                'standard_cost' => 2500.00,
                'duration_minutes' => 180,
                'is_active' => true,
            ],
        ]);
    }
}
