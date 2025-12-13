import {
    genderSchema,
    nameSchema,
    optionalNameSchema,
    phoneNumberSchema,
    requiredEmailSchema,
} from '@/lib/validations';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
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
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { UserPlus, ChevronLeft, ChevronRight, Check, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Specialization {
    id: number;
    name: string;
}

interface RegisterDentistDialogProps {
    specializations: Specialization[];
    errors?: Record<string, string>;
}

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
    hire_date: z.string().min(1, 'Hire date is required'),
});

type DentistFormData = z.infer<typeof dentistFormSchema>;

const STEPS = [
    { id: 1, title: 'Personal Info', description: 'Basic information' },
    { id: 2, title: 'Contact', description: 'Email & phone' },
    { id: 3, title: 'Profile', description: 'Photo & employment' },
    { id: 4, title: 'Specializations', description: 'Skills & review' },
];

export function RegisterDentistDialog({
    specializations = [],
    errors = {},
}: RegisterDentistDialogProps) {
    const [open, setOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        control,
        trigger,
        reset,
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
    const [hireDateOpen, setHireDateOpen] = useState(false);
    const [hireDateMonth, setHireDateMonth] = useState<Date>(new Date());
    const selectedSpecializations = watch('specialization_ids');
    const hireDate = watch('hire_date');

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

    const validateCurrentStep = async (): Promise<boolean> => {
        let fieldsToValidate: (keyof DentistFormData)[] = [];
        
        switch (currentStep) {
            case 1:
                fieldsToValidate = ['fname', 'lname', 'gender'];
                break;
            case 2:
                fieldsToValidate = ['email', 'contact_number'];
                break;
            case 3:
                fieldsToValidate = ['avatar', 'hire_date'];
                break;
            case 4:
                fieldsToValidate = ['specialization_ids'];
                break;
        }
        
        const result = await trigger(fieldsToValidate);
        return result;
    };

    const handleNext = async () => {
        const isValid = await validateCurrentStep();
        if (isValid && currentStep < 4) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleClose = () => {
        setOpen(false);
        setCurrentStep(1);
        setAvatarPreview(null);
        reset();
    };

    const onSubmit = (data: DentistFormData) => {
        setIsSubmitting(true);
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
                setIsSubmitting(false);
                toast.success('Dentist registered successfully!', {
                    description: 'Login credentials have been sent via email.',
                });
                handleClose();
            },
            onError: () => {
                setIsSubmitting(false);
                toast.error('Failed to register dentist', {
                    description: 'Please check the form for errors and try again.',
                });
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            if (!isOpen) handleClose();
            else setOpen(true);
        }}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <UserPlus className="size-4" />
                    Register New Dentist
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Register New Dentist</DialogTitle>
                    <DialogDescription>
                        Fill in the details below. A default password will be auto-generated and sent via email.
                    </DialogDescription>
                </DialogHeader>

                {/* Step Indicator */}
                <div className="flex items-center justify-center mb-6">
                    {STEPS.map((step, index) => (
                        <div key={step.id} className="flex items-center">
                            <div className="flex flex-col items-center">
                                <div
                                    className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                                        currentStep === step.id
                                            ? "bg-primary text-primary-foreground"
                                            : currentStep > step.id
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted text-muted-foreground"
                                    )}
                                >
                                    {currentStep > step.id ? (
                                        <Check className="size-4" />
                                    ) : (
                                        step.id
                                    )}
                                </div>
                                <span className="text-xs mt-1 text-center hidden sm:block">
                                    {step.title}
                                </span>
                            </div>
                            {index < STEPS.length - 1 && (
                                <div
                                    className={cn(
                                        "w-16 h-0.5 mx-1 self-start mt-4",
                                        currentStep > step.id
                                            ? "bg-primary"
                                            : "bg-muted"
                                    )}
                                />
                            )}
                        </div>
                    ))}
                </div>

                <div>
                    {currentStep === 1 && (
                        <div className="space-y-4">
                            <FieldGroup className="grid grid-cols-1 gap-4">
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
                                        placeholder="Middle Name (Optional)"
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
                                    <p className="text-[0.75rem] text-muted-foreground mt-1">Used to generate default password: lastname_XXXX</p>
                                </Field>

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
                        </div>
                    )}

                    {/* Step 2: Contact Information */}
                    {currentStep === 2 && (
                        <div className="space-y-4">
                            <FieldGroup className="grid grid-cols-1 gap-4">
                                <Field data-invalid={!!(formErrors.email || errors.email)}>
                                    <FieldLabel>Email <span className="text-destructive">*</span></FieldLabel>
                                    <Input
                                        type="email"
                                        {...register('email')}
                                        placeholder="email@example.com"
                                        aria-invalid={!!(formErrors.email || errors.email)}
                                    />
                                    <FieldError errors={[{ message: formErrors.email?.message || errors.email }]} />
                                    <p className="text-[0.75rem] text-muted-foreground mt-1">Login credentials will be sent to this email</p>
                                </Field>

                                <Field data-invalid={!!(formErrors.contact_number || errors.contact_number)}>
                                    <FieldLabel>Contact Number</FieldLabel>
                                    <Input
                                        type="tel"
                                        {...register('contact_number')}
                                        placeholder="+63 (123) 456-7890"
                                        maxLength={16}
                                        aria-invalid={!!(formErrors.contact_number || errors.contact_number)}
                                    />
                                    <FieldError errors={[{ message: formErrors.contact_number?.message || errors.contact_number }]} />
                                    <p className="text-[0.75rem] text-muted-foreground mt-1">Accepts: +63 prefix, 0 prefix, or plain numbers</p>
                                </Field>
                            </FieldGroup>
                        </div>
                    )}

                    {/* Step 3: Profile & Employment */}
                    {currentStep === 3 && (
                        <div className="space-y-4">
                            <FieldGroup className="grid grid-cols-1 gap-4">
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
                                            <p className="text-[0.75rem] text-muted-foreground mt-1">Max: 2MB. Formats: JPEG, PNG, GIF</p>
                                            <FieldError errors={[{ message: formErrors.avatar?.message || errors.avatar }]} />
                                        </div>
                                        {avatarPreview && (
                                            <div className="relative shrink-0 overflow-hidden rounded-md border">
                                                <img
                                                    src={avatarPreview}
                                                    alt="Avatar preview"
                                                    className="aspect-square h-[80px] w-[80px] object-cover"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </Field>

                                <Field data-invalid={!!(formErrors.hire_date || errors.hire_date)}>
                                    <FieldLabel>Hire Date <span className="text-destructive">*</span></FieldLabel>
                                    <div className="relative flex gap-2">
                                        <Input
                                            value={hireDate ? new Date(hireDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                                            placeholder="Select date"
                                            className={`bg-background pr-10 ${formErrors.hire_date || errors.hire_date ? 'border-red-500' : ''}`}
                                            readOnly
                                            onClick={() => setHireDateOpen(true)}
                                        />
                                        <Popover open={hireDateOpen} onOpenChange={setHireDateOpen}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    className="absolute top-1/2 right-2 size-6 -translate-y-1/2 p-0 h-auto w-auto hover:bg-transparent focus:bg-transparent focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
                                                >
                                                    <CalendarIcon className="size-4 text-muted-foreground hover:text-foreground transition-colors" />
                                                    <span className="sr-only">Select date</span>
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent
                                                className="w-auto overflow-hidden p-0"
                                                align="end"
                                                alignOffset={-8}
                                                sideOffset={10}
                                            >
                                                <Calendar
                                                    mode="single"
                                                    selected={hireDate ? new Date(hireDate) : undefined}
                                                    captionLayout="dropdown"
                                                    month={hireDateMonth}
                                                    onMonthChange={setHireDateMonth}
                                                    onSelect={(date) => {
                                                        if (date) {
                                                            setValue('hire_date', date.toISOString().split('T')[0], { shouldValidate: true });
                                                        } else {
                                                            setValue('hire_date', '', { shouldValidate: true });
                                                        }
                                                        setHireDateOpen(false);
                                                    }}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <p className="text-[0.75rem] text-muted-foreground mt-1">Employment status will be set to "Active" by default</p>
                                    <FieldError errors={[{ message: formErrors.hire_date?.message || errors.hire_date }]} />
                                </Field>
                            </FieldGroup>
                        </div>
                    )}

                    {/* Step 4: Specializations & Review */}
                    {currentStep === 4 && (
                        <div className="space-y-4">
                            <Field data-invalid={!!(formErrors.specialization_ids || errors.specialization_ids)}>
                                <FieldLabel>Specializations (Optional)</FieldLabel>
                                {specializations.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-3 p-3 border rounded-md max-h-[150px] overflow-y-auto">
                                        {specializations.map((spec) => (
                                            <div key={spec.id} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`spec-${spec.id}`}
                                                    checked={(selectedSpecializations || []).includes(spec.id)}
                                                    onCheckedChange={(checked) =>
                                                        handleSpecializationChange(spec.id, !!checked)
                                                    }
                                                />
                                                <label
                                                    htmlFor={`spec-${spec.id}`}
                                                    className="text-sm font-medium leading-none cursor-pointer"
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
                        </div>
                    )}

                    <DialogFooter className="mt-6 gap-2">
                        {currentStep > 1 && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handlePrevious}
                                disabled={isSubmitting}
                            >
                                <ChevronLeft className="size-4 mr-1" />
                                Previous
                            </Button>
                        )}
                        
                        {currentStep < 4 ? (
                            <Button
                                type="button"
                                onClick={handleNext}
                            >
                                Next
                                <ChevronRight className="size-4 ml-1" />
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                onClick={handleSubmit(onSubmit)}
                                disabled={isSubmitting}
                                className="min-w-[140px]"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Spinner className="mr-2 size-4" />
                                        Registering...
                                    </>
                                ) : (
                                    <>
                                        <Check className="size-4 mr-1" />
                                        Register Dentist
                                    </>
                                )}
                            </Button>
                        )}
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
