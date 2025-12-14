<?php

use App\Models\Appointment;
use App\Models\Patient;
use App\Models\TreatmentType;
use App\Models\User;
use App\Services\AppointmentService;
use Illuminate\Support\Facades\DB;

beforeEach(function () {
    // Insert Dentist role directly to avoid model dependencies
    DB::table('roles')->insert([
        'id' => 2,
        'name' => 'Dentist',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    // Create a dentist user directly
    $this->dentist = User::create([
        'fname' => 'Dr. John',
        'lname' => 'Smith',
        'email' => 'dentist@example.com',
        'password' => bcrypt('password'),
        'gender' => 'Male',
        'role_id' => 2,
        'email_verified_at' => now(),
    ]);
});

describe('AppointmentService', function () {
    describe('findNextAppointment', function () {
        it('returns null when no patient matches the name', function () {
            $service = new AppointmentService();

            $result = $service->findNextAppointment('NonExistentPatient');

            expect($result)->toBeNull();
        });

        it('returns null when patient has no upcoming appointments', function () {
            Patient::create([
                'fname' => 'Jane',
                'lname' => 'Doe',
                'date_of_birth' => '1990-01-01',
                'gender' => 'Female',
                'contact_number' => '1234567890',
                'email' => 'jane.doe@example.com',
                'address' => '123 Main St',
            ]);

            $service = new AppointmentService();

            $result = $service->findNextAppointment('Jane');

            expect($result)->toBeNull();
        });

        it('returns the next scheduled appointment for a matching patient', function () {
            $patient = Patient::create([
                'fname' => 'Juan',
                'mname' => 'Miguel',
                'lname' => 'Cruz',
                'date_of_birth' => '1985-05-15',
                'gender' => 'Male',
                'contact_number' => '9876543210',
                'email' => 'juan.cruz@example.com',
                'address' => '456 Oak Ave',
            ]);

            $treatmentType = TreatmentType::create([
                'name' => 'Dental Cleaning',
                'description' => 'Professional teeth cleaning',
                'standard_cost' => 50.00,
                'duration_minutes' => 30,
                'is_active' => true,
            ]);

            $appointment = Appointment::create([
                'patient_id' => $patient->id,
                'dentist_id' => $this->dentist->id,
                'status' => 'Scheduled',
                'appointment_start_datetime' => now()->addDays(3)->setTime(10, 0),
                'appointment_end_datetime' => now()->addDays(3)->setTime(10, 30),
                'purpose_of_appointment' => 'Regular checkup',
            ]);

            $appointment->treatmentTypes()->attach($treatmentType->id);

            $service = new AppointmentService();

            $result = $service->findNextAppointment('Juan');

            expect($result)->not->toBeNull()
                ->and($result)->toBeArray()
                ->and($result['patient_name'])->toContain('Juan')
                ->and($result['dentist_name'])->toContain('John')
                ->and($result['treatment_types'])->toContain('Dental Cleaning')
                ->and($result['purpose'])->toBe('Regular checkup');
        });

        it('performs case-insensitive search', function () {
            $patient = Patient::create([
                'fname' => 'Maria',
                'lname' => 'Santos',
                'date_of_birth' => '1992-08-20',
                'gender' => 'Female',
                'contact_number' => '5551234567',
                'email' => 'maria.santos@example.com',
                'address' => '789 Pine St',
            ]);

            Appointment::create([
                'patient_id' => $patient->id,
                'dentist_id' => $this->dentist->id,
                'status' => 'Scheduled',
                'appointment_start_datetime' => now()->addDays(1),
                'purpose_of_appointment' => 'Consultation',
            ]);

            $service = new AppointmentService();

            $result = $service->findNextAppointment('MARIA');

            expect($result)->not->toBeNull()
                ->and($result['patient_name'])->toContain('Maria');
        });

        it('performs partial name matching', function () {
            $patient = Patient::create([
                'fname' => 'Christopher',
                'lname' => 'Johnson',
                'date_of_birth' => '1988-03-10',
                'gender' => 'Male',
                'contact_number' => '5559876543',
                'email' => 'chris.johnson@example.com',
                'address' => '321 Elm St',
            ]);

            Appointment::create([
                'patient_id' => $patient->id,
                'dentist_id' => $this->dentist->id,
                'status' => 'Scheduled',
                'appointment_start_datetime' => now()->addDays(2),
                'purpose_of_appointment' => 'Tooth extraction',
            ]);

            $service = new AppointmentService();

            $result = $service->findNextAppointment('Chris');

            expect($result)->not->toBeNull()
                ->and($result['patient_name'])->toContain('Christopher');
        });

        it('excludes cancelled appointments', function () {
            $patient = Patient::create([
                'fname' => 'Pedro',
                'lname' => 'Garcia',
                'date_of_birth' => '1995-11-25',
                'gender' => 'Male',
                'contact_number' => '5551112222',
                'email' => 'pedro.garcia@example.com',
                'address' => '555 Maple Dr',
            ]);

            Appointment::create([
                'patient_id' => $patient->id,
                'dentist_id' => $this->dentist->id,
                'status' => 'Cancelled',
                'appointment_start_datetime' => now()->addDays(1),
                'cancellation_reason' => 'Patient requested',
            ]);

            $service = new AppointmentService();

            $result = $service->findNextAppointment('Pedro');

            expect($result)->toBeNull();
        });

        it('excludes completed appointments', function () {
            $patient = Patient::create([
                'fname' => 'Ana',
                'lname' => 'Reyes',
                'date_of_birth' => '1991-07-18',
                'gender' => 'Female',
                'contact_number' => '5553334444',
                'email' => 'ana.reyes@example.com',
                'address' => '888 Cedar Ln',
            ]);

            Appointment::create([
                'patient_id' => $patient->id,
                'dentist_id' => $this->dentist->id,
                'status' => 'Completed',
                'appointment_start_datetime' => now()->subDays(1),
            ]);

            $service = new AppointmentService();

            $result = $service->findNextAppointment('Ana');

            expect($result)->toBeNull();
        });

        it('excludes past appointments', function () {
            $patient = Patient::create([
                'fname' => 'Roberto',
                'lname' => 'Mendoza',
                'date_of_birth' => '1987-02-14',
                'gender' => 'Male',
                'contact_number' => '5555556666',
                'email' => 'roberto.mendoza@example.com',
                'address' => '999 Birch Rd',
            ]);

            Appointment::create([
                'patient_id' => $patient->id,
                'dentist_id' => $this->dentist->id,
                'status' => 'Scheduled',
                'appointment_start_datetime' => now()->subHours(2),
            ]);

            $service = new AppointmentService();

            $result = $service->findNextAppointment('Roberto');

            expect($result)->toBeNull();
        });

        it('returns the closest upcoming appointment when multiple exist', function () {
            $patient = Patient::create([
                'fname' => 'Isabella',
                'lname' => 'Torres',
                'date_of_birth' => '1993-09-30',
                'gender' => 'Female',
                'contact_number' => '5557778888',
                'email' => 'isabella.torres@example.com',
                'address' => '444 Willow Way',
            ]);

            Appointment::create([
                'patient_id' => $patient->id,
                'dentist_id' => $this->dentist->id,
                'status' => 'Scheduled',
                'appointment_start_datetime' => now()->addDays(7),
                'purpose_of_appointment' => 'Follow-up',
            ]);

            Appointment::create([
                'patient_id' => $patient->id,
                'dentist_id' => $this->dentist->id,
                'status' => 'Scheduled',
                'appointment_start_datetime' => now()->addDays(1),
                'purpose_of_appointment' => 'Initial consultation',
            ]);

            $service = new AppointmentService();

            $result = $service->findNextAppointment('Isabella');

            expect($result)->not->toBeNull()
                ->and($result['purpose'])->toBe('Initial consultation');
        });
    });
});
