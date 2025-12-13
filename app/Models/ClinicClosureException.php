<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClinicClosureException extends Model
{
    protected $table = 'clinic_closure_exceptions';

    protected $fillable = [
        'date',
        'reason',
        'is_closed',
    ];

    protected $casts = [
        'date' => 'date',
        'is_closed' => 'boolean',
    ];
}
