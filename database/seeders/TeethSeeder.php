<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TeethSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Seed teeth 1..32 with simple names; adjust naming as needed later
        $rows = [];
        $now = now();
        for ($i = 1; $i <= 32; $i++) {
            $rows[] = [
                'id' => $i,
                'name' => 'Tooth '.$i,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        DB::table('teeth')->upsert($rows, ['id'], ['name', 'updated_at']);
    }
}
