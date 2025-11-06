<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class DentistProfile extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'dentist_id',
        'employment_status',
        'hire_date',
        'archived_at',
    ];

    protected $casts = [
        'hire_date' => 'date',
        'archived_at' => 'datetime',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var list<string>
     */
    protected $appends = [
        'hire_date_formatted',
    ];

    /**
     * Get formatted hire date.
     */
    public function getHireDateFormattedAttribute(): ?string
    {
        return $this->hire_date?->format('F d, Y');
    }

    /**
     * Get the dentist user.
     */
    public function dentist()
    {
        return $this->belongsTo(User::class, 'dentist_id');
    }
}
