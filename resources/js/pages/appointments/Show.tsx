import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Calendar, Check, ClipboardList, MoreHorizontal, Pencil, User, X } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface TreatmentType {
    id: number;
    name: string;
    standard_cost: number;
}

interface FileRecord {
    id: number;
    file_path: string;
    original_name: string;
    url: string;
}

interface Tooth {
    id: number;
    name: string;
}

interface TreatmentRecord {
    id: number;
    treatment_type: TreatmentType | null;
    treatment_notes: string | null;
    files: FileRecord[];
    teeth: Tooth[];
    created_at: string;
}

interface Person {
    id: number;
    fname: string;
    mname: string | null;
    lname: string;
}

interface Appointment {
    id: number;
    patient: Person;
    dentist: Person;
    appointment_start_datetime: string;
    appointment_end_datetime: string | null;
    status: 'Scheduled' | 'Completed' | 'Cancelled';
    purpose_of_appointment: string | null;
    cancellation_reason: string | null;
    treatment_records: TreatmentRecord[];
    created_at: string;
}

interface ShowAppointmentProps {
    appointment: Appointment;
    treatmentTypes: TreatmentType[];
    allTeeth: Tooth[];
}



export default function ShowAppointment({ appointment }: ShowAppointmentProps) {
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    
    const cancelForm = useForm({
        cancellation_reason: '',
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Appointments', href: '/appointments' },
        { title: `Appointment #${appointment.id}`, href: `/appointments/${appointment.id}` },
    ];

    const getFullName = (person: Person) => {
        return [person.fname, person.mname, person.lname].filter(Boolean).join(' ');
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
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

    const handleCancel = () => {
        cancelForm.post(`/appointments/${appointment.id}/cancel`, {
            onSuccess: () => setShowCancelDialog(false),
        });
    };

    const handleComplete = () => {
        if (confirm('Are you sure you want to mark this appointment as completed?')) {
            router.post(`/appointments/${appointment.id}/complete`);
        }
    };



    const isScheduled = appointment.status === 'Scheduled';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Appointment #${appointment.id}`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold tracking-tight">
                            Appointment #{appointment.id}
                        </h1>
                        {getStatusBadge(appointment.status)}
                    </div>
                    <div className="flex gap-2">
                        {appointment.status === 'Scheduled' && (
                            <>
                                <Link href={`/appointments/${appointment.id}/edit`}>
                                    <Button variant="outline">
                                        <Pencil className="mr-2 size-4" />
                                        Edit
                                    </Button>
                                </Link>
                                <Button
                                    variant="default"
                                    onClick={handleComplete}
                                >
                                    <Check className="mr-2 size-4" />
                                    Mark Complete
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => setShowCancelDialog(true)}
                                >
                                    <X className="mr-2 size-4" />
                                    Cancel
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* Cancellation Reason (if cancelled) */}
                {appointment.status === 'Cancelled' && appointment.cancellation_reason && (
                    <Card className="border-destructive bg-destructive/5">
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-2">
                                <X className="size-5 text-destructive mt-0.5" />
                                <div>
                                    <p className="font-medium text-destructive">Appointment Cancelled</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {appointment.cancellation_reason}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Appointment Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="size-5" />
                                Appointment Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Date & Time</p>
                                <p className="font-medium">
                                    {formatDateTime(appointment.appointment_start_datetime)}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Purpose</p>
                                <p>{appointment.purpose_of_appointment || 'Not specified'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Created</p>
                                <p>{formatDateTime(appointment.created_at)}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Patient & Dentist Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="size-5" />
                                People
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Patient</p>
                                <Link
                                    href={`/patients/${appointment.patient.id}`}
                                    className="font-medium text-primary hover:underline"
                                >
                                    {getFullName(appointment.patient)}
                                </Link>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Dentist</p>
                                <p className="font-medium">{getFullName(appointment.dentist)}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Treatment Records */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ClipboardList className="size-5" />
                            Treatment Records
                        </CardTitle>
                        <CardDescription>
                            {isScheduled 
                                ? 'Click edit to add notes, teeth treated, and files for each treatment'
                                : 'Treatments performed for this appointment'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {appointment.treatment_records.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Treatment</TableHead>
                                        <TableHead>Notes</TableHead>
                                        <TableHead>Teeth</TableHead>
                                        <TableHead className="text-center">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {appointment.treatment_records.map((record) => (
                                        <TableRow key={record.id}>
                                            <TableCell className="font-medium">
                                                {record.treatment_type?.name || 'Unknown'}
                                            </TableCell>
                                            <TableCell className="max-w-[200px] truncate">
                                                {record.treatment_notes || '-'}
                                            </TableCell>
                                            <TableCell>
                                                {record.teeth.length > 0
                                                    ? record.teeth.map((t) => t.name).join(', ')
                                                    : '-'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-center">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <span className="sr-only">Open menu</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                            {isScheduled && (
                                                                <DropdownMenuItem asChild>
                                                                    <Link href={`/appointments/${appointment.id}/treatment-records/${record.id}?edit=true`}>
                                                                        <Pencil className="mr-2 h-4 w-4" />
                                                                        Edit Record
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/appointments/${appointment.id}/treatment-records/${record.id}`}>
                                                                    <ClipboardList className="mr-2 h-4 w-4" />
                                                                    View Details
                                                                </Link>
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <ClipboardList className="size-12 text-muted-foreground/50 mb-2" />
                                <p className="text-muted-foreground">No treatment records yet.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Cancel Dialog */}
                <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Cancel Appointment</DialogTitle>
                            <DialogDescription>
                                Please provide a reason for cancelling this appointment.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <Textarea
                                placeholder="Reason for cancellation..."
                                value={cancelForm.data.cancellation_reason}
                                onChange={(e) => cancelForm.setData('cancellation_reason', e.target.value)}
                                rows={4}
                            />
                            {cancelForm.errors.cancellation_reason && (
                                <p className="text-sm text-destructive mt-2">
                                    {cancelForm.errors.cancellation_reason}
                                </p>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                                Keep Appointment
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleCancel}
                                disabled={cancelForm.processing}
                            >
                                Confirm Cancellation
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
