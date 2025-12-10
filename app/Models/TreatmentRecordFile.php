<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TreatmentRecordFile extends Model
{
    protected $table = 'treatment_record_files';

    protected $fillable = [
        'appointment_treatment_record_id',
        'file_path',
        'original_name',
        'mime_type',
        'size',
    ];

    /**
     * Get the treatment record this file belongs to.
     */
    public function treatmentRecord()
    {
        return $this->belongsTo(TreatmentRecord::class, 'appointment_treatment_record_id');
    }
}
