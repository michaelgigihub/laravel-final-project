<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SpecializationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('specialization')->insert([
            ['specialization_name' => 'General Dentistry'],
            ['specialization_name' => 'Orthodontics'],
            ['specialization_name' => 'Oral Surgery'],
            ['specialization_name' => 'Periodontics'],
            ['specialization_name' => 'Endodontics'],
            ['specialization_name' => 'Pediatric Dentistry'],
            ['specialization_name' => 'Prosthodontics'],
        ]);
    }
}
