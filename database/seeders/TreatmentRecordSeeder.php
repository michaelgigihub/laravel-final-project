<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TreatmentRecordSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('treatment_records')->insert([
            [
                'patient_id' => 1,
                'dentist_id' => 1,
                'treatment_type_id' => 1,
                'treatment_details' => 'Routine dental cleaning and check-up. Patient showed good oral hygiene.',
                'treatment_date' => '2025-10-01',
            ],
            [
                'patient_id' => 1,
                'dentist_id' => 2,
                'treatment_type_id' => 2,
                'treatment_details' => 'Composite filling placed on molar due to cavity. Local anesthesia used.',
                'treatment_date' => '2025-09-15',
            ],
            [
                'patient_id' => 2,
                'dentist_id' => 1,
                'treatment_type_id' => 3,
                'treatment_details' => 'Root canal therapy completed on upper incisor. Tooth saved successfully.',
                'treatment_date' => '2025-08-20',
            ],
            [
                'patient_id' => 2,
                'dentist_id' => 3,
                'treatment_type_id' => 4,
                'treatment_details' => 'Porcelain crown placed on damaged premolar. Excellent fit achieved.',
                'treatment_date' => '2025-07-10',
            ],
            [
                'patient_id' => 3,
                'dentist_id' => 2,
                'treatment_type_id' => 5,
                'treatment_details' => 'Wisdom tooth extraction performed under local anesthesia. No complications.',
                'treatment_date' => '2025-06-05',
            ],
        ]);
    }
}
