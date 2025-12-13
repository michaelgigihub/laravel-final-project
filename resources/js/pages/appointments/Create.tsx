import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TimePicker } from '@/components/ui/time-picker';
import { CalendarIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface Person {
    id: number;
    fname: string;
    mname: string | null;
    lname: string;
}

interface TreatmentType {
    id: number;
    name: string;
    standard_cost: number;
    duration_minutes: number;
}

interface CreateAppointmentProps {
    patients: Person[];
    dentists: Person[];
    treatmentTypes: TreatmentType[];
    errors?: Record<string, string>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Appointments', href: '/appointments' },
    { title: 'New Appointment', href: '/appointments/create' },
];

export default function CreateAppointment({ patients, dentists, treatmentTypes, errors = {} }: CreateAppointmentProps) {
    // Get params from URL query for pre-selection
    const { url } = usePage();
    const searchParams = new URLSearchParams(url.split('?')[1] || '');
    const preSelectedPatientId = searchParams.get('patient_id') || '';
    const preSelectedDate = searchParams.get('date') || '';
    const preSelectedTime = searchParams.get('time') || '';

    // Separate date and time state
    const [appointmentDate, setAppointmentDate] = useState<string>(preSelectedDate);
    const [appointmentTime, setAppointmentTime] = useState<string>(preSelectedTime);
    const [dateOpen, setDateOpen] = useState(false);

    const form = useForm({
        patient_id: preSelectedPatientId,
        dentist_id: '',
        appointment_start_datetime: '',
        treatment_type_ids: [] as number[],
        purpose_of_appointment: '',
    });

    const getFullName = (person: Person) => {
        return [person.fname, person.mname, person.lname].filter(Boolean).join(' ');
    };

    // innovative solution: Sync form data when date or time changes
    // This ensures that when the user submits, the data is already in the form state
    // avoiding issues with transform() not persisting or being ignored
    useEffect(() => {
       if (appointmentDate && appointmentTime) {
           form.setData('appointment_start_datetime', `${appointmentDate}T${appointmentTime}`);
       } else {
           form.setData('appointment_start_datetime', '');
       }
    }, [appointmentDate, appointmentTime]);

    const toggleTreatmentType = (id: number) => {
        const current = form.data.treatment_type_ids;
        if (current.includes(id)) {
            form.setData('treatment_type_ids', current.filter((t) => t !== id));
        } else {
            form.setData('treatment_type_ids', [...current, id]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/appointments');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New Appointment" />
            <div className="flex items-center justify-center p-4">
                <Card className="w-full max-w-3xl">
                    <CardHeader>
                        <CardTitle>Schedule New Appointment</CardTitle>
                        <CardDescription>
                            Fill in the details below to schedule a new appointment.
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-6">
                            {/* Patient Selection */}
                            <div className="space-y-2">
                                <Label htmlFor="patient_id">
                                    Patient <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                    value={form.data.patient_id}
                                    onValueChange={(v) => form.setData('patient_id', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Patient" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {patients.map((patient) => (
                                            <SelectItem key={patient.id} value={String(patient.id)}>
                                                {getFullName(patient)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {(form.errors.patient_id || errors.patient_id) && (
                                    <p className="text-sm text-destructive">
                                        {form.errors.patient_id || errors.patient_id}
                                    </p>
                                )}
                            </div>

                            {/* Dentist Selection */}
                            <div className="space-y-2">
                                <Label htmlFor="dentist_id">
                                    Dentist <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                    value={form.data.dentist_id}
                                    onValueChange={(v) => form.setData('dentist_id', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Dentist" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {dentists.map((dentist) => (
                                            <SelectItem key={dentist.id} value={String(dentist.id)}>
                                                {getFullName(dentist)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {(form.errors.dentist_id || errors.dentist_id) && (
                                    <p className="text-sm text-destructive">
                                        {form.errors.dentist_id || errors.dentist_id}
                                    </p>
                                )}
                            </div>

                            {/* Date & Time - Separate fields on same row */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Date Picker */}
                                <div className="space-y-2">
                                    <Label>
                                        Appointment Date <span className="text-destructive">*</span>
                                    </Label>
                                    <Popover open={dateOpen} onOpenChange={setDateOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    'w-full justify-start text-left font-normal',
                                                    !appointmentDate && 'text-muted-foreground'
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {appointmentDate
                                                    ? new Date(appointmentDate).toLocaleDateString('en-US', {
                                                          year: 'numeric',
                                                          month: 'long',
                                                          day: 'numeric',
                                                      })
                                                    : 'Select date'}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={appointmentDate ? new Date(appointmentDate) : undefined}
                                                onSelect={(date) => {
                                                    if (date) {
                                                        // Use local time components to avoid timezone shifts
                                                        const year = date.getFullYear();
                                                        const month = String(date.getMonth() + 1).padStart(2, '0');
                                                        const day = String(date.getDate()).padStart(2, '0');
                                                        setAppointmentDate(`${year}-${month}-${day}`);
                                                    }
                                                    setDateOpen(false);
                                                }}
                                                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    {(form.errors.appointment_start_datetime || errors.appointment_start_datetime) && (
                                        <p className="text-sm text-destructive">
                                            {form.errors.appointment_start_datetime || errors.appointment_start_datetime}
                                        </p>
                                    )}
                                </div>

                                {/* Time Picker */}
                                <div className="space-y-2">
                                    <Label>
                                        Appointment Time <span className="text-destructive">*</span>
                                    </Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    'w-full justify-between text-left font-normal',
                                                    !appointmentTime && 'text-muted-foreground'
                                                )}
                                            >
                                                <span>
                                                    {appointmentTime ? (() => {
                                                        const [h, m] = appointmentTime.split(':');
                                                        const hour = parseInt(h);
                                                        const period = hour >= 12 ? 'PM' : 'AM';
                                                        const hour12 = hour % 12 || 12;
                                                        return `${hour12.toString().padStart(2, '0')}:${m} ${period}`;
                                                    })() : '--:-- --'}
                                                </span>
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <div className="p-3 border-b border-border">
                                                <h4 className="font-medium text-sm text-center mb-2">Select Time</h4>
                                                <TimePicker
                                                    value={appointmentTime}
                                                    onChange={setAppointmentTime}
                                                />
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                    {!appointmentTime && (form.errors.appointment_start_datetime || errors.appointment_start_datetime) && (
                                        <p className="text-sm text-destructive">
                                            Please select a time
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Treatment Types */}
                            <div className="space-y-2">
                                <Label>
                                    Treatment Types <span className="text-destructive">*</span>
                                </Label>
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                    {treatmentTypes.map((treatment) => (
                                        <div
                                            key={treatment.id}
                                            className="flex items-center space-x-2 rounded-lg border p-3"
                                        >
                                            <Checkbox
                                                id={`treatment-${treatment.id}`}
                                                checked={form.data.treatment_type_ids.includes(treatment.id)}
                                                onCheckedChange={() => toggleTreatmentType(treatment.id)}
                                            />
                                            <label
                                                htmlFor={`treatment-${treatment.id}`}
                                                className="text-sm font-medium leading-none cursor-pointer"
                                            >
                                                {treatment.name}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                                {(form.errors.treatment_type_ids || errors.treatment_type_ids) && (
                                    <p className="text-sm text-destructive">
                                        {form.errors.treatment_type_ids || errors.treatment_type_ids}
                                    </p>
                                )}
                            </div>

                            {/* Purpose */}
                            <div className="space-y-2">
                                <Label htmlFor="purpose_of_appointment">Purpose (Optional)</Label>
                                <Textarea
                                    value={form.data.purpose_of_appointment}
                                    onChange={(e) => form.setData('purpose_of_appointment', e.target.value)}
                                    placeholder="Brief description of the appointment purpose..."
                                    rows={3}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end space-x-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.visit('/appointments')}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={form.processing}>
                                {form.processing ? 'Scheduling...' : 'Schedule Appointment'}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </AppLayout>
    );
}
