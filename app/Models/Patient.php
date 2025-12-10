<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Patient extends Model
{
    use HasFactory;

    protected $fillable = [
        'fname',
        'mname',
        'lname',
        'date_of_birth',
        'gender',
        'contact_number',
        'email',
        'address',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
    ];

    /**
     * Get the patient's appointments.
     */
    public function appointments()
    {
        return $this->hasMany(Appointment::class, 'patient_id');
    }

    /**
     * Get the patient's full name.
     */
    public function getNameAttribute(): string
    {
        $parts = array_filter([$this->fname ?? null, $this->mname ?? null, $this->lname ?? null]);
        return implode(' ', $parts);
    }
}

