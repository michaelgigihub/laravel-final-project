import {
    genderSchema,
    nameSchema,
    optionalEmailSchema,
    optionalNameSchema,
    phoneNumberSchema,
} from '@/lib/validations';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
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

interface RegisterPatientDialogProps {
    errors?: Record<string, string>;
    trigger?: React.ReactNode;
}

const patientFormSchema = z.object({
    fname: nameSchema('First name'),
    mname: optionalNameSchema('Middle name'),
    lname: nameSchema('Last name'),
    gender: genderSchema,
    date_of_birth: z.string().min(1, 'Date of birth is required'),
    contact_number: phoneNumberSchema,
    email: optionalEmailSchema,
    address: z
        .string()
        .max(500, 'Address must not exceed 500 characters')
        .optional(),
});

type PatientFormData = z.infer<typeof patientFormSchema>;

const STEPS = [
    { id: 1, title: 'Personal Info', description: 'Name & gender' },
    { id: 2, title: 'Birth Date', description: 'Date of birth' },
    { id: 3, title: 'Contact', description: 'Email & phone' },
    { id: 4, title: 'Address', description: 'Location & review' },
];

export function RegisterPatientDialog({
    errors = {},
    trigger,
}: RegisterPatientDialogProps) {
    const [open, setOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        control,
        trigger: triggerValidation,
        reset,
        formState: { errors: formErrors },
    } = useForm<PatientFormData>({
        resolver: zodResolver(patientFormSchema),
        defaultValues: {
            fname: '',
            mname: '',
            lname: '',
            gender: undefined,
            date_of_birth: '',
            contact_number: '',
            email: '',
            address: '',
        },
    });

    const [dobOpen, setDobOpen] = useState(false);
    const [dobMonth, setDobMonth] = useState<Date>(new Date());
    const dateOfBirth = watch('date_of_birth');

    const validateCurrentStep = async (): Promise<boolean> => {
        let fieldsToValidate: (keyof PatientFormData)[] = [];
        
        switch (currentStep) {
            case 1:
                fieldsToValidate = ['fname', 'lname', 'gender'];
                break;
            case 2:
                fieldsToValidate = ['date_of_birth'];
                break;
            case 3:
                fieldsToValidate = ['email', 'contact_number'];
                break;
            case 4:
                fieldsToValidate = ['address'];
                break;
        }
        
        const result = await triggerValidation(fieldsToValidate);
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
        reset();
    };

    const onSubmit = (data: PatientFormData) => {
        setIsSubmitting(true);
        
        router.post('/patients', data, {
            preserveScroll: true,
            onSuccess: () => {
                setIsSubmitting(false);
                toast.success('Patient registered successfully!', {
                    description: 'The patient record has been created.',
                });
                handleClose();
            },
            onError: () => {
                setIsSubmitting(false);
                toast.error('Failed to register patient', {
                    description: 'Please check the form for errors and try again.',
                });
            },
        });
    };

    const defaultTrigger = (
        <Button className="gap-2">
            <UserPlus className="size-4" />
            Add Patient
        </Button>
    );

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            if (!isOpen) handleClose();
            else setOpen(true);
        }}>
            <DialogTrigger asChild>
                {trigger || defaultTrigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Register New Patient</DialogTitle>
                    <DialogDescription>
                        Fill in the patient details below. Required fields are marked with *.
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
                                        "w-12 h-0.5 mx-1 self-start mt-4",
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
                    {/* Step 1: Personal Info */}
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

                    {/* Step 2: Birth Date */}
                    {currentStep === 2 && (
                        <div className="space-y-4">
                            <FieldGroup className="grid grid-cols-1 gap-4">
                                <Field data-invalid={!!(formErrors.date_of_birth || errors.date_of_birth)}>
                                    <FieldLabel>Date of Birth <span className="text-destructive">*</span></FieldLabel>
                                    <div className="relative flex gap-2">
                                        <Input
                                            value={dateOfBirth ? new Date(dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                                            placeholder="Select date"
                                            className={`bg-background pr-10 ${formErrors.date_of_birth || errors.date_of_birth ? 'border-red-500' : ''}`}
                                            readOnly
                                            onClick={() => setDobOpen(true)}
                                        />
                                        <Popover open={dobOpen} onOpenChange={setDobOpen}>
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
                                                    selected={dateOfBirth ? new Date(dateOfBirth) : undefined}
                                                    captionLayout="dropdown"
                                                    month={dobMonth}
                                                    onMonthChange={setDobMonth}
                                                    fromYear={1900}
                                                    toYear={new Date().getFullYear()}
                                                    onSelect={(date) => {
                                                        if (date) {
                                                            setValue('date_of_birth', date.toISOString().split('T')[0], { shouldValidate: true });
                                                        } else {
                                                            setValue('date_of_birth', '', { shouldValidate: true });
                                                        }
                                                        setDobOpen(false);
                                                    }}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <p className="text-[0.75rem] text-muted-foreground mt-1">Select the patient's date of birth</p>
                                    <FieldError errors={[{ message: formErrors.date_of_birth?.message || errors.date_of_birth }]} />
                                </Field>
                            </FieldGroup>
                        </div>
                    )}

                    {/* Step 3: Contact Information */}
                    {currentStep === 3 && (
                        <div className="space-y-4">
                            <FieldGroup className="grid grid-cols-1 gap-4">
                                <Field data-invalid={!!(formErrors.email || errors.email)}>
                                    <FieldLabel>Email</FieldLabel>
                                    <Input
                                        type="email"
                                        {...register('email')}
                                        placeholder="email@example.com"
                                        aria-invalid={!!(formErrors.email || errors.email)}
                                    />
                                    <FieldError errors={[{ message: formErrors.email?.message || errors.email }]} />
                                    <p className="text-[0.75rem] text-muted-foreground mt-1">Optional - for appointment reminders</p>
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

                    {/* Step 4: Address & Review */}
                    {currentStep === 4 && (
                        <div className="space-y-4">
                            <Field data-invalid={!!(formErrors.address || errors.address)}>
                                <FieldLabel>Address</FieldLabel>
                                <Textarea
                                    {...register('address')}
                                    placeholder="Complete Address (Optional)"
                                    rows={3}
                                    aria-invalid={!!(formErrors.address || errors.address)}
                                />
                                <FieldError errors={[{ message: formErrors.address?.message || errors.address }]} />
                                <p className="text-[0.75rem] text-muted-foreground mt-1">Optional - patient's complete address</p>
                            </Field>

                            {/* Summary Preview */}
                            <div className="rounded-lg border bg-muted/50 p-4 mt-4">
                                <h4 className="font-medium mb-2">Registration Summary</h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="text-muted-foreground">Name:</div>
                                    <div>{watch('fname')} {watch('mname') || ''} {watch('lname')}</div>
                                    <div className="text-muted-foreground">Gender:</div>
                                    <div>{watch('gender') || '-'}</div>
                                    <div className="text-muted-foreground">Date of Birth:</div>
                                    <div>{dateOfBirth ? new Date(dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</div>
                                    <div className="text-muted-foreground">Email:</div>
                                    <div>{watch('email') || '-'}</div>
                                    <div className="text-muted-foreground">Phone:</div>
                                    <div>{watch('contact_number') || '-'}</div>
                                </div>
                            </div>
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
                                        Register Patient
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
