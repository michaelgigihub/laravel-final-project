import {
    genderSchema,
    nameSchema,
    optionalNameSchema,
    phoneNumberSchema,
    requiredEmailSchema,
} from '@/lib/validations';
import type { RegisterDentistProps } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
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

const dentistFormSchema = z.object({
    fname: nameSchema('First name'),
    mname: optionalNameSchema('Middle name'),
    lname: nameSchema('Last name'),
    gender: genderSchema,
    contact_number: phoneNumberSchema,
    email: requiredEmailSchema,
    avatar: z
        .instanceof(File)
        .optional()
        .refine(
            (file) => {
                if (!file) return true;
                return file.size <= 2 * 1024 * 1024;
            },
            { message: 'Avatar must be less than 2MB' },
        )
        .refine(
            (file) => {
                if (!file) return true;
                const validTypes = [
                    'image/jpeg',
                    'image/jpg',
                    'image/png',
                    'image/gif',
                ];
                return validTypes.includes(file.type);
            },
            { message: 'Avatar must be JPEG, JPG, PNG, or GIF' },
        ),
    specialization_ids: z.array(z.number()),
    employment_status: z.string(),
    hire_date: z.string().optional(),
});

type DentistFormData = z.infer<typeof dentistFormSchema>;

export default function RegisterDentist({
    specializations = [],
    errors = {},
}: RegisterDentistProps) {
    const {
        register,
        handleSubmit,
        watch,
        setValue,
        control,
        formState: { errors: formErrors },
    } = useForm<DentistFormData>({
        resolver: zodResolver(dentistFormSchema),
        defaultValues: {
            fname: '',
            mname: '',
            lname: '',
            gender: undefined,
            contact_number: '',
            email: '',
            avatar: undefined,
            specialization_ids: [],
            employment_status: 'Active',
            hire_date: '',
        },
    });

    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const selectedSpecializations = watch('specialization_ids');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setValue('avatar', file, { shouldValidate: true });

            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSpecializationChange = (id: number, isChecked: boolean) => {
        const current = selectedSpecializations || [];
        const updated = isChecked
            ? [...current, id]
            : current.filter((specId) => specId !== id);
        setValue('specialization_ids', updated, { shouldValidate: true });
    };

    const onSubmit = (data: DentistFormData) => {
        const submitData = new FormData();
        submitData.append('fname', data.fname);
        submitData.append('mname', data.mname || '');
        submitData.append('lname', data.lname);
        submitData.append('gender', data.gender);
        submitData.append('contact_number', data.contact_number || '');
        submitData.append('email', data.email);
        submitData.append('hire_date', data.hire_date || '');

        if (data.avatar) {
            submitData.append('avatar', data.avatar);
        }

        (data.specialization_ids || []).forEach((id, index) => {
            submitData.append(`specialization_ids[${index}]`, id.toString());
        });

        router.post('/admin/dentists', submitData, {
            preserveScroll: true,
            onSuccess: () => {
                alert(
                    'Dentist registered successfully! An email has been sent with login credentials.',
                );
            },
        });
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
            <Card className="w-full max-w-4xl">
                <CardHeader>
                    <CardTitle>Register New Dentist</CardTitle>
                    <CardDescription>
                        Fill in the details below to register a new dentist. A default
                        password will be auto-generated and sent via email.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <CardContent className="space-y-8">
                        {/* Personal Information Section */}
                        <FieldSet>
                            <FieldLegend>Personal Information</FieldLegend>
                            <FieldGroup className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Field data-invalid={!!(formErrors.fname || errors.fname)}>
                                    <FieldLabel>First Name <span className="text-destructive">*</span></FieldLabel>
                                    <Input
                                        {...register('fname')}
                                        placeholder="First Name"
                                        aria-invalid={!!(formErrors.fname || errors.fname)}
                                    />
                                    <FieldError errors={[{ message: formErrors.fname?.message || errors.fname }]} />
                                </Field>

                                <Field data-invalid={!!(formErrors.mname || errors.mname)}>
                                    <FieldLabel>Middle Name</FieldLabel>
                                    <Input
                                        {...register('mname')}
                                        placeholder="Middle Name"
                                        aria-invalid={!!(formErrors.mname || errors.mname)}
                                    />
                                    <FieldError errors={[{ message: formErrors.mname?.message || errors.mname }]} />
                                </Field>

                                <Field data-invalid={!!(formErrors.lname || errors.lname)}>
                                    <FieldLabel>Last Name <span className="text-destructive">*</span></FieldLabel>
                                    <Input
                                        {...register('lname')}
                                        placeholder="Last Name"
                                        aria-invalid={!!(formErrors.lname || errors.lname)}
                                    />
                                    <FieldError errors={[{ message: formErrors.lname?.message || errors.lname }]} />
                                    <p className="text-[0.8rem] text-muted-foreground mt-1">Used to generate default password: lastname_XXXX</p>
                                </Field>
                            </FieldGroup>

                            <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <Field data-invalid={!!(formErrors.gender || errors.gender)}>
                                    <FieldLabel>Gender <span className="text-destructive">*</span></FieldLabel>
                                    <Controller
                                        control={control}
                                        name="gender"
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                            </FieldGroup>
                        </FieldSet>

                        {/* Contact Information Section */}
                        <FieldSet>
                            <FieldLegend>Contact Information</FieldLegend>
                            <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Field data-invalid={!!(formErrors.email || errors.email)}>
                                    <FieldLabel>Email <span className="text-destructive">*</span></FieldLabel>
                                    <Input
                                        type="email"
                                        {...register('email')}
                                        placeholder="email@example.com"
                                        aria-invalid={!!(formErrors.email || errors.email)}
                                    />
                                    <FieldError errors={[{ message: formErrors.email?.message || errors.email }]} />
                                    <p className="text-[0.8rem] text-muted-foreground mt-1">Login credentials will be sent to this email</p>
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
                        </FieldSet>

                        {/* Profile Picture Section */}
                        <FieldSet>
                            <FieldLegend>Profile Picture</FieldLegend>
                            <FieldGroup>
                                <Field data-invalid={!!(formErrors.avatar || errors.avatar)}>
                                    <FieldLabel>Avatar (Optional)</FieldLabel>
                                    <div className="flex items-start gap-4">
                                        <div className="flex-1">
                                            <Input
                                                type="file"
                                                id="avatar"
                                                name="avatar"
                                                accept="image/jpeg,image/jpg,image/png,image/gif"
                                                onChange={handleFileChange}
                                                aria-invalid={!!(formErrors.avatar || errors.avatar)}
                                                className="cursor-pointer file:text-foreground"
                                            />
                                            <p className="text-[0.8rem] text-muted-foreground mt-1">Max size: 2MB. Accepted formats: JPEG, JPG, PNG, GIF</p>
                                            <FieldError errors={[{ message: formErrors.avatar?.message || errors.avatar }]} />
                                        </div>
                                        {avatarPreview && (
                                            <div className="relative shrink-0 overflow-hidden rounded-md border text-xs">
                                                <img
                                                    src={avatarPreview}
                                                    alt="Avatar preview"
                                                    className="aspect-square h-[100px] w-[100px] object-cover"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </Field>
                            </FieldGroup>
                        </FieldSet>

                        {/* Specializations Section */}
                        <FieldSet>
                            <FieldLegend>Specializations (Optional)</FieldLegend>
                            <FieldGroup>
                                <Field data-invalid={!!(formErrors.specialization_ids || errors.specialization_ids)}>
                                    {specializations.length > 0 ? (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-md">
                                            {specializations.map((spec) => (
                                                <div key={spec.id} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`spec-${spec.id}`}
                                                        checked={(selectedSpecializations || []).includes(spec.id)}
                                                        onCheckedChange={(checked) =>
                                                            handleSpecializationChange(spec.id, !!checked)
                                                        }
                                                        aria-invalid={!!(formErrors.specialization_ids || errors.specialization_ids)}
                                                    />
                                                    <label
                                                        htmlFor={`spec-${spec.id}`}
                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                    >
                                                        {spec.name}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No specializations available</p>
                                    )}
                                    <FieldError errors={[{ message: formErrors.specialization_ids?.message || errors.specialization_ids }]} />
                                </Field>
                            </FieldGroup>
                        </FieldSet>

                        {/* Employment Information Section */}
                        <FieldSet>
                            <FieldLegend>Employment Information</FieldLegend>
                            <FieldGroup>
                                <Field data-invalid={!!(formErrors.hire_date || errors.hire_date)}>
                                    <FieldLabel>Hire Date</FieldLabel>
                                    <Input
                                        type="date"
                                        {...register('hire_date')}
                                        aria-invalid={!!(formErrors.hire_date || errors.hire_date)}
                                        className="w-full md:w-1/3"
                                    />
                                    <p className="text-[0.8rem] text-muted-foreground mt-1">Employment status will be set to "Active" by default</p>
                                    <FieldError errors={[{ message: formErrors.hire_date?.message || errors.hire_date }]} />
                                </Field>
                            </FieldGroup>
                        </FieldSet>

                        {/* Password Information */}
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-sm text-blue-900">
                            <h3 className="font-semibold mb-2 flex items-center gap-2">📧 Password Information</h3>
                            <ul className="list-disc list-inside space-y-1">
                                <li>A default password will be automatically generated</li>
                                <li>Format: <code className="bg-blue-100 px-1 rounded">lastname_XXXX</code> (4 random digits)</li>
                                <li>Credentials will be sent to the dentist's email</li>
                                <li>Dentist must change password on first login</li>
                            </ul>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end space-x-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit('/admin/dentists')}
                        >
                            Cancel
                        </Button>
                        <Button type="submit">
                            Register Dentist
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
