import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

interface Appointment {
    id: number;
    patient: Person;
    dentist_id: number;
    appointment_start_datetime: string;
    appointment_end_datetime: string | null;
    purpose_of_appointment: string | null;
    treatment_type_ids: number[];
    status: string;
}

interface EditAppointmentProps {
    appointment: Appointment;
    dentists: Person[];
    treatmentTypes: TreatmentType[];
    errors?: Record<string, string>;
}

export default function EditAppointment({ appointment, dentists, treatmentTypes, errors = {} }: EditAppointmentProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Appointments', href: '/appointments' },
        { title: `Appointment #${appointment.id}`, href: `/appointments/${appointment.id}` },
        { title: 'Edit', href: `/appointments/${appointment.id}/edit` },
    ];

    const form = useForm({
        dentist_id: String(appointment.dentist_id),
        appointment_start_datetime: appointment.appointment_start_datetime || '',
        treatment_type_ids: appointment.treatment_type_ids || [],
        purpose_of_appointment: appointment.purpose_of_appointment || '',
    });

    const getFullName = (person: Person) => {
        return [person.fname, person.mname, person.lname].filter(Boolean).join(' ');
    };

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
        form.put(`/appointments/${appointment.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Appointment #${appointment.id}`} />
            <div className="flex items-center justify-center p-4">
                <Card className="w-full max-w-3xl">
                    <CardHeader>
                        <CardTitle>Edit Appointment</CardTitle>
                        <CardDescription>
                            Update the appointment details below.
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-6">
                            {/* Patient (Read-only) */}
                            <div className="space-y-2">
                                <Label>Patient</Label>
                                <Input
                                    value={getFullName(appointment.patient)}
                                    disabled
                                    className="bg-muted"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Patient cannot be changed after appointment is created.
                                </p>
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

                            {/* Date/Time */}
                            <div className="space-y-2">
                                <Label htmlFor="appointment_start_datetime">
                                    Appointment Date & Time <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    type="datetime-local"
                                    value={form.data.appointment_start_datetime}
                                    onChange={(e) => form.setData('appointment_start_datetime', e.target.value)}
                                />
                                {(form.errors.appointment_start_datetime || errors.appointment_start_datetime) && (
                                    <p className="text-sm text-destructive">
                                        {form.errors.appointment_start_datetime || errors.appointment_start_datetime}
                                    </p>
                                )}
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
                                onClick={() => router.visit(`/appointments/${appointment.id}`)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={form.processing}>
                                {form.processing ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </AppLayout>
    );
}
