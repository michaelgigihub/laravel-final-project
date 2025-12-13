'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

interface DatePickerProps {
    value?: Date | string;
    onChange?: (date: Date | undefined) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    /** Minimum selectable date */
    minDate?: Date;
    /** Maximum selectable date */
    maxDate?: Date;
    /** If true, user cannot select future dates (sets maxDate to today) */
    disableFuture?: boolean;
    /** If true, user cannot select past dates (sets minDate to today) */
    disablePast?: boolean;
}

export function DatePicker({
    value,
    onChange,
    placeholder = 'Select date',
    disabled = false,
    className,
    minDate,
    maxDate,
    disableFuture = false,
    disablePast = false,
}: DatePickerProps) {
    const [open, setOpen] = React.useState(false);
    const [month, setMonth] = React.useState<Date>(
        value ? (typeof value === 'string' ? new Date(value) : value) : new Date()
    );

    // Convert string value to Date if needed
    const dateValue = React.useMemo(() => {
        if (!value) return undefined;
        if (typeof value === 'string') {
            const parsed = new Date(value);
            return isNaN(parsed.getTime()) ? undefined : parsed;
        }
        return value;
    }, [value]);

    // Calculate effective min/max dates
    const effectiveMinDate = React.useMemo(() => {
        if (disablePast) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return minDate && minDate > today ? minDate : today;
        }
        return minDate;
    }, [minDate, disablePast]);

    const effectiveMaxDate = React.useMemo(() => {
        if (disableFuture) {
            const today = new Date();
            today.setHours(23, 59, 59, 999);
            return maxDate && maxDate < today ? maxDate : today;
        }
        return maxDate;
    }, [maxDate, disableFuture]);

    const handleSelect = (date: Date | undefined) => {
        onChange?.(date);
        setOpen(false);
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
                    {dateValue ? format(dateValue, 'MMMM d, yyyy') : placeholder}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={dateValue}
                    onSelect={handleSelect}
                    month={month}
                    onMonthChange={setMonth}
                    captionLayout="dropdown"
                    fromDate={effectiveMinDate}
                    toDate={effectiveMaxDate}
                    disabled={(date) => {
                        if (effectiveMinDate && date < effectiveMinDate) return true;
                        if (effectiveMaxDate && date > effectiveMaxDate) return true;
                        return false;
                    }}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    );
}
