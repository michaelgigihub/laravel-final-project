<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Patient extends Model
{
    use HasFactory;

    protected $primaryKey = 'patient_id';

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
}
