import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { Calendar, Mail, MapPin, Pencil, Phone, User, FileText, Save, XCircle } from 'lucide-react';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
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
}

interface TreatmentRecord {
    id: number;
    treatment_notes: string | null;
    treatment_type: TreatmentType | null;
    created_at: string;
}

interface Dentist {
    id: number;
    fname: string;
    mname: string | null;
    lname: string;
}

interface Appointment {
    id: number;
    appointment_start_datetime: string;
    appointment_end_datetime: string | null;
    status: 'Scheduled' | 'Completed' | 'Cancelled';
    purpose_of_appointment: string | null;
    cancellation_reason: string | null;
    dentist: Dentist | null;
    treatment_records: TreatmentRecord[];
}

interface Patient {
    id: number;
    fname: string;
    mname: string | null;
    lname: string;
    date_of_birth: string;
    gender: string;
    contact_number: string | null;
    email: string | null;
    address: string | null;
    appointments: Appointment[];
}

interface ShowPatientProps {
    patient: Patient;
}

export default function ShowPatient({ patient }: ShowPatientProps) {
    const [isEditing, setIsEditing] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = useMemo(() => [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Patients', href: '/patients' },
        { title: `${patient.fname} ${patient.lname}`, href: `/patients/${patient.id}` },
    ], [patient]);

    const { data, setData, put, processing, errors, reset } = useForm({
        fname: patient.fname,
        mname: patient.mname || '',
        lname: patient.lname,
        date_of_birth: patient.date_of_birth,
        gender: patient.gender,
        contact_number: patient.contact_number || '',
        email: patient.email || '',
        address: patient.address || '',
    });

    const getFullName = (person: { fname: string; mname?: string | null; lname: string }) => {
        const parts = [person.fname, person.mname, person.lname].filter(Boolean);
        return parts.join(' ');
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const calculateAge = (dateOfBirth: string) => {
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'Completed':
                return 'default';
            case 'Scheduled':
                return 'secondary';
            case 'Cancelled':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/patients/${patient.id}`, {
            onSuccess: () => {
                setIsEditing(false);
                toast.success('Patient updated successfully', {
                    description: 'The patient information has been saved.',
                });
            },
            onError: () => {
                toast.error('Failed to update patient', {
                    description: 'Please check the form for errors and try again.',
                });
            },
        });
    };

    const handleCancel = () => {
        reset();
        setIsEditing(false);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Patient - ${getFullName(patient)}`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{getFullName(patient)}</h1>
                        <p className="text-sm text-muted-foreground">Patient ID: {patient.id}</p>
                    </div>
                    <div className="flex gap-2">
                        {isEditing ? (
                            <>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleCancel}
                                    disabled={processing}
                                >
                                    <XCircle className="mr-2 size-4" />
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    form="patient-form"
                                    disabled={processing}
                                    className="min-w-[120px]"
                                >
                                    {processing ? (
                                        <>
                                            <Spinner className="mr-2 size-4" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 size-4" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            </>
                        ) : (
                            <Button onClick={() => setIsEditing(true)}>
                                <Pencil className="mr-2 size-4" />
                                Edit Patient
                            </Button>
                        )}
                    </div>
                </div>

                {/* Patient Information Card */}
                <form id="patient-form" onSubmit={handleSave}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="size-5" />
                                Patient Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {/* First Name */}
                                <div className="space-y-1">
                                    <Label className="text-sm font-medium text-muted-foreground">First Name</Label>
                                    {isEditing ? (
                                        <>
                                            <Input
                                                value={data.fname}
                                                onChange={(e) => setData('fname', e.target.value)}
                                                className={errors.fname ? 'border-red-500' : ''}
                                            />
                                            {errors.fname && <span className="text-xs text-red-500">{errors.fname}</span>}
                                        </>
                                    ) : (
                                        <p className="font-medium">{patient.fname}</p>
                                    )}
                                </div>

                                {/* Middle Name */}
                                <div className="space-y-1">
                                    <Label className="text-sm font-medium text-muted-foreground">Middle Name</Label>
                                    {isEditing ? (
                                        <>
                                            <Input
                                                value={data.mname}
                                                onChange={(e) => setData('mname', e.target.value)}
                                                placeholder="Optional"
                                            />
                                            {errors.mname && <span className="text-xs text-red-500">{errors.mname}</span>}
                                        </>
                                    ) : (
                                        <p className="font-medium">{patient.mname || '-'}</p>
                                    )}
                                </div>

                                {/* Last Name */}
                                <div className="space-y-1">
                                    <Label className="text-sm font-medium text-muted-foreground">Last Name</Label>
                                    {isEditing ? (
                                        <>
                                            <Input
                                                value={data.lname}
                                                onChange={(e) => setData('lname', e.target.value)}
                                                className={errors.lname ? 'border-red-500' : ''}
                                            />
                                            {errors.lname && <span className="text-xs text-red-500">{errors.lname}</span>}
                                        </>
                                    ) : (
                                        <p className="font-medium">{patient.lname}</p>
                                    )}
                                </div>

                                {/* Gender */}
                                <div className="space-y-1">
                                    <Label className="text-sm font-medium text-muted-foreground">Gender</Label>
                                    {isEditing ? (
                                        <>
                                            <Select
                                                value={data.gender}
                                                onValueChange={(val) => setData('gender', val)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Gender" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Male">Male</SelectItem>
                                                    <SelectItem value="Female">Female</SelectItem>
                                                    <SelectItem value="Other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.gender && <span className="text-xs text-red-500">{errors.gender}</span>}
                                        </>
                                    ) : (
                                        <Badge variant="secondary">{patient.gender}</Badge>
                                    )}
                                </div>

                                {/* Date of Birth */}
                                <div className="space-y-1">
                                    <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                        <Calendar className="size-4" />
                                        Date of Birth
                                    </Label>
                                    {isEditing ? (
                                        <>
                                            <DatePicker
                                                value={data.date_of_birth}
                                                onChange={(date) => setData('date_of_birth', date ? format(date, 'yyyy-MM-dd') : '')}
                                                placeholder="Select date of birth"
                                                disableFuture
                                            />
                                            {errors.date_of_birth && <span className="text-xs text-red-500">{errors.date_of_birth}</span>}
                                        </>
                                    ) : (
                                        <p>{formatDate(patient.date_of_birth)} ({calculateAge(patient.date_of_birth)} years old)</p>
                                    )}
                                </div>

                                {/* Contact Number */}
                                <div className="space-y-1">
                                    <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                        <Phone className="size-4" />
                                        Contact Number
                                    </Label>
                                    {isEditing ? (
                                        <>
                                            <Input
                                                value={data.contact_number}
                                                onChange={(e) => setData('contact_number', e.target.value)}
                                                placeholder="+63..."
                                            />
                                            {errors.contact_number && <span className="text-xs text-red-500">{errors.contact_number}</span>}
                                        </>
                                    ) : (
                                        <p>{patient.contact_number || '-'}</p>
                                    )}
                                </div>

                                {/* Email */}
                                <div className="space-y-1">
                                    <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                        <Mail className="size-4" />
                                        Email
                                    </Label>
                                    {isEditing ? (
                                        <>
                                            <Input
                                                type="email"
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                placeholder="email@example.com"
                                            />
                                            {errors.email && <span className="text-xs text-red-500">{errors.email}</span>}
                                        </>
                                    ) : (
                                        <p>{patient.email || '-'}</p>
                                    )}
                                </div>

                                {/* Address */}
                                <div className="space-y-1 md:col-span-2">
                                    <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                        <MapPin className="size-4" />
                                        Address
                                    </Label>
                                    {isEditing ? (
                                        <>
                                            <Input
                                                value={data.address}
                                                onChange={(e) => setData('address', e.target.value)}
                                                placeholder="Sampaloc, Manila"
                                            />
                                            {errors.address && <span className="text-xs text-red-500">{errors.address}</span>}
                                        </>
                                    ) : (
                                        <p>{patient.address || '-'}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                </form>

                {/* Medical History / Appointments */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="size-5" />
                            Medical History
                        </CardTitle>
                        <CardDescription>
                            View all appointments and treatment records for this patient
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {patient.appointments && patient.appointments.length > 0 ? (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date & Time</TableHead>
                                            <TableHead>Dentist</TableHead>
                                            <TableHead>Purpose</TableHead>
                                            <TableHead>Treatments</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {patient.appointments.map((appointment) => (
                                            <TableRow key={appointment.id}>
                                                <TableCell className="font-medium">
                                                    <Link
                                                        href={`/appointments/${appointment.id}`}
                                                        className="hover:underline text-blue-600 dark:text-blue-400"
                                                    >
                                                        {formatDateTime(appointment.appointment_start_datetime)}
                                                    </Link>
                                                </TableCell>
                                                <TableCell>
                                                    {appointment.dentist ? getFullName(appointment.dentist) : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {appointment.purpose_of_appointment || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {appointment.treatment_records.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {appointment.treatment_records.map((record) => (
                                                                <Badge key={record.id} variant="outline">
                                                                    {record.treatment_type?.name || 'Unknown'}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">No treatments</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={getStatusBadgeVariant(appointment.status)}>
                                                        {appointment.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <FileText className="size-12 text-muted-foreground/50 mb-4" />
                                <p className="text-muted-foreground">No appointments or treatment records found.</p>
                                <p className="text-sm text-muted-foreground">
                                    Appointments and treatments will appear here once created.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
