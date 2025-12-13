import {
    genderSchema,
    nameSchema,
    optionalEmailSchema,
    optionalNameSchema,
    phoneNumberSchema,
} from '@/lib/validations';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from '@inertiajs/react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
    FieldSet,
    FieldLegend,
} from '@/components/ui/field';

const patientFormSchema = z.object({
    fname: nameSchema('First name'),
    mname: optionalNameSchema('Middle name'),
    lname: nameSchema('Last name'),
    gender: genderSchema,
    contact_number: phoneNumberSchema,
    email: optionalEmailSchema,
    date_of_birth: z.string().min(1, 'Date of birth is required'),
    address: z
        .string()
        .max(500, 'Address must not exceed 500 characters')
        .optional(),
});

type PatientFormData = z.infer<typeof patientFormSchema>;

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
}

interface EditPatientProps {
    patient: Patient;
    errors?: Record<string, string>;
}

export default function EditPatient({ patient, errors = {} }: EditPatientProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Patients', href: '/patients' },
        { title: `${patient.fname} ${patient.lname}`, href: `/patients/${patient.id}` },
        { title: 'Edit', href: `/patients/${patient.id}/edit` },
    ];

    const {
        register,
        handleSubmit,
        control,
        formState: { errors: formErrors, isSubmitting },
    } = useForm<PatientFormData>({
        resolver: zodResolver(patientFormSchema),
        defaultValues: {
            fname: patient.fname || '',
            mname: patient.mname || '',
            lname: patient.lname || '',
            gender: patient.gender as 'Male' | 'Female' | 'Other',
            contact_number: patient.contact_number || '',
            email: patient.email || '',
            date_of_birth: patient.date_of_birth?.split('T')[0] || '',
            address: patient.address || '',
        },
    });

    const onSubmit = (data: PatientFormData) => {
        router.put(`/patients/${patient.id}`, data, {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Patient - ${patient.fname} ${patient.lname}`} />
            <div className="flex items-center justify-center p-4">
                <Card className="w-full max-w-3xl">
                    <CardHeader>
                        <CardTitle>Edit Patient</CardTitle>
                        <CardDescription>Update the patient's information below.</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <CardContent className="space-y-8">
                            {/* Personal Information Section */}
                            <FieldSet>
                                <FieldLegend>Personal Information</FieldLegend>
                                <FieldGroup className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Field data-invalid={!!(formErrors.fname || errors.fname)}>
                                        <FieldLabel>First Name <span className="text-destructive">*</span></FieldLabel>
                                        <Input {...register('fname')} placeholder="First Name" aria-invalid={!!(formErrors.fname || errors.fname)} />
                                        <FieldError errors={[{ message: formErrors.fname?.message || errors.fname }]} />
                                    </Field>

                                    <Field data-invalid={!!(formErrors.mname || errors.mname)}>
                                        <FieldLabel>Middle Name</FieldLabel>
                                        <Input {...register('mname')} placeholder="Middle Name" aria-invalid={!!(formErrors.mname || errors.mname)} />
                                        <FieldError errors={[{ message: formErrors.mname?.message || errors.mname }]} />
                                    </Field>

                                    <Field data-invalid={!!(formErrors.lname || errors.lname)}>
                                        <FieldLabel>Last Name <span className="text-destructive">*</span></FieldLabel>
                                        <Input {...register('lname')} placeholder="Last Name" aria-invalid={!!(formErrors.lname || errors.lname)} />
                                        <FieldError errors={[{ message: formErrors.lname?.message || errors.lname }]} />
                                    </Field>
                                </FieldGroup>

                                <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    <Field data-invalid={!!(formErrors.gender || errors.gender)}>
                                        <FieldLabel>Gender <span className="text-destructive">*</span></FieldLabel>
                                        <Controller
                                            control={control}
                                            name="gender"
                                            render={({ field }) => (
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <SelectTrigger aria-invalid={!!(formErrors.gender || errors.gender)}>
                                                        <SelectValue placeholder="Select Gender" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Male">Male</SelectItem>
                                                        <SelectItem value="Female">Female</SelectItem>
                                                        <SelectItem value="Other">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                        <FieldError errors={[{ message: formErrors.gender?.message || errors.gender }]} />
                                    </Field>

                                    <Field data-invalid={!!(formErrors.date_of_birth || errors.date_of_birth)}>
                                        <FieldLabel>Date of Birth <span className="text-destructive">*</span></FieldLabel>
                                        <Controller
                                            control={control}
                                            name="date_of_birth"
                                            render={({ field }) => (
                                                <DatePicker
                                                    value={field.value}
                                                    onChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                                                    placeholder="Select date of birth"
                                                    disableFuture
                                                />
                                            )}
                                        />
                                        <FieldError errors={[{ message: formErrors.date_of_birth?.message || errors.date_of_birth }]} />
                                    </Field>
                                </FieldGroup>
                            </FieldSet>

                            {/* Contact Information Section */}
                            <FieldSet>
                                <FieldLegend>Contact Information</FieldLegend>
                                <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Field data-invalid={!!(formErrors.email || errors.email)}>
                                        <FieldLabel>Email</FieldLabel>
                                        <Input type="email" {...register('email')} placeholder="email@example.com" aria-invalid={!!(formErrors.email || errors.email)} />
                                        <FieldError errors={[{ message: formErrors.email?.message || errors.email }]} />
                                    </Field>

                                    <Field data-invalid={!!(formErrors.contact_number || errors.contact_number)}>
                                        <FieldLabel>Contact Number</FieldLabel>
                                        <Input
                                            type="tel"
                                            {...register('contact_number')}
                                            placeholder="0917 123 4567"
                                            maxLength={16}
                                            aria-invalid={!!(formErrors.contact_number || errors.contact_number)}
                                        />
                                        <FieldError errors={[{ message: formErrors.contact_number?.message || errors.contact_number }]} />
                                        <p className="text-[0.8rem] text-muted-foreground mt-1">Accepts: +63 prefix, 0 prefix, or plain numbers.</p>
                                    </Field>
                                </FieldGroup>

                                <Field className="mt-4" data-invalid={!!(formErrors.address || errors.address)}>
                                    <FieldLabel>Address</FieldLabel>
                                    <Textarea {...register('address')} placeholder="Complete Address" rows={3} aria-invalid={!!(formErrors.address || errors.address)} />
                                    <FieldError errors={[{ message: formErrors.address?.message || errors.address }]} />
                                </Field>
                            </FieldSet>
                        </CardContent>
                        <CardFooter className="flex justify-end space-x-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.visit(`/patients/${patient.id}`)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </AppLayout>
    );
}
