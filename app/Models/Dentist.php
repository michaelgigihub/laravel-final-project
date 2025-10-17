<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Dentist extends Model
{
    protected $table = 'dentists';

    protected $primaryKey = 'dentist_id';

    protected $fillable = [
        'dentist_fname',
        'dentist_mname',
        'dentist_lname',
        'specialization',
        'contact_number',
        'email',
    ];
}
