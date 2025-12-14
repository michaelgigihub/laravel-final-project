<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ClinicService
{
    /**
     * Get the standard weekly operating hours.
     *
     * @return array
     */
    public function getOperatingHours(): array
    {
        $availabilities = DB::table('clinic_availabilities')
            ->orderBy('day_of_week')
            ->get();

        $schedule = [];
        $days = [
            1 => 'Monday', 2 => 'Tuesday', 3 => 'Wednesday', 
            4 => 'Thursday', 5 => 'Friday', 6 => 'Saturday', 7 => 'Sunday'
        ];

        foreach ($days as $num => $name) {
            $dayData = $availabilities->firstWhere('day_of_week', $num);

            if (!$dayData || $dayData->is_closed) {
                $schedule[$name] = 'Closed';
            } else {
                $open = Carbon::parse($dayData->open_time)->format('g:i A');
                $close = Carbon::parse($dayData->close_time)->format('g:i A');
                $schedule[$name] = "$open - $close";
            }
        }

        // Get upcoming closure exceptions
        $exceptions = DB::table('clinic_closure_exceptions')
            ->where('date', '>=', Carbon::today())
            ->where('is_closed', true)
            ->orderBy('date')
            ->limit(5)
            ->get()
            ->map(function ($ex) {
                return Carbon::parse($ex->date)->format('F j, Y') . ': Closed (' . $ex->reason . ')';
            })
            ->toArray();

        return [
            'weekly_schedule' => $schedule,
            'upcoming_closures' => $exceptions
        ];
    }

    /**
     * Get operating hours for a specific day of the week.
     *
     * @param string $dayName e.g., "Monday", "Today", "Tomorrow"
     * @return array
     */
    public function getHoursForDay(string $dayName): array
    {
        $date = new Carbon($dayName);
        $dayOfWeek = $date->dayOfWeekIso; // 1 (Mon) - 7 (Sun)
        $dateStr = $date->format('Y-m-d');

        // Check for specific closure exception
        $exception = DB::table('clinic_closure_exceptions')
            ->where('date', $dateStr)
            ->first();

        if ($exception && $exception->is_closed) {
            return [
                'date' => $date->format('l, F j, Y'),
                'status' => 'Closed',
                'reason' => $exception->reason
            ];
        }

        // Check standard hours
        $availability = DB::table('clinic_availabilities')
            ->where('day_of_week', $dayOfWeek)
            ->first();

        if (!$availability || $availability->is_closed) {
            return [
                'date' => $date->format('l, F j, Y'),
                'status' => 'Closed',
                'reason' => 'Standard weekly closure'
            ];
        }

        return [
            'date' => $date->format('l, F j, Y'),
            'status' => 'Open',
            'open_time' => Carbon::parse($availability->open_time)->format('g:i A'),
            'close_time' => Carbon::parse($availability->close_time)->format('g:i A')
        ];
    }

    /**
     * Check if the clinic is currently open.
     *
     * @return array
     */
    public function checkCurrentStatus(): array
    {
        $now = Carbon::now();
        $todayInfo = $this->getHoursForDay('today');

        if ($todayInfo['status'] === 'Closed') {
            return [
                'is_open' => false,
                'message' => 'The clinic is currently closed today.'
            ];
        }

        $openTime = Carbon::parse($todayInfo['open_time']);
        $closeTime = Carbon::parse($todayInfo['close_time']);

        if ($now->between($openTime, $closeTime)) {
            return [
                'is_open' => true,
                'message' => "The clinic is open until {$todayInfo['close_time']}."
            ];
        }

        if ($now->lessThan($openTime)) {
             return [
                'is_open' => false,
                'message' => "The clinic will open at {$todayInfo['open_time']}."
            ];
        }

        return [
            'is_open' => false,
            'message' => "The clinic closed at {$todayInfo['close_time']}."
        ];
    }
}
