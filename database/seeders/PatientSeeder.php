<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Patient;

class PatientSeeder extends Seeder
{
	/**
	 * Run the database seeds.
	 */
	public function run(): void
	{
		Patient::create([
			'patient_fname' => 'John',
			'patient_mname' => 'A.',
			'patient_lname' => 'Doe',
			'date_of_birth' => '1990-01-01',
			'gender' => 'Male',
			'contact_number' => '1234567890',
			'email' => 'john.doe@example.com',
			'address' => '123 Main St',
		]);
		Patient::create([
			'patient_fname' => 'Jane',
			'patient_mname' => 'B.',
			'patient_lname' => 'Smith',
			'date_of_birth' => '1985-05-15',
			'gender' => 'Female',
			'contact_number' => '0987654321',
			'email' => 'jane.smith@example.com',
			'address' => '456 Elm St',
		]);
	}
}
