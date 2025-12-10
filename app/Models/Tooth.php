<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tooth extends Model
{
    protected $table = 'teeth';

    protected $fillable = [
        'name',
    ];

    /**
     * Get treatment records that treated this tooth.
     */
    public function treatmentRecords()
    {
        return $this->belongsToMany(
            TreatmentRecord::class,
            'appointment_treatment_teeth',
            'tooth_id',
            'appointment_treatment_record_id'
        );
    }
}
