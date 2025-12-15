<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TreatmentType extends Model
{
    protected $table = 'treatment_types';

    protected $fillable = [
        'name',
        'description',
        'standard_cost',
        'is_per_tooth',
        'duration_minutes',
        'is_active',
    ];

    protected $casts = [
        'standard_cost' => 'decimal:2',
        'is_per_tooth' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function appointments()
    {
        return $this->belongsToMany(
            Appointment::class,
            'appointment_treatment',
            'treatment_type_id',
            'appointment_id'
        );
    }
}

