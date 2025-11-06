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
        // This seeder now aligns with the new schema by attaching treatments to existing appointments.
        $appointment = DB::table('appointments')->orderBy('id')->first();
        $treatmentType = DB::table('treatment_types')->orderBy('id')->first();

        if (! $appointment || ! $treatmentType) {
            return; // Skip if prerequisites are missing
        }

        // Create one completed treatment record with notes
        $recordId = DB::table('appointment_treatments_records')->insertGetId([
            'appointment_id' => $appointment->id,
            'treatment_type_id' => $treatmentType->id,
            'treatment_notes' => 'Completed treatment; patient tolerated well.',
            'file_path' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Attach some teeth via pivot
        $teeth = DB::table('teeth')->whereIn('id', [14, 15])->pluck('id')->all();
        foreach ($teeth as $toothId) {
            DB::table('appointment_treatment_teeth')->updateOrInsert([
                'appointment_treatment_record_id' => $recordId,
                'tooth_id' => $toothId,
            ], [
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Optionally add an example file entry
        // DB::table('treatment_record_files')->insert([
        //     'appointment_treatment_record_id' => $recordId,
        //     'file_path' => 'uploads/treatments/example.jpg',
        //     'original_name' => 'example.jpg',
        //     'mime_type' => 'image/jpeg',
        //     'size' => 204800,
        //     'created_at' => now(),
        //     'updated_at' => now(),
        // ]);
    }
}
