<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClinicAvailability extends Model
{
    protected $table = 'clinic_availabilities';

    protected $fillable = [
        'day_of_week',
        'open_time',
        'close_time',
        'is_closed',
    ];

    protected $casts = [
        'is_closed' => 'boolean',
    ];

    /**
     * Get the day name from day_of_week number.
     * 1 = Monday, 7 = Sunday
     */
    public function getDayNameAttribute(): string
    {
        $days = [
            1 => 'Monday',
            2 => 'Tuesday',
            3 => 'Wednesday',
            4 => 'Thursday',
            5 => 'Friday',
            6 => 'Saturday',
            7 => 'Sunday',
        ];

        return $days[$this->day_of_week] ?? 'Unknown';
    }
}
