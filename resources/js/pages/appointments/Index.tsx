import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Eye, LayoutGrid, List, Plus, X } from 'lucide-react';
import { useState } from 'react';

import { AppointmentsCalendar } from '@/components/AppointmentsCalendar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { DatePicker } from '@/components/ui/date-picker';
import { format } from 'date-fns';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';


interface Appointment {
    id: number;
    patient_id: number;
    patient_name: string;
    dentist_id: number;
    dentist_name: string;
    appointment_start_datetime: string;
    appointment_end_datetime: string | null;
    status: 'Scheduled' | 'Completed' | 'Cancelled';
    purpose_of_appointment: string | null;
    treatment_types: string;
}

interface Person {
    id: number;
    fname: string;
    mname: string | null;
    lname: string;
}

interface AppointmentsIndexProps {
    appointments: Appointment[];
    dentists: Person[];
    patients: Person[];
    filters: {
        start_date: string;
        end_date: string;
        dentist_id: string;
        patient_id: string;
        status: string;
        search: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Appointments', href: '/appointments' },
];

export default function AppointmentsIndex({ appointments, filters }: AppointmentsIndexProps) {
    const [localFilters, setLocalFilters] = useState(filters);
    const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');

    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...localFilters, [key]: value === 'all' ? '' : value };
        setLocalFilters(newFilters);
        router.get('/appointments', newFilters, { preserveState: true, preserveScroll: true });
    };

    const clearFilters = () => {
        const emptyFilters = {
            start_date: '',
            end_date: '',
            dentist_id: '',
            patient_id: '',
            status: '',
            search: '',
        };
        setLocalFilters(emptyFilters);
        router.get('/appointments', {}, { preserveState: true, preserveScroll: true });
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Completed':
                return <Badge className="bg-green-100 text-green-700 border-green-200">Completed</Badge>;
            case 'Scheduled':
                return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Scheduled</Badge>;
            case 'Cancelled':
                return <Badge variant="destructive">Cancelled</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const hasActiveFilters = Object.values(filters).some((v) => v !== '');

    // Transform appointments for calendar
    const calendarAppointments = appointments.map((apt) => ({
        id: apt.id,
        patient_name: apt.patient_name,
        dentist_name: apt.dentist_name,
        datetime: apt.appointment_start_datetime,
        status: apt.status,
        treatments: apt.treatment_types,
    }));

    // DataTable columns
    const columns = [
        {
            accessorKey: 'appointment_start_datetime',
            header: 'Date & Time',
            cell: ({ row }: { row: { original: Appointment } }) => (
                <span className="font-medium">{formatDateTime(row.original.appointment_start_datetime)}</span>
            ),
        },
        {
            accessorKey: 'patient_name',
            header: 'Patient',
        },
        {
            accessorKey: 'dentist_name',
            header: 'Dentist',
        },
        {
            accessorKey: 'treatment_types',
            header: 'Treatments',
            cell: ({ row }: { row: { original: Appointment } }) => (
                <div className="max-w-[200px] truncate" title={row.original.treatment_types}>
                    {row.original.treatment_types || '-'}
                </div>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }: { row: { original: Appointment } }) => getStatusBadge(row.original.status),
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }: { row: { original: Appointment } }) => (
                <div className="flex justify-center">
                    <Link
                        href={`/appointments/${row.original.id}`}
                        className="inline-flex items-center justify-center rounded-md p-2 text-blue-600 hover:bg-blue-50 hover:text-blue-800 dark:text-blue-400 dark:hover:bg-blue-950 dark:hover:text-blue-300 transition-colors"
                        title="View appointment details"
                    >
                        <Eye className="size-4" />
                    </Link>
                </div>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Appointments" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Appointments</h1>
                        <p className="text-sm text-muted-foreground">
                            Manage and view all scheduled appointments
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {/* View Toggle */}
                        <div className="flex rounded-lg border bg-muted p-1">
                            <Button
                                variant={viewMode === 'table' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('table')}
                            >
                                <List className="size-4 mr-1" />
                                Table
                            </Button>
                            <Button
                                variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('calendar')}
                            >
                                <LayoutGrid className="size-4 mr-1" />
                                Calendar
                            </Button>
                        </div>
                        <Link href="/appointments/create">
                            <Button>
                                <Plus className="mr-2 size-4" />
                                New Appointment
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Content */}
                {viewMode === 'table' ? (
                    <div className="relative flex-1 overflow-hidden rounded-xl border border-brand-dark/20 bg-card shadow-[0_22px_48px_-30px_rgba(38,41,47,0.6)] transition-shadow dark:border-brand-light/20 dark:bg-card/60 dark:shadow-[0_18px_42px_-28px_rgba(8,9,12,0.78)]">
                        <div className="h-full overflow-auto p-4">
                            <DataTable 
                                columns={columns} 
                                data={appointments} 
                                customToolbar={
                                    <>
                                        <Select
                                            value={localFilters.status || 'all'}
                                            onValueChange={(v) => handleFilterChange('status', v)}
                                        >
                                            <SelectTrigger className="w-[120px]">
                                                <SelectValue placeholder="All Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Status</SelectItem>
                                                <SelectItem value="Scheduled">Scheduled</SelectItem>
                                                <SelectItem value="Completed">Completed</SelectItem>
                                                <SelectItem value="Cancelled">Cancelled</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <div className="flex gap-2 items-center">
                                            <DatePicker
                                                value={localFilters.start_date}
                                                onChange={(date) => handleFilterChange('start_date', date ? format(date, 'yyyy-MM-dd') : '')}
                                                placeholder="Start date"
                                                className="w-[180px]"
                                                maxDate={localFilters.end_date ? new Date(localFilters.end_date) : undefined}
                                            />
                                            <span className="text-muted-foreground text-sm">to</span>
                                            <DatePicker
                                                value={localFilters.end_date}
                                                onChange={(date) => handleFilterChange('end_date', date ? format(date, 'yyyy-MM-dd') : '')}
                                                placeholder="End date"
                                                className="w-[180px]"
                                                minDate={localFilters.start_date ? new Date(localFilters.start_date) : undefined}
                                            />
                                        </div>
                                        {hasActiveFilters && (
                                            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                                                <X className="size-4 mr-1" />
                                                Clear
                                            </Button>
                                        )}
                                    </>
                                }
                            />
                        </div>
                    </div>
                ) : (
                    <div className="relative flex-1 overflow-hidden rounded-xl border border-brand-dark/20 bg-card shadow-[0_22px_48px_-30px_rgba(38,41,47,0.6)] transition-shadow dark:border-brand-light/20 dark:bg-card/60 dark:shadow-[0_18px_42px_-28px_rgba(8,9,12,0.78)]">
                        <div className="h-full overflow-auto p-6">
                            <AppointmentsCalendar appointments={calendarAppointments} />
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
