'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TimePickerProps {
    value?: string; // HH:mm format
    onChange?: (time: string) => void;
    disabled?: boolean;
    className?: string;
}

export function TimePicker({ value, onChange, disabled = false, className }: TimePickerProps) {
    // Parse current value or use defaults
    const parseTime = (timeStr: string | undefined): { hour: number; minute: number; period: 'AM' | 'PM' } => {
        if (!timeStr) {
            return { hour: 9, minute: 0, period: 'AM' };
        }
        const [hourStr, minuteStr] = timeStr.split(':');
        let hour = parseInt(hourStr, 10);
        const minute = parseInt(minuteStr, 10);
        const period: 'AM' | 'PM' = hour >= 12 ? 'PM' : 'AM';
        if (hour > 12) hour -= 12;
        if (hour === 0) hour = 12;
        return { hour, minute, period };
    };

    const { hour, minute, period } = parseTime(value);

    const handleHourChange = (newHour: number) => {
        const hour24 = period === 'PM' ? (newHour === 12 ? 12 : newHour + 12) : (newHour === 12 ? 0 : newHour);
        const newTime = `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        onChange?.(newTime);
    };

    const handleMinuteChange = (newMinute: number) => {
        const hour24 = period === 'PM' ? (hour === 12 ? 12 : hour + 12) : (hour === 12 ? 0 : hour);
        const newTime = `${hour24.toString().padStart(2, '0')}:${newMinute.toString().padStart(2, '0')}`;
        onChange?.(newTime);
    };

    const handlePeriodChange = (newPeriod: 'AM' | 'PM') => {
        let hour24: number;
        if (newPeriod === 'PM') {
            hour24 = hour === 12 ? 12 : hour + 12;
        } else {
            hour24 = hour === 12 ? 0 : hour;
        }
        const newTime = `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        onChange?.(newTime);
    };

    const hours = Array.from({ length: 12 }, (_, i) => i + 1);
    const minutes = Array.from({ length: 12 }, (_, i) => i * 5); // 0, 5, 10, ... 55

    return (
        <div className={cn('flex gap-1', className)}>
            {/* Hours */}
            <ScrollArea className="h-[200px] w-[60px] rounded-md border">
                <div className="p-2">
                    {hours.map((h) => (
                        <button
                            key={h}
                            type="button"
                            disabled={disabled}
                            onClick={() => handleHourChange(h)}
                            className={cn(
                                'w-full rounded-md py-2 text-center text-sm transition-colors hover:bg-accent',
                                hour === h && 'bg-primary text-primary-foreground hover:bg-primary'
                            )}
                        >
                            {h.toString().padStart(2, '0')}
                        </button>
                    ))}
                </div>
            </ScrollArea>

            {/* Minutes */}
            <ScrollArea className="h-[200px] w-[60px] rounded-md border">
                <div className="p-2">
                    {minutes.map((m) => (
                        <button
                            key={m}
                            type="button"
                            disabled={disabled}
                            onClick={() => handleMinuteChange(m)}
                            className={cn(
                                'w-full rounded-md py-2 text-center text-sm transition-colors hover:bg-accent',
                                minute === m && 'bg-primary text-primary-foreground hover:bg-primary'
                            )}
                        >
                            {m.toString().padStart(2, '0')}
                        </button>
                    ))}
                </div>
            </ScrollArea>

            {/* AM/PM */}
            <div className="flex flex-col gap-1 h-[200px] w-[50px] rounded-md border p-2">
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => handlePeriodChange('AM')}
                    className={cn(
                        'flex-1 rounded-md text-center text-sm transition-colors hover:bg-accent',
                        period === 'AM' && 'bg-primary text-primary-foreground hover:bg-primary'
                    )}
                >
                    AM
                </button>
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => handlePeriodChange('PM')}
                    className={cn(
                        'flex-1 rounded-md text-center text-sm transition-colors hover:bg-accent',
                        period === 'PM' && 'bg-primary text-primary-foreground hover:bg-primary'
                    )}
                >
                    PM
                </button>
            </div>
        </div>
    );
}
