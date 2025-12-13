import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Calendar, Eye, Filter, LayoutGrid, List, Plus, Search } from 'lucide-react';
import { useState } from 'react';

import { AppointmentsCalendar } from '@/components/AppointmentsCalendar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';


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
    };

    const applyFilters = () => {
        router.get('/appointments', localFilters, { preserveState: true, preserveScroll: true });
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Appointments" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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

                {/* Filters (only show in table view) */}
                {viewMode === 'table' && (
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Filter className="size-4" />
                                Filters
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <div>
                                    <label className="text-sm font-medium">Search</label>
                                    <div className="relative mt-1">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Patient or Dentist..."
                                            value={localFilters.search}
                                            onChange={(e) => handleFilterChange('search', e.target.value)}
                                            className="pl-8"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Status</label>
                                    <Select
                                        value={localFilters.status || 'all'}
                                        onValueChange={(v) => handleFilterChange('status', v)}
                                    >
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="All Statuses" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Statuses</SelectItem>
                                            <SelectItem value="Scheduled">Scheduled</SelectItem>
                                            <SelectItem value="Completed">Completed</SelectItem>
                                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Start Date</label>
                                    <Input
                                        type="date"
                                        value={localFilters.start_date}
                                        onChange={(e) => handleFilterChange('start_date', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">End Date</label>
                                    <Input
                                        type="date"
                                        value={localFilters.end_date}
                                        onChange={(e) => handleFilterChange('end_date', e.target.value)}
                                        className="mt-1"
                                    />
                                </div>
                            </div>
                            <div className="mt-4 flex gap-2">
                                <Button onClick={applyFilters}>Apply Filters</Button>
                                {hasActiveFilters && (
                                    <Button variant="outline" onClick={clearFilters}>
                                        Clear
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Content */}
                {viewMode === 'table' ? (
                    <div className="relative flex-1 overflow-hidden rounded-xl border bg-card shadow">
                        <div className="h-full overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date & Time</TableHead>
                                        <TableHead>Patient</TableHead>
                                        <TableHead>Dentist</TableHead>
                                        <TableHead>Treatments</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-center">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {appointments.length > 0 ? (
                                        appointments.map((appointment) => (
                                            <TableRow key={appointment.id}>
                                                <TableCell className="font-medium">
                                                    {formatDateTime(appointment.appointment_start_datetime)}
                                                </TableCell>
                                                <TableCell>{appointment.patient_name}</TableCell>
                                                <TableCell>{appointment.dentist_name}</TableCell>
                                                <TableCell>
                                                    <div className="max-w-[200px] truncate" title={appointment.treatment_types}>
                                                        {appointment.treatment_types || '-'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                                                <TableCell>
                                                    <div className="flex justify-center">
                                                        <Link
                                                            href={`/appointments/${appointment.id}`}
                                                            className="inline-flex items-center justify-center rounded-md p-2 text-blue-600 hover:bg-blue-50 hover:text-blue-800 transition-colors"
                                                            title="View appointment details"
                                                        >
                                                            <Eye className="size-4" />
                                                        </Link>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">
                                                <div className="flex flex-col items-center justify-center">
                                                    <Calendar className="size-12 text-muted-foreground/50 mb-2" />
                                                    <p className="text-muted-foreground">No appointments found.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                ) : (
                    <Card>
                        <CardContent className="pt-6">
                            <AppointmentsCalendar appointments={calendarAppointments} />
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
