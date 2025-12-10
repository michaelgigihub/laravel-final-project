import { router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
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
import { CalendarCheck, ChevronLeft, ChevronRight, Check, CalendarIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface CreateAppointmentDialogProps {
    patients: Person[];
    dentists: Person[];
    treatmentTypes: TreatmentType[];
    trigger?: React.ReactNode;
    errors?: Record<string, string>;
}

const STEPS = [
    { id: 1, title: 'Patient', description: 'Select patient & dentist' },
    { id: 2, title: 'Schedule', description: 'Date & time' },
    { id: 3, title: 'Treatment', description: 'Services & review' },
];

export function CreateAppointmentDialog({
    patients = [],
    dentists = [],
    treatmentTypes = [],
    trigger,
    errors = {},
}: CreateAppointmentDialogProps) {
    const [open, setOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [patientId, setPatientId] = useState<string>('');
    const [dentistId, setDentistId] = useState<string>('');
    const [appointmentDate, setAppointmentDate] = useState<string>('');
    const [appointmentTime, setAppointmentTime] = useState<string>('');
    const [treatmentTypeIds, setTreatmentTypeIds] = useState<number[]>([]);
    const [purpose, setPurpose] = useState<string>('');

    // Form errors
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Date picker state
    const [dateOpen, setDateOpen] = useState(false);
    const [dateMonth, setDateMonth] = useState<Date>(new Date());

    const getFullName = (person: Person) => {
        return [person.fname, person.mname, person.lname].filter(Boolean).join(' ');
    };

    const toggleTreatmentType = (id: number) => {
        if (treatmentTypeIds.includes(id)) {
            setTreatmentTypeIds(treatmentTypeIds.filter((t) => t !== id));
        } else {
            setTreatmentTypeIds([...treatmentTypeIds, id]);
        }
    };

    const validateCurrentStep = (): boolean => {
        const newErrors: Record<string, string> = {};

        switch (currentStep) {
            case 1:
                if (!patientId) newErrors.patient_id = 'Please select a patient';
                if (!dentistId) newErrors.dentist_id = 'Please select a dentist';
                break;
            case 2:
                if (!appointmentDate) newErrors.appointment_date = 'Please select a date';
                if (!appointmentTime) newErrors.appointment_time = 'Please select a time';
                break;
            case 3:
                if (treatmentTypeIds.length === 0) newErrors.treatment_type_ids = 'Please select at least one treatment';
                break;
        }

        setFormErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateCurrentStep() && currentStep < 3) {
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
        setPatientId('');
        setDentistId('');
        setAppointmentDate('');
        setAppointmentTime('');
        setTreatmentTypeIds([]);
        setPurpose('');
        setFormErrors({});
    };

    const handleSubmit = () => {
        if (!validateCurrentStep()) return;

        setIsSubmitting(true);

        const appointmentDatetime = `${appointmentDate}T${appointmentTime}`;

        router.post('/appointments', {
            patient_id: patientId,
            dentist_id: dentistId,
            appointment_start_datetime: appointmentDatetime,
            treatment_type_ids: treatmentTypeIds,
            purpose_of_appointment: purpose,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsSubmitting(false);
                toast.success('Appointment scheduled successfully!', {
                    description: 'The appointment has been created.',
                });
                handleClose();
            },
            onError: (errs) => {
                setIsSubmitting(false);
                setFormErrors(errs as Record<string, string>);
                toast.error('Failed to schedule appointment', {
                    description: 'Please check the form for errors and try again.',
                });
            },
        });
    };

    const selectedPatient = patients.find(p => String(p.id) === patientId);
    const selectedDentist = dentists.find(d => String(d.id) === dentistId);

    const defaultTrigger = (
        <Button className="gap-2">
            <CalendarCheck className="size-4" />
            New Appointment
        </Button>
    );

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            if (!isOpen) handleClose();
            else setOpen(true);
        }}>
            <DialogTrigger asChild>
                {trigger || defaultTrigget}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Schedule New Appointment</DialogTitle>
                    <DialogDescription>
                        Fill in the details below to schedule an appointment.
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
                    {/* Step 1: Patient & Dentist Selection */}
                    {currentStep === 1 && (
                        <div className="space-y-4">
                            <FieldGroup className="grid grid-cols-1 gap-4">
                                <Field data-invalid={!!(formErrors.patient_id || errors.patient_id)}>
                                    <FieldLabel>Patient <span className="text-destructive">*</span></FieldLabel>
                                    <Select value={patientId} onValueChange={setPatientId}>
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
                                    <FieldError errors={[{ message: formErrors.patient_id || errors.patient_id }]} />
                                </Field>

                                <Field data-invalid={!!(formErrors.dentist_id || errors.dentist_id)}>
                                    <FieldLabel>Dentist <span className="text-destructive">*</span></FieldLabel>
                                    <Select value={dentistId} onValueChange={setDentistId}>
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
                                    <FieldError errors={[{ message: formErrors.dentist_id || errors.dentist_id }]} />
                                </Field>
                            </FieldGroup>
                        </div>
                    )}

                    {/* Step 2: Date & Time */}
                    {currentStep === 2 && (
                        <div className="space-y-4">
                            <FieldGroup className="grid grid-cols-1 gap-4">
                                <Field data-invalid={!!(formErrors.appointment_date || errors.appointment_start_datetime)}>
                                    <FieldLabel>Appointment Date <span className="text-destructive">*</span></FieldLabel>
                                    <div className="relative">
                                        <Input
                                            value={appointmentDate ? new Date(appointmentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                                            placeholder="Select date"
                                            className="bg-background pr-10"
                                            readOnly
                                            onClick={() => setDateOpen(true)}
                                        />
                                        <Popover open={dateOpen} onOpenChange={setDateOpen}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    className="absolute top-1/2 right-2 size-6 -translate-y-1/2 p-0 h-auto w-auto hover:bg-transparent"
                                                >
                                                    <CalendarIcon className="size-4 text-muted-foreground hover:text-foreground transition-colors" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto overflow-hidden p-0" align="end">
                                                <Calendar
                                                    mode="single"
                                                    selected={appointmentDate ? new Date(appointmentDate) : undefined}
                                                    captionLayout="dropdown"
                                                    month={dateMonth}
                                                    onMonthChange={setDateMonth}
                                                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                                    onSelect={(date) => {
                                                        if (date) {
                                                            setAppointmentDate(date.toISOString().split('T')[0]);
                                                        }
                                                        setDateOpen(false);
                                                    }}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <FieldError errors={[{ message: formErrors.appointment_date || errors.appointment_start_datetime }]} />
                                </Field>

                                <Field data-invalid={!!(formErrors.appointment_time)}>
                                    <FieldLabel>Appointment Time <span className="text-destructive">*</span></FieldLabel>
                                    <div className="relative">
                                        <Input
                                            type="time"
                                            value={appointmentTime}
                                            onChange={(e) => setAppointmentTime(e.target.value)}
                                            className="bg-background"
                                        />
                                        <Clock className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                                    </div>
                                    <FieldError errors={[{ message: formErrors.appointment_time }]} />
                                </Field>
                            </FieldGroup>
                        </div>
                    )}

                    {/* Step 3: Treatments & Review */}
                    {currentStep === 3 && (
                        <div className="space-y-4">
                            <Field data-invalid={!!(formErrors.treatment_type_ids || errors.treatment_type_ids)}>
                                <FieldLabel>Treatment Types <span className="text-destructive">*</span></FieldLabel>
                                <div className="grid grid-cols-2 gap-2 p-3 border rounded-md max-h-[150px] overflow-y-auto">
                                    {treatmentTypes.map((treatment) => (
                                        <div key={treatment.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`treatment-${treatment.id}`}
                                                checked={treatmentTypeIds.includes(treatment.id)}
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
                                <FieldError errors={[{ message: formErrors.treatment_type_ids || errors.treatment_type_ids }]} />
                            </Field>

                            <Field>
                                <FieldLabel>Purpose (Optional)</FieldLabel>
                                <Textarea
                                    value={purpose}
                                    onChange={(e) => setPurpose(e.target.value)}
                                    placeholder="Brief description of the appointment purpose..."
                                    rows={2}
                                />
                            </Field>

                            {/* Summary Preview */}
                            <div className="rounded-lg border bg-muted/50 p-4 mt-4">
                                <h4 className="font-medium mb-2">Appointment Summary</h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="text-muted-foreground">Patient:</div>
                                    <div>{selectedPatient ? getFullName(selectedPatient) : '-'}</div>
                                    <div className="text-muted-foreground">Dentist:</div>
                                    <div>{selectedDentist ? getFullName(selectedDentist) : '-'}</div>
                                    <div className="text-muted-foreground">Date:</div>
                                    <div>{appointmentDate ? new Date(appointmentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</div>
                                    <div className="text-muted-foreground">Time:</div>
                                    <div>{appointmentTime || '-'}</div>
                                    <div className="text-muted-foreground">Treatments:</div>
                                    <div>{treatmentTypes.filter(t => treatmentTypeIds.includes(t.id)).map(t => t.name).join(', ') || '-'}</div>
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
                        
                        {currentStep < 3 ? (
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
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="min-w-[160px]"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Spinner className="mr-2 size-4" />
                                        Scheduling...
                                    </>
                                ) : (
                                    <>
                                        <Check className="size-4 mr-1" />
                                        Schedule Appointment
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
