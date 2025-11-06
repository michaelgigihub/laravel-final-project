<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AppointmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Find a patient and a dentist user
        $patient = DB::table('patients')->orderBy('id')->first();
        $dentistUser = User::where('email', 'dentist@example.com')->first();
        if (! $patient || ! $dentistUser) {
            return; // skip if prerequisites missing
        }

        $start = now()->addDay()->setTime(10, 0, 0);
        $end = (clone $start)->addHour();

        // Create an appointment if none exists yet for this pair at this time
        $appointmentId = DB::table('appointments')->insertGetId([
            'patient_id' => $patient->id,
            'dentist_id' => $dentistUser->id,
            'status' => 'Scheduled',
            'appointment_start_datetime' => $start,
            'appointment_end_datetime' => $end,
            'purpose_of_appointment' => 'Initial check-up and cleaning',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Attach a treatment to this appointment
        $treatmentType = DB::table('treatment_types')->orderBy('id')->first();
        if ($treatmentType) {
            $recordId = DB::table('appointment_treatments_records')->insertGetId([
                'appointment_id' => $appointmentId,
                'treatment_type_id' => $treatmentType->id,
                'treatment_notes' => null,
                'file_path' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Optionally attach a couple of teeth via the pivot if present
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

            // Example multiple file entry (optional, leave empty by default)
            // DB::table('treatment_record_files')->insert([
            //     'appointment_treatment_record_id' => $recordId,
            //     'file_path' => 'path/to/file.pdf',
            //     'original_name' => 'file.pdf',
            //     'mime_type' => 'application/pdf',
            //     'size' => 12345,
            //     'created_at' => now(),
            //     'updated_at' => now(),
            // ]);
        }
    }
}
