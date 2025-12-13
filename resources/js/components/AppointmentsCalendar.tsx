import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { router } from '@inertiajs/react';
import { useMemo } from 'react';

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

export function AppointmentsCalendar({ appointments }: AppointmentsCalendarProps) {
    const events = useMemo(() => {
        return appointments.map((apt) => ({
            id: apt.id.toString(),
            title: apt.patient_name,
            start: apt.datetime,
            extendedProps: {
                ...apt,
            },
            backgroundColor:
                apt.status === 'Completed'
                    ? '#22c55e'
                    : apt.status === 'Cancelled'
                      ? '#ef4444'
                      : '#3b82f6',
            borderColor:
                apt.status === 'Completed'
                    ? '#16a34a'
                    : apt.status === 'Cancelled'
                      ? '#dc2626'
                      : '#2563eb',
        }));
    }, [appointments]);

    const handleEventClick = (clickInfo: { event: { id: string } }) => {
        router.visit(`/appointments/${clickInfo.event.id}`);
    };

    const handleDateClick = (info: { dateStr: string }) => {
        router.visit(`/appointments/create?date=${info.dateStr}`);
    };

    return (
        <div className="appointments-calendar">
            <style>{`
                .appointments-calendar .fc {
                    font-family: inherit;
                }
                .appointments-calendar .fc-toolbar-title {
                    font-size: 1.25rem;
                    font-weight: 600;
                }
                .appointments-calendar .fc-button {
                    background-color: hsl(var(--primary));
                    border-color: hsl(var(--primary));
                    padding: 0.5rem 1rem;
                    font-size: 0.875rem;
                }
                .appointments-calendar .fc-button:hover {
                    background-color: hsl(var(--primary) / 0.9);
                }
                .appointments-calendar .fc-button-active {
                    background-color: hsl(var(--primary) / 0.8) !important;
                }
                .appointments-calendar .fc-daygrid-day:hover {
                    background-color: hsl(var(--muted));
                    cursor: pointer;
                }
                .appointments-calendar .fc-event {
                    cursor: pointer;
                    padding: 2px 4px;
                    font-size: 0.75rem;
                }
                .appointments-calendar .fc-day-today {
                    background-color: hsl(var(--primary) / 0.1) !important;
                }
                .appointments-calendar .fc-col-header-cell {
                    background-color: hsl(var(--muted));
                    font-weight: 600;
                }
                .dark .appointments-calendar .fc-theme-standard td,
                .dark .appointments-calendar .fc-theme-standard th {
                    border-color: hsl(var(--border));
                }
                .dark .appointments-calendar .fc-daygrid-day-number {
                    color: hsl(var(--foreground));
                }
            `}</style>
            <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay',
                }}
                events={events}
                eventClick={handleEventClick}
                dateClick={handleDateClick}
                height="auto"
                aspectRatio={1.8}
                eventTimeFormat={{
                    hour: 'numeric',
                    minute: '2-digit',
                    meridiem: 'short',
                }}
            />
        </div>
    );
}
