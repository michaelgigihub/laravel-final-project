<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Appointment extends Model
{
    protected $table = 'appointments';

    protected $fillable = [
        'patient_id',
        'dentist_id',
        'status',
        'appointment_start_datetime',
        'appointment_end_datetime',
        'purpose_of_appointment',
        'cancellation_reason',
    ];

    protected $casts = [
        'appointment_start_datetime' => 'datetime',
        'appointment_end_datetime' => 'datetime',
    ];

    /**
     * Get the patient for this appointment.
     */
    public function patient()
    {
        return $this->belongsTo(Patient::class, 'patient_id');
    }

    /**
     * Get the dentist (User) for this appointment.
     */
    public function dentist()
    {
        return $this->belongsTo(User::class, 'dentist_id');
    }

    /**
     * Get the treatment types for this appointment (via pivot table).
     */
    public function treatmentTypes()
    {
        return $this->belongsToMany(
            TreatmentType::class,
            'appointment_treatments_records',
            'appointment_id',
            'treatment_type_id'
        );
    }

    /**
     * Get the treatment records for this appointment.
     */
    public function treatmentRecords()
    {
        return $this->hasMany(TreatmentRecord::class, 'appointment_id');
    }
}

