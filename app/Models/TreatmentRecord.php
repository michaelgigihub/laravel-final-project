<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TreatmentRecord extends Model
{
    protected $table = 'appointment_treatments_records';

    protected $fillable = [
        'appointment_id',
        'treatment_type_id',
        'treatment_notes',
        'file_path',
    ];

    /**
     * Get the appointment for this record.
     */
    public function appointment()
    {
        return $this->belongsTo(Appointment::class, 'appointment_id');
    }

    /**
     * Get the treatment type.
     */
    public function treatmentType()
    {
        return $this->belongsTo(TreatmentType::class, 'treatment_type_id');
    }

    /**
     * Get the files for this treatment record.
     */
    public function files()
    {
        return $this->hasMany(TreatmentRecordFile::class, 'appointment_treatment_record_id');
    }

    /**
     * Get the teeth treated in this record.
     */
    public function teeth()
    {
        return $this->belongsToMany(
            Tooth::class,
            'appointment_treatment_teeth',
            'appointment_treatment_record_id',
            'tooth_id'
        );
    }
}
