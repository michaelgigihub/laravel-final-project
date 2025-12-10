import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Calendar, Check, Clock, Eye, TrendingUp, Users, UserPlus, CalendarCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RegisterPatientDialog } from '@/components/RegisterPatientDialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface Stats {
    total_patients: number;
    total_appointments: number;
    scheduled_appointments: number;
    completed_appointments: number;
    cancelled_appointments: number;
    total_dentists: number;
    today_appointments: number;
}

interface UpcomingAppointment {
    id: number;
    patient_name: string;
    dentist_name: string;
    datetime: string;
    date: string;
    time: string;
    treatments: string;
    status: string;
}

interface TodayAppointment {
    id: number;
    patient_name: string;
    dentist_name: string;
    time: string;
    status: string;
}

interface RecentPatient {
    id: number;
    name: string;
    created_at: string;
}

interface DashboardProps {
    stats: Stats;
    upcomingAppointments: UpcomingAppointment[];
    todayAppointments: TodayAppointment[];
    recentPatients: RecentPatient[];
    userRole: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
];

export default function Dashboard({
    stats,
    upcomingAppointments,
    todayAppointments,
    recentPatients,
    userRole,
}: DashboardProps) {
    const isAdmin = userRole === 1;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                        <p className="text-sm text-muted-foreground">
                            {isAdmin ? 'Admin overview of clinic operations' : 'Overview of your activities'}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/appointments/create">
                            <Button>
                                <CalendarCheck className="mr-2 size-4" />
                                New Appointment
                            </Button>
                        </Link>
                        {isAdmin && (
                            <RegisterPatientDialog
                                trigger={
                                    <Button variant="outline">
                                        <UserPlus className="mr-2 size-4" />
                                        New Patient
                                    </Button>
                                }
                            />
                        )}
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                            <Users className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_patients}</div>
                            <p className="text-xs text-muted-foreground">
                                Registered patients
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
                            <Clock className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.today_appointments}</div>
                            <p className="text-xs text-muted-foreground">
                                Scheduled for today
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
                            <Calendar className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.scheduled_appointments}</div>
                            <p className="text-xs text-muted-foreground">
                                Upcoming appointments
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Completed</CardTitle>
                            <Check className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.completed_appointments}</div>
                            <p className="text-xs text-muted-foreground">
                                Total completed
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {isAdmin && (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Dentists</CardTitle>
                                <Users className="size-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.total_dentists}</div>
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
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
                                <Calendar className="size-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-500">{stats.cancelled_appointments}</div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Today's Appointments */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="size-5" />
                                Today's Appointments
                            </CardTitle>
                            <CardDescription>
                                Appointments scheduled for today
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {todayAppointments.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Time</TableHead>
                                            <TableHead>Patient</TableHead>
                                            <TableHead>Dentist</TableHead>
                                            <TableHead className="text-center">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {todayAppointments.map((apt) => (
                                            <TableRow key={apt.id}>
                                                <TableCell className="font-medium">{apt.time}</TableCell>
                                                <TableCell>{apt.patient_name}</TableCell>
                                                <TableCell>{apt.dentist_name}</TableCell>
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
                                    <p className="text-muted-foreground">No appointments scheduled for today.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Patients */}
                    {isAdmin && (
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <Users className="size-5" />
                                            Recent Patients
                                        </CardTitle>
                                        <CardDescription>
                                            Newly registered patients
                                        </CardDescription>
                                    </div>
                                    <Link href="/patients">
                                        <Button variant="outline" size="sm">View All</Button>
                                    </Link>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {recentPatients.length > 0 ? (
                                    <div className="space-y-4">
                                        {recentPatients.map((patient) => (
                                            <div
                                                key={patient.id}
                                                className="flex items-center justify-between p-3 border rounded-lg"
                                            >
                                                <div>
                                                    <p className="font-medium">{patient.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Registered: {patient.created_at}
                                                    </p>
                                                </div>
                                                <Link href={`/patients/${patient.id}`}>
                                                    <Button size="sm" variant="ghost">
                                                        <Eye className="size-4" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8 text-center">
                                        <Users className="size-12 text-muted-foreground/50 mb-2" />
                                        <p className="text-muted-foreground">No patients registered yet.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Upcoming Appointments */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="size-5" />
                                    Upcoming Appointments
                                </CardTitle>
                                <CardDescription>
                                    Next scheduled appointments
                                </CardDescription>
                            </div>
                            <Link href="/appointments">
                                <Button variant="outline" size="sm">View All</Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {upcomingAppointments.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date & Time</TableHead>
                                        <TableHead>Patient</TableHead>
                                        <TableHead>Dentist</TableHead>
                                        <TableHead>Treatments</TableHead>
                                        <TableHead className="text-center">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {upcomingAppointments.map((apt) => (
                                        <TableRow key={apt.id}>
                                            <TableCell className="font-medium">{apt.datetime}</TableCell>
                                            <TableCell>{apt.patient_name}</TableCell>
                                            <TableCell>{apt.dentist_name}</TableCell>
                                            <TableCell className="max-w-[200px] truncate">
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
                                <p className="text-muted-foreground">No upcoming appointments.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
