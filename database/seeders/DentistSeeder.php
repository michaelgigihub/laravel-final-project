<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DentistSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Link the already seeded dentist user to a profile and specializations
        $dentist = User::where('email', 'dentist@example.com')->first();
        if (! $dentist) {
            return; // ensure idempotency even if user seeder wasn't run
        }

        // Create/ensure dentist profile
        DB::table('dentist_profiles')->updateOrInsert(
            ['dentist_id' => $dentist->id],
            [
                'employment_status' => 'Active',
                'hire_date' => now()->toDateString(),
                'archived_at' => null,
                'deleted_at' => null,
                'updated_at' => now(),
                'created_at' => now(),
            ]
        );

        // Attach one or two specializations for demo
        $specIds = DB::table('specializations')
            ->whereIn('name', ['General Dentistry', 'Orthodontics'])
            ->pluck('id')
            ->all();

        foreach ($specIds as $sid) {
            DB::table('dentist_specialization')->updateOrInsert(
                ['dentist_id' => $dentist->id, 'specialization_id' => $sid],
                ['created_at' => now(), 'updated_at' => now()]
            );
        }
    }
}
