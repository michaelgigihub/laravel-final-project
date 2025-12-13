import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Calendar, Check, Clock, Eye, TrendingUp, Users } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface TodayAppointment {
    id: number;
    patient_name: string;
    time: string;
    status: string;
    treatments: string;
}

interface UpcomingAppointment {
    id: number;
    patient_name: string;
    datetime: string;
    treatments: string;
}

interface Stats {
    total_appointments: number;
    completed_appointments: number;
    scheduled_appointments: number;
    today_appointments: number;
}

interface RecentTreatment {
    id: number;
    appointment_id: number;
    patient_name: string;
    treatment_type: string;
    date: string;
}

interface ClinicAvailabilityDay {
    day_name: string;
    is_closed: boolean;
    open_time: string | null;
    close_time: string | null;
}

interface DentistDashboardProps {
    todayAppointments: TodayAppointment[];
    upcomingAppointments: UpcomingAppointment[];
    stats: Stats;
    recentTreatments: RecentTreatment[];
    clinicAvailability: ClinicAvailabilityDay[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dentist/dashboard' },
];

export default function DentistDashboard({
    todayAppointments,
    upcomingAppointments,
    stats,
    recentTreatments,
    clinicAvailability,
}: DentistDashboardProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dentist Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">My Dashboard</h1>
                    <p className="text-sm text-muted-foreground">
                        Overview of your appointments and treatments
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
                            <Clock className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.today_appointments}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
                            <Calendar className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.scheduled_appointments}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Completed</CardTitle>
                            <Check className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.completed_appointments}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
                            <TrendingUp className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_appointments}</div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Today's Appointments */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="size-5" />
                                Today's Appointments
                            </CardTitle>
                            <CardDescription>
                                Your appointments for today
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {todayAppointments.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Time</TableHead>
                                            <TableHead>Patient</TableHead>
                                            <TableHead>Treatments</TableHead>
                                            <TableHead className="text-center">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {todayAppointments.map((apt) => (
                                            <TableRow key={apt.id}>
                                                <TableCell className="font-medium">{apt.time}</TableCell>
                                                <TableCell>{apt.patient_name}</TableCell>
                                                <TableCell className="max-w-[150px] truncate">
                                                    {apt.treatments || '-'}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Link href={`/appointments/${apt.id}`}>
                                                        <Button size="sm" variant="ghost">
                                                            <Eye className="size-4" />
                                                        </Button>
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <Calendar className="size-12 text-muted-foreground/50 mb-2" />
                                    <p className="text-muted-foreground">No appointments today.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Clinic Availability */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="size-5" />
                                Clinic Hours
                            </CardTitle>
                            <CardDescription>
                                Weekly clinic schedule
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {clinicAvailability.map((day) => (
                                    <div
                                        key={day.day_name}
                                        className="flex items-center justify-between py-2 border-b last:border-0"
                                    >
                                        <span className="font-medium">{day.day_name}</span>
                                        {day.is_closed ? (
                                            <Badge variant="secondary">Closed</Badge>
                                        ) : (
                                            <span className="text-sm text-muted-foreground">
                                                {day.open_time} - {day.close_time}
                                            </span>
                                        )}
                                    </div>
                                ))}
                                {clinicAvailability.length === 0 && (
                                    <p className="text-muted-foreground text-center py-4">
                                        No clinic hours configured.
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Upcoming Appointments */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="size-5" />
                                Upcoming Appointments
                            </CardTitle>
                            <CardDescription>
                                Your next scheduled appointments
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {upcomingAppointments.length > 0 ? (
                                <div className="space-y-4">
                                    {upcomingAppointments.map((apt) => (
                                        <div
                                            key={apt.id}
                                            className="flex items-center justify-between p-3 border rounded-lg"
                                        >
                                            <div>
                                                <p className="font-medium">{apt.patient_name}</p>
                                                <p className="text-sm text-muted-foreground">{apt.datetime}</p>
                                                <p className="text-xs text-muted-foreground">{apt.treatments}</p>
                                            </div>
                                            <Link href={`/appointments/${apt.id}`}>
                                                <Button size="sm" variant="outline">
                                                    <Eye className="mr-2 size-4" />
                                                    View
                                                </Button>
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <Calendar className="size-12 text-muted-foreground/50 mb-2" />
                                    <p className="text-muted-foreground">No upcoming appointments.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Treatments */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="size-5" />
                                Recent Treatments
                            </CardTitle>
                            <CardDescription>
                                Your recently completed treatments
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {recentTreatments.length > 0 ? (
                                <div className="space-y-4">
                                    {recentTreatments.map((treatment) => (
                                        <div
                                            key={treatment.id}
                                            className="flex items-center justify-between p-3 border rounded-lg"
                                        >
                                            <div>
                                                <p className="font-medium">{treatment.treatment_type}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {treatment.patient_name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">{treatment.date}</p>
                                            </div>
                                            <Link href={`/appointments/${treatment.appointment_id}`}>
                                                <Button size="sm" variant="outline">
                                                    <Eye className="mr-2 size-4" />
                                                    View
                                                </Button>
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <Users className="size-12 text-muted-foreground/50 mb-2" />
                                    <p className="text-muted-foreground">No completed treatments yet.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
