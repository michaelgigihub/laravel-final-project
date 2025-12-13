import { router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Clock, User, Stethoscope, X, Plus } from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface Appointment {
    id: number;
    patient_name: string;
    dentist_name: string;
    datetime: string;
    status: string;
    treatments: string;
}

interface AppointmentsCalendarProps {
    appointments: Appointment[];
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_OF_WEEK_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

// Event color classes based on status - Full rounded border style
const EVENT_COLORS = {
    Scheduled: {
        bg: 'bg-blue-500/10 dark:bg-blue-500/20',
        border: 'border border-blue-500',
        text: 'text-blue-600 dark:text-blue-400',
        dot: 'bg-blue-500',
    },
    Completed: {
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
        border: 'border border-emerald-500',
        text: 'text-emerald-600 dark:text-emerald-400',
        dot: 'bg-emerald-500',
    },
    Cancelled: {
        bg: 'bg-red-500/10 dark:bg-red-500/20',
        border: 'border border-red-500',
        text: 'text-red-600 dark:text-red-400',
        dot: 'bg-red-500',
    },
};

type ViewType = 'month' | 'week' | 'day';

export function AppointmentsCalendar({ appointments }: AppointmentsCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewType, setViewType] = useState<ViewType>('month');
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const today = useMemo(() => new Date(), []);

    // Get calendar data for current month
    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const startDay = firstDayOfMonth.getDay();
        const daysInMonth = lastDayOfMonth.getDate();
        
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        const days: { date: Date; isCurrentMonth: boolean; isToday: boolean }[] = [];
        
        for (let i = startDay - 1; i >= 0; i--) {
            days.push({
                date: new Date(year, month - 1, prevMonthLastDay - i),
                isCurrentMonth: false,
                isToday: false,
            });
        }
        
        const today = new Date();
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            days.push({
                date,
                isCurrentMonth: true,
                isToday:
                    date.getDate() === today.getDate() &&
                    date.getMonth() === today.getMonth() &&
                    date.getFullYear() === today.getFullYear(),
            });
        }
        
        // Fill remaining days to complete 5 rows (35 cells)
        const totalCells = 35;
        const remainingDays = totalCells - days.length;
        for (let i = 1; i <= remainingDays; i++) {
            days.push({
                date: new Date(year, month + 1, i),
                isCurrentMonth: false,
                isToday: false,
            });
        }
        
        return days;
    }, [currentDate]);

    // Get week days for week view
    const weekDays = useMemo(() => {
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        
        const days: { date: Date; isToday: boolean }[] = [];
        const today = new Date();
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            days.push({
                date,
                isToday:
                    date.getDate() === today.getDate() &&
                    date.getMonth() === today.getMonth() &&
                    date.getFullYear() === today.getFullYear(),
            });
        }
        
        return days;
    }, [currentDate]);

    // Group appointments by date
    const appointmentsByDate = useMemo(() => {
        const grouped: Record<string, Appointment[]> = {};
        appointments.forEach((apt) => {
            const dateKey = new Date(apt.datetime).toDateString();
            if (!grouped[dateKey]) {
                grouped[dateKey] = [];
            }
            grouped[dateKey].push(apt);
        });
        // Sort appointments by time within each day
        Object.values(grouped).forEach(dayApts => {
            dayApts.sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
        });
        return grouped;
    }, [appointments]);

    // Get appointments for current day (day view)
    const dayAppointments = useMemo(() => {
        const dateKey = currentDate.toDateString();
        return appointmentsByDate[dateKey] || [];
    }, [currentDate, appointmentsByDate]);

    const navigatePeriod = (direction: 'prev' | 'next') => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            if (viewType === 'month') {
                newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
            } else if (viewType === 'week') {
                newDate.setDate(prev.getDate() + (direction === 'next' ? 7 : -7));
            } else {
                newDate.setDate(prev.getDate() + (direction === 'next' ? 1 : -1));
            }
            return newDate;
        });
    };

    const goToToday = () => {
        setCurrentDate(new Date());
        setSelectedDate(null); // Reset selection so highlight returns to today
    };

    const formatTime = (datetime: string) => {
        return new Date(datetime).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    };

    const getEventColors = (status: string) => {
        return EVENT_COLORS[status as keyof typeof EVENT_COLORS] || EVENT_COLORS.Scheduled;
    };

    // Time slots for week/day view (business hours)
    const timeSlots = useMemo(() => {
        const slots = [];
        for (let hour = 8; hour <= 18; hour++) {
            slots.push(`${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`);
        }
        return slots;
    }, []);

    // Render event card - UntitledUI style with inline name and time
    const renderEventCard = (apt: Appointment, compact = false) => {
        const colors = getEventColors(apt.status);
        return (
            <button
                key={apt.id}
                onClick={(e) => {
                    e.stopPropagation();
                    setSelectedAppointment(apt);
                }}
                className={cn(
                    'w-full text-left rounded-md transition-all hover:shadow-md hover:scale-[1.02] cursor-pointer',
                    colors.bg,
                    colors.border,
                    compact ? 'px-2 py-1.5' : 'px-3 py-2'
                )}
            >
                <div className={cn('flex items-center justify-between gap-2', compact ? 'text-xs' : 'text-sm')}>
                    <span className={cn('font-medium truncate flex-1', colors.text)}>
                        {apt.patient_name}
                    </span>
                    <span className="text-muted-foreground text-[10px] shrink-0">
                        {formatTime(apt.datetime)}
                    </span>
                </div>
            </button>
        );
    };

    return (
        <div className="flex gap-6">
            {/* Calendar */}
            <div className="flex-1">
                {/* Header - UntitledUI style */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        {/* Date Badge - Shows selected date when a cell is clicked */}
                        <div className="flex items-center px-3 py-2 rounded-lg border bg-muted/50">
                            <div className="text-center pr-3 border-r border-border">
                                <div className="text-[10px] font-medium text-primary uppercase tracking-wider">
                                    {MONTHS[(selectedDate || currentDate).getMonth()].slice(0, 3)}
                                </div>
                                <div className="text-xl font-bold text-primary leading-none">
                                    {(selectedDate || currentDate).getDate()}
                                </div>
                            </div>
                            <div className="pl-3">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold">{MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
                                    {/* Week Badge - UntitledUI style */}
                                    <span className="px-2 py-0.5 text-xs rounded-full border bg-background">
                                        Week {Math.ceil(((selectedDate || currentDate).getDate() + new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()) / 7)}
                                    </span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {MONTHS[currentDate.getMonth()].slice(0, 3)} 1, {currentDate.getFullYear()} – {MONTHS[currentDate.getMonth()].slice(0, 3)} {new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()}, {currentDate.getFullYear()}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Navigation with Today in between - UntitledUI style */}
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => navigatePeriod('prev')}
                            className="h-9 w-9"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={goToToday}>
                            Today
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => navigatePeriod('next')}
                            className="h-9 w-9"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>

                        {/* View Selector - UntitledUI dropdown style */}
                        <Select value={viewType} onValueChange={(v) => setViewType(v as ViewType)}>
                            <SelectTrigger className="w-[130px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="month">Month view</SelectItem>
                                <SelectItem value="week">Week view</SelectItem>
                                <SelectItem value="day">Day view</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Month View */}
                {viewType === 'month' && (
                    <>
                        {/* Days of Week Header */}
                        <div className="grid grid-cols-7 border-b border-border">
                            {DAYS_OF_WEEK.map((day) => (
                                <div
                                    key={day}
                                    className="px-3 py-3 text-center text-sm font-medium text-muted-foreground"
                                >
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 border-l border-border">
                            {calendarDays.map((day, index) => {
                                const dateKey = day.date.toDateString();
                                const dayApts = appointmentsByDate[dateKey] || [];
                                const hasMore = dayApts.length > 3;
                                
                                // Check if this date can accept new appointments (not in the past)
                                const isPastDate = day.date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                                const isSelected = selectedDate?.toDateString() === day.date.toDateString();

                                return (
                                    <div
                                        key={index}
                                        onClick={() => {
                                            // Only allow selection if it's the current month
                                            if (day.isCurrentMonth) {
                                                setSelectedDate(day.date);
                                            }
                                        }}
                                        onDoubleClick={(e) => {
                                            e.stopPropagation();
                                            // Switch to day view on double click if it's the current month
                                            if (day.isCurrentMonth) {
                                                setCurrentDate(day.date);
                                                setViewType('day');
                                            }
                                        }}
                                        className={cn(
                                            'min-h-[140px] p-2 border-r border-b border-border transition-colors relative group',
                                            // Only show cursor pointer and hover effect for current month
                                            day.isCurrentMonth ? 'cursor-pointer hover:bg-muted/50' : 'bg-zinc-100/80 dark:bg-zinc-900/50 cursor-default',
                                            day.isToday && 'bg-primary/5',
                                        )}
                                    >
                                        {/* Date Number - TOP LEFT, single circle highlight */}
                                        <div className="mb-2">
                                            <span
                                                className={cn(
                                                    'text-sm font-medium inline-flex items-center justify-center h-7 w-7 rounded-full',
                                                    // Show primary circle on selectedDate (if current month), or on today if no selection
                                                    (isSelected || (!selectedDate && day.isToday)) && day.isCurrentMonth && 'bg-primary text-primary-foreground',
                                                    !day.isCurrentMonth && 'text-muted-foreground'
                                                )}
                                            >
                                                {day.date.getDate()}
                                            </span>
                                        </div>

                                        {/* Appointments */}
                                        <div className="space-y-1">
                                            {dayApts.slice(0, 3).map((apt) => renderEventCard(apt, true))}
                                            {hasMore && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setCurrentDate(day.date);
                                                        setViewType('day');
                                                    }}
                                                    className="text-xs text-muted-foreground hover:text-foreground w-full text-left"
                                                >
                                                    +{dayApts.length - 3} more
                                                </button>
                                            )}
                                        </div>

                                        {/* Add Appointment Button - Shows on hover for valid dates AND current month */}
                                        {!isPastDate && day.isCurrentMonth && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    // Format date in local timezone to avoid off-by-1 issue
                                                    const year = day.date.getFullYear();
                                                    const month = String(day.date.getMonth() + 1).padStart(2, '0');
                                                    const dayNum = String(day.date.getDate()).padStart(2, '0');
                                                    const dateStr = `${year}-${month}-${dayNum}`;
                                                    router.visit(`/appointments/create?date=${dateStr}`);
                                                }}
                                                className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 rounded-md border border-border bg-background hover:bg-muted flex items-center justify-center shadow-sm"
                                                title="Add appointment"
                                            >
                                                <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* Week View */}
                {viewType === 'week' && (
                    <div className="border rounded-lg overflow-hidden">
                        {/* Week Header */}
                        <div className="grid grid-cols-8 border-b">
                            <div className="p-3 border-r bg-muted/30" /> {/* Time column header */}
                            {weekDays.map((day, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        'p-3 text-center border-r last:border-r-0',
                                        day.isToday && 'bg-primary/5'
                                    )}
                                >
                                    <div className="text-sm font-medium text-muted-foreground">
                                        {DAYS_OF_WEEK[day.date.getDay()]}
                                    </div>
                                    <div className={cn(
                                        'text-lg font-semibold mt-1 h-8 w-8 mx-auto flex items-center justify-center rounded-full',
                                        day.isToday && 'bg-primary text-primary-foreground'
                                    )}>
                                        {day.date.getDate()}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Time Grid */}
                        <div className="max-h-[500px] overflow-y-auto">
                            {timeSlots.map((time, timeIndex) => (
                                <div key={timeIndex} className="grid grid-cols-8 border-b last:border-b-0">
                                    <div className="p-2 text-xs text-muted-foreground text-right pr-3 border-r bg-muted/30">
                                        {time}
                                    </div>
                                    {weekDays.map((day, dayIndex) => {
                                        const dateKey = day.date.toDateString();
                                        const dayApts = appointmentsByDate[dateKey] || [];
                                        const slotHour = timeIndex + 8;
                                        const slotApts = dayApts.filter(apt => {
                                            const aptHour = new Date(apt.datetime).getHours();
                                            return aptHour === slotHour;
                                        });
                                        
                                        // Check if this specific day is in the past (for disabling add button)
                                        const today = new Date();
                                        today.setHours(0, 0, 0, 0);
                                        const isPastDate = day.date < today;

                                        return (
                                            <div
                                                key={dayIndex}
                                                className={cn(
                                                    'min-h-[60px] p-1 border-r last:border-r-0 relative group',
                                                    day.isToday && 'bg-primary/5'
                                                )}
                                            >
                                                {slotApts.map((apt) => renderEventCard(apt, true))}
                                                
                                                {/* Add Appointment Button - Shows on hover */}
                                                {!isPastDate && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            // Format date and time for pre-filling
                                                            const year = day.date.getFullYear();
                                                            const month = String(day.date.getMonth() + 1).padStart(2, '0');
                                                            const dayNum = String(day.date.getDate()).padStart(2, '0');
                                                            const dateStr = `${year}-${month}-${dayNum}`;
                                                            
                                                            // Format time (HH:mm)
                                                            const timeStr = `${String(slotHour).padStart(2, '0')}:00`;
                                                            
                                                            router.visit(`/appointments/create?date=${dateStr}&time=${timeStr}`);
                                                        }}
                                                        className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5 rounded-md border border-border bg-background hover:bg-muted flex items-center justify-center shadow-sm z-10"
                                                        title="Add appointment"
                                                    >
                                                        <Plus className="h-3 w-3 text-muted-foreground" />
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Day View */}
                {viewType === 'day' && (
                    <div className="flex gap-6">
                        {/* Time Grid */}
                        <div className="flex-1 border rounded-lg overflow-hidden">
                            <div className="max-h-[500px] overflow-y-auto">
                                {timeSlots.map((time, timeIndex) => {
                                    const slotHour = timeIndex + 8;
                                    const slotApts = dayAppointments.filter(apt => {
                                        const aptHour = new Date(apt.datetime).getHours();
                                        return aptHour === slotHour;
                                    });
                                    
                                    // Check if current date is today or future
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    const isPastDate = currentDate < today;

                                    return (
                                        <div key={timeIndex} className="flex border-b last:border-b-0">
                                            <div className="w-20 p-3 text-xs text-muted-foreground text-right border-r bg-muted/30 shrink-0">
                                                {time}
                                            </div>
                                            <div className="flex-1 p-2 relative group hover:bg-muted/5">
                                                {slotApts.map((apt) => renderEventCard(apt))}
                                                
                                                {/* Add Appointment Button - Shows on hover */}
                                                {!isPastDate && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            // Format date and time for pre-filling
                                                            const year = currentDate.getFullYear();
                                                            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
                                                            const dayNum = String(currentDate.getDate()).padStart(2, '0');
                                                            const dateStr = `${year}-${month}-${dayNum}`;
                                                            
                                                            // Format time (HH:mm)
                                                            const timeStr = `${String(slotHour).padStart(2, '0')}:00`;
                                                            
                                                            router.visit(`/appointments/create?date=${dateStr}&time=${timeStr}`);
                                                        }}
                                                        className="absolute top-1/2 -translate-y-1/2 right-4 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 rounded-md border border-border bg-background hover:bg-muted flex items-center justify-center shadow-sm z-10"
                                                        title="Add appointment"
                                                    >
                                                        <Plus className="h-4 w-4 text-muted-foreground" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Mini Calendar Sidebar - UntitledUI style */}
                        <div className="w-64 shrink-0">
                            <div className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-medium text-sm">
                                        {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                                    </h3>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                                            const newDate = new Date(currentDate);
                                            newDate.setMonth(newDate.getMonth() - 1);
                                            setCurrentDate(newDate);
                                        }}>
                                            <ChevronLeft className="h-3 w-3" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                                            const newDate = new Date(currentDate);
                                            newDate.setMonth(newDate.getMonth() + 1);
                                            setCurrentDate(newDate);
                                        }}>
                                            <ChevronRight className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-7 gap-1 text-center text-xs">
                                    {DAYS_OF_WEEK.map(d => (
                                        <div key={d} className="text-muted-foreground py-1">{d.slice(0, 2)}</div>
                                    ))}
                                    {calendarDays.slice(0, 35).map((day, i) => {
                                        const dateKey = day.date.toDateString();
                                        const hasApts = appointmentsByDate[dateKey]?.length > 0;
                                        const isSelected = day.date.toDateString() === currentDate.toDateString();
                                        return (
                                            <button
                                                key={i}
                                                onClick={() => setCurrentDate(day.date)}
                                                className={cn(
                                                    'py-1 rounded text-sm relative',
                                                    !day.isCurrentMonth && 'text-muted-foreground/50',
                                                    day.isToday && !isSelected && 'text-primary font-semibold',
                                                    isSelected && 'bg-primary text-primary-foreground',
                                                    'hover:bg-muted'
                                                )}
                                            >
                                                {day.date.getDate()}
                                                {hasApts && !isSelected && (
                                                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Status Legend */}
                <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        <span>Scheduled</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span>Completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        <span>Cancelled</span>
                    </div>
                </div>
            </div>

            {/* Side Panel - Appointment Details */}
            {selectedAppointment && (
                <div className="w-80 shrink-0 rounded-xl border bg-card p-5 animate-in slide-in-from-right-5 self-start sticky top-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">Appointment Details</h3>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setSelectedAppointment(null)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {/* Status Badge */}
                        <Badge className={cn(
                            getEventColors(selectedAppointment.status).bg,
                            getEventColors(selectedAppointment.status).text,
                            'border-0'
                        )}>
                            {selectedAppointment.status}
                        </Badge>

                        {/* Time */}
                        <div className="flex items-start gap-3">
                            <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium">
                                    {new Date(selectedAppointment.datetime).toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric',
                                    })}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {formatTime(selectedAppointment.datetime)}
                                </p>
                            </div>
                        </div>

                        {/* Patient */}
                        <div className="flex items-start gap-3">
                            <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <div>
                                <p className="text-xs text-muted-foreground">Patient</p>
                                <p className="text-sm font-medium">{selectedAppointment.patient_name}</p>
                            </div>
                        </div>

                        {/* Dentist */}
                        <div className="flex items-start gap-3">
                            <Stethoscope className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <div>
                                <p className="text-xs text-muted-foreground">Dentist</p>
                                <p className="text-sm font-medium">{selectedAppointment.dentist_name}</p>
                            </div>
                        </div>

                        {/* Treatments */}
                        {selectedAppointment.treatments && (
                            <div>
                                <p className="text-xs text-muted-foreground mb-2">Treatments</p>
                                <div className="flex flex-wrap gap-1">
                                    {selectedAppointment.treatments.split(', ').map((treatment, i) => (
                                        <Badge key={i} variant="outline" className="text-xs">
                                            {treatment}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Action Button */}
                        <Button
                            className="w-full mt-4"
                            onClick={() => router.visit(`/appointments/${selectedAppointment.id}`)}
                        >
                            View Full Details
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
