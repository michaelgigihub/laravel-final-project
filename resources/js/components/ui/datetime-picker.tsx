'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { TimePicker } from '@/components/ui/time-picker';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

interface DateTimePickerProps {
    value?: Date | string;
    onChange?: (date: Date | undefined) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    /** Minimum selectable datetime */
    minDate?: Date;
    /** Maximum selectable datetime */
    maxDate?: Date;
    /** If true, user cannot select past dates (sets minDate to today) */
    disablePast?: boolean;
}

export function DateTimePicker({
    value,
    onChange,
    placeholder = 'Select date and time',
    disabled = false,
    className,
    minDate,
    maxDate,
    disablePast = false,
}: DateTimePickerProps) {
    const [open, setOpen] = React.useState(false);
    
    // Convert string value to Date if needed
    const dateValue = React.useMemo(() => {
        if (!value) return undefined;
        if (typeof value === 'string') {
            const parsed = new Date(value);
            return isNaN(parsed.getTime()) ? undefined : parsed;
        }
        return value;
    }, [value]);

    const [month, setMonth] = React.useState<Date>(dateValue || new Date());
    
    // Get time string from date
    const timeValue = React.useMemo(() => {
        if (!dateValue) return '09:00';
        const hours = dateValue.getHours().toString().padStart(2, '0');
        const minutes = dateValue.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }, [dateValue]);

    // Calculate effective minDate
    const effectiveMinDate = React.useMemo(() => {
        if (disablePast) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return minDate && minDate > today ? minDate : today;
        }
        return minDate;
    }, [minDate, disablePast]);

    const handleDateSelect = (date: Date | undefined) => {
        if (!date) {
            onChange?.(undefined);
            return;
        }
        // Combine selected date with current time
        const [hours, minutes] = timeValue.split(':').map(Number);
        date.setHours(hours, minutes, 0, 0);
        onChange?.(date);
    };

    const handleTimeChange = (newTime: string) => {
        if (dateValue) {
            const [hours, minutes] = newTime.split(':').map(Number);
            const newDate = new Date(dateValue);
            newDate.setHours(hours, minutes, 0, 0);
            onChange?.(newDate);
        } else {
            // If no date selected yet, create a new date with the time
            const today = new Date();
            const [hours, minutes] = newTime.split(':').map(Number);
            today.setHours(hours, minutes, 0, 0);
            onChange?.(today);
        }
    };

    // Format time for display
    const formatTimeDisplay = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const hour12 = hours % 12 || 12;
        return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                        'w-full justify-start text-left font-normal',
                        !dateValue && 'text-muted-foreground',
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateValue 
                        ? format(dateValue, 'MMMM d, yyyy \'at\' h:mm a')
                        : placeholder
                    }
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <div className="flex">
                    {/* Calendar */}
                    <Calendar
                        mode="single"
                        selected={dateValue}
                        onSelect={handleDateSelect}
                        month={month}
                        onMonthChange={setMonth}
                        captionLayout="dropdown"
                        fromDate={effectiveMinDate}
                        toDate={maxDate}
                        disabled={(date) => {
                            if (effectiveMinDate && date < effectiveMinDate) return true;
                            if (maxDate && date > maxDate) return true;
                            return false;
                        }}
                        initialFocus
                    />
                    {/* Time Picker */}
                    <div className="border-l p-3">
                        <TimePicker
                            value={timeValue}
                            onChange={handleTimeChange}
                            disabled={disabled}
                        />
                    </div>
                </div>
                {/* Time Display */}
                <div className="border-t p-3 flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Time:</span>
                    <span className="text-sm font-medium">{formatTimeDisplay(timeValue)}</span>
                </div>
            </PopoverContent>
        </Popover>
    );
}
