<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TeethSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * Uses the Universal Numbering System (American System) for adult teeth 1-32.
     * Starts from upper right third molar (#1) and goes clockwise around the mouth.
     */
    public function run(): void
    {
        $now = now();
        
        // Universal Numbering System for adult teeth (1-32)
        $teethNames = [
            // Upper Right Quadrant (1-8) - from back to front
            1 => 'Upper Right Third Molar (Wisdom Tooth)',
            2 => 'Upper Right Second Molar',
            3 => 'Upper Right First Molar',
            4 => 'Upper Right Second Premolar',
            5 => 'Upper Right First Premolar',
            6 => 'Upper Right Canine',
            7 => 'Upper Right Lateral Incisor',
            8 => 'Upper Right Central Incisor',
            
            // Upper Left Quadrant (9-16) - from front to back
            9 => 'Upper Left Central Incisor',
            10 => 'Upper Left Lateral Incisor',
            11 => 'Upper Left Canine',
            12 => 'Upper Left First Premolar',
            13 => 'Upper Left Second Premolar',
            14 => 'Upper Left First Molar',
            15 => 'Upper Left Second Molar',
            16 => 'Upper Left Third Molar (Wisdom Tooth)',
            
            // Lower Left Quadrant (17-24) - from back to front
            17 => 'Lower Left Third Molar (Wisdom Tooth)',
            18 => 'Lower Left Second Molar',
            19 => 'Lower Left First Molar',
            20 => 'Lower Left Second Premolar',
            21 => 'Lower Left First Premolar',
            22 => 'Lower Left Canine',
            23 => 'Lower Left Lateral Incisor',
            24 => 'Lower Left Central Incisor',
            
            // Lower Right Quadrant (25-32) - from front to back
            25 => 'Lower Right Central Incisor',
            26 => 'Lower Right Lateral Incisor',
            27 => 'Lower Right Canine',
            28 => 'Lower Right First Premolar',
            29 => 'Lower Right Second Premolar',
            30 => 'Lower Right First Molar',
            31 => 'Lower Right Second Molar',
            32 => 'Lower Right Third Molar (Wisdom Tooth)',
        ];

        $rows = [];
        foreach ($teethNames as $id => $name) {
            $rows[] = [
                'id' => $id,
                'name' => $name,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        DB::table('teeth')->upsert($rows, ['id'], ['name', 'updated_at']);
    }
}

