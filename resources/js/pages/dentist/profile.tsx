import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Calendar } from '@/components/ui/calendar';
import { Spinner } from '@/components/ui/spinner';
import { Check, ChevronsUpDown, X, CalendarIcon } from 'lucide-react';
import type { DentistProfileProps } from '@/types';
import { Head, useForm, router } from '@inertiajs/react';
import {
    Award,
    Briefcase,
    CalendarDays,
    Mail,
    Phone,
    Shield,
    User,
    Pencil,
    Camera,
    Save,
    XCircle,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import admin from '@/routes/admin';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ImageCropDialog } from '@/components/ImageCropDialog';

// Define strict types for props since we are adding new ones
interface ExtendedDentistProfileProps extends DentistProfileProps {
    specializations: Array<{ id: number; name: string }>;
}

function formatDateForInput(date: Date | undefined) {
    if (!date) {
        return "";
    }
    return date.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

function isValidDate(date: Date | undefined) {
    if (!date) {
        return false;
    }
    return !isNaN(date.getTime());
}

interface DatePickerWithInputProps {
    value: string | undefined;
    onChange: (date: string) => void;
    className?: string;
    error?: string;
}

function DatePickerWithInput({ value: initialValue, onChange, className, error }: DatePickerWithInputProps) {
    const [open, setOpen] = useState(false);
    
    // Parse initial value (YYYY-MM-DD) to Date
    const initialDate = useMemo(() => initialValue ? new Date(initialValue) : undefined, [initialValue]);
    
    const [date, setDate] = useState<Date | undefined>(initialDate);
    const [month, setMonth] = useState<Date | undefined>(initialDate);
    const [inputValue, setInputValue] = useState(formatDateForInput(initialDate));

    // Sync with external value changes
    useMemo(() => {
         const d = initialValue ? new Date(initialValue) : undefined;
         setDate(d);
         if (d) setMonth(d);
         setInputValue(formatDateForInput(d));
    }, [initialValue]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
        const newDate = new Date(e.target.value);
        if (isValidDate(newDate)) {
            setDate(newDate);
            setMonth(newDate);
            // Use date-fns format to preserve local timezone
            onChange(format(newDate, 'yyyy-MM-dd'));
        }
    };

    const handleCalendarSelect = (newDate: Date | undefined) => {
        setDate(newDate);
        setInputValue(formatDateForInput(newDate));
        setOpen(false);
        if (newDate) {
             // Use date-fns format to preserve local timezone
             onChange(format(newDate, 'yyyy-MM-dd'));
        } else {
             onChange('');
        }
    };

    return (
        <div className={className}>
            <div className="relative flex gap-2">
                <Input
                    value={inputValue}
                    placeholder="Select date"
                    className={`bg-background pr-10 ${error ? 'border-red-500' : ''}`}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                        if (e.key === "ArrowDown") {
                            e.preventDefault();
                            setOpen(true);
                        }
                    }}
                />
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
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
                            selected={date}
                            captionLayout="dropdown"
                            month={month}
                            onMonthChange={setMonth}
                            onSelect={handleCalendarSelect}
                        />
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
}

export default function DentistProfile({
    dentist,
    viewMode,
    specializations = [], // Default to empty if not passed
}: ExtendedDentistProfileProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [cropDialogOpen, setCropDialogOpen] = useState(false);
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);

    const breadcrumbs: BreadcrumbItem[] = useMemo(() => {
        const items: BreadcrumbItem[] = [
            {
                title: 'Dashboard',
                href: viewMode === 'self' ? '/dentist/dashboard' : dashboard().url,
            },
        ];

        if (viewMode === 'admin') {
            items.push({
                title: 'Dentists',
                href: admin.dentists.index().url,
            });
            items.push({
                title: 'Profile',
                href: '',
            });
        } else {
            items.push({
                title: 'My Profile',
                href: '',
            });
        }
        return items;
    }, [viewMode]);

    const { data, setData, errors, reset } = useForm({
        fname: dentist.fname,
        mname: dentist.mname || '',
        lname: dentist.lname,
        gender: dentist.gender,
        email: dentist.email,
        contact_number: dentist.contact_number || '',
        employment_status: dentist.employment_status || 'Active',
        hire_date: dentist.hire_date ? format(new Date(dentist.hire_date), 'yyyy-MM-dd') : '',
        specialization_ids: dentist.specializations.map((s) => s.id),
    });

    const getInitials = () => {
        const firstInitial = dentist.fname.charAt(0).toUpperCase();
        const lastInitial = dentist.lname.charAt(0).toUpperCase();
        return `${firstInitial}${lastInitial}`;
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        // Use different endpoint based on viewMode
        const endpoint = viewMode === 'admin' 
            ? `/admin/dentists/${dentist.id}` 
            : '/dentist/profile';
        
        // Use FormData for file uploads
        const formData = new FormData();
        formData.append('_method', 'PUT');
        formData.append('fname', data.fname);
        formData.append('mname', data.mname || '');
        formData.append('lname', data.lname);
        formData.append('gender', data.gender);
        formData.append('contact_number', data.contact_number || '');
        
        if (viewMode === 'admin') {
            formData.append('email', data.email);
            formData.append('employment_status', data.employment_status || '');
            formData.append('hire_date', data.hire_date || '');
            data.specialization_ids.forEach((id, index) => {
                formData.append(`specialization_ids[${index}]`, id.toString());
            });
        }
        
        if (avatarFile) {
            formData.append('avatar', avatarFile);
        }
        
        router.post(endpoint, formData, {
            preserveScroll: true,
            onSuccess: () => {
                setIsSubmitting(false);
                setIsEditing(false);
                setAvatarFile(null);
                setAvatarPreview(null);
                toast.success('Profile updated successfully', {
                    description: 'The profile has been saved.',
                });
            },
            onError: () => {
                setIsSubmitting(false);
                toast.error('Failed to update profile', {
                    description: 'Please check the form for errors and try again.',
                });
            },
        });
    };

    const handleCancel = () => {
        reset();
        setAvatarFile(null);
        setAvatarPreview(null);
        setImageToCrop(null);
        setIsEditing(false);
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Read the file and open the crop dialog
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageToCrop(reader.result as string);
                setCropDialogOpen(true);
            };
            reader.readAsDataURL(file);
        }
        // Reset input so the same file can be selected again
        e.target.value = '';
    };

    const handleCropComplete = (croppedBlob: Blob) => {
        // Convert blob to file
        const croppedFile = new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' });
        setAvatarFile(croppedFile);
        // Create preview from blob
        const previewUrl = URL.createObjectURL(croppedBlob);
        setAvatarPreview(previewUrl);
        setImageToCrop(null);
    };

    const toggleSpecialization = (id: number) => {
         const current = data.specialization_ids;
         if (current.includes(id)) {
             setData('specialization_ids', current.filter(i => i !== id));
         } else {
             setData('specialization_ids', [...current, id]);
         }
    };

    const filteredSpecializations = useMemo(() => {
        return specializations.filter((s) =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [specializations, searchQuery]);

    const pageTitle =
        viewMode === 'admin'
            ? `Dentist Profile - ${dentist.name}`
            : 'My Profile';
    const pageDescription =
        viewMode === 'admin'
            ? 'View dentist information and details'
            : 'View and manage your personal information';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={pageTitle} />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-hidden rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{pageTitle}</h1>
                        <p className="text-sm text-muted-foreground">{pageDescription}</p>
                    </div>
                    {(viewMode === 'admin' || viewMode === 'self') && (
                        <div className="flex gap-2">
                            {isEditing ? (
                                <>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleCancel}
                                        disabled={isSubmitting}
                                    >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        form="profile-form"
                                        disabled={isSubmitting}
                                        className="min-w-[120px]"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Spinner className="mr-2 h-4 w-4" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="mr-2 h-4 w-4" />
                                                Save Changes
                                            </>
                                        )}
                                    </Button>
                                </>
                            ) : (
                                <Button onClick={() => setIsEditing(true)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit Profile
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                <div className="relative flex-1 overflow-hidden rounded-xl border border-brand-dark/20 bg-card shadow-[0_22px_48px_-30px_rgba(38,41,47,0.6)] transition-shadow dark:border-brand-light/20 dark:bg-card/60 dark:shadow-[0_18px_42px_-28px_rgba(8,9,12,0.78)]">
                    <div className="h-full overflow-y-auto p-6">
                        <form id="profile-form" onSubmit={handleSave}>
                    <div className="grid gap-6 md:grid-cols-3">
                        {/* Profile Summary Card */}
                        <Card className="md:col-span-1 h-full">
                            <CardContent className="pt-6">
                                <div className="flex flex-col items-center text-center">
                                <div className="relative mb-4">
                                    <Avatar className="h-32 w-32">
                                        <AvatarImage
                                            src={avatarPreview || dentist.avatar_url || undefined}
                                            alt={dentist.name}
                                        />
                                        <AvatarFallback className="text-2xl">
                                            {getInitials()}
                                        </AvatarFallback>
                                    </Avatar>
                                    {isEditing && (
                                        <label
                                            htmlFor="avatar-upload"
                                            className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
                                            title="Change profile picture"
                                        >
                                            <Camera className="h-4 w-4" />
                                            <input
                                                id="avatar-upload"
                                                type="file"
                                                accept="image/jpeg,image/jpg,image/png,image/gif"
                                                onChange={handleAvatarChange}
                                                className="sr-only"
                                            />
                                        </label>
                                    )}
                                </div>
                                    <h2 className="mb-1 text-2xl font-bold">
                                        {dentist.name}
                                    </h2>
                                    <Badge variant="secondary" className="mb-4">
                                        {dentist.role?.name || 'Dentist'}
                                    </Badge>
                                    {dentist.email_verified_at ? (
                                        <div className="flex items-center text-sm text-green-600">
                                            <Shield className="mr-1 h-4 w-4" />
                                            Email Verified
                                        </div>
                                    ) : (
                                        <div className="flex items-center text-sm text-yellow-600">
                                            <Shield className="mr-1 h-4 w-4" />
                                            Email Not Verified
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Personal Information */}
                        <Card className="md:col-span-2 h-full">
                            <CardHeader>
                                <CardTitle>Personal Information</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label className="flex items-center text-sm text-muted-foreground">
                                            <User className="mr-2 h-4 w-4" />
                                            First Name
                                        </Label>
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
                                            <p className="font-medium">{dentist.fname}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="flex items-center text-sm text-muted-foreground">
                                            <User className="mr-2 h-4 w-4" />
                                            Middle Name
                                        </Label>
                                        {isEditing ? (
                                             <>
                                                <Input
                                                    value={data.mname}
                                                    onChange={(e) => setData('mname', e.target.value)}
                                                    className={errors.mname ? 'border-red-500' : ''}
                                                />
                                                 {errors.mname && <span className="text-xs text-red-500">{errors.mname}</span>}
                                            </>
                                        ) : (
                                            dentist.mname && (
                                                 <p className="font-medium">{dentist.mname}</p>
                                            )
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="flex items-center text-sm text-muted-foreground">
                                            <User className="mr-2 h-4 w-4" />
                                            Last Name
                                        </Label>
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
                                            <p className="font-medium">{dentist.lname}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="flex items-center text-sm text-muted-foreground">
                                            <User className="mr-2 h-4 w-4" />
                                            Gender
                                        </Label>
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
                                            <p className="font-medium">{dentist.gender}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="flex items-center text-sm text-muted-foreground">
                                            <Mail className="mr-2 h-4 w-4" />
                                            Email
                                        </Label>
                                        {/* Identify if email is editable (usually yes for admins) */}
                                        <p className="font-medium">
                                            {dentist.email}
                                        </p>
                                        {/* Usually email change requires re-verification or special handling, but let's allow it if requested. User request: "Employment Status, Specializations, Hire Date, Contact Number, Gender, first name, last name". Email NOT listed. Keeping it read-only or just editable? User didn't list it. But UpdateDentistRequest validates it. I'll keep it read-only to be safe unless implied. The user list was explicit. */}
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="flex items-center text-sm text-muted-foreground">
                                            <Phone className="mr-2 h-4 w-4" />
                                            Contact Number
                                        </Label>
                                        {isEditing ? (
                                            <>
                                                <Input
                                                    value={data.contact_number}
                                                    onChange={(e) => setData('contact_number', e.target.value)}
                                                    className={errors.contact_number ? 'border-red-500' : ''}
                                                />
                                                {errors.contact_number && <span className="text-xs text-red-500">{errors.contact_number}</span>}
                                            </>
                                        ) : (
                                           dentist.contact_number && <p className="font-medium">{dentist.contact_number}</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Professional Information */}
                        <Card className={viewMode === 'admin' ? "md:col-span-2 h-full" : "md:col-span-3 h-full"}>
                            <CardHeader>
                                <CardTitle>Professional Information</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label className="flex items-center text-sm text-muted-foreground">
                                            <Briefcase className="mr-2 h-4 w-4" />
                                            Employment Status
                                        </Label>
                                         {isEditing && viewMode === 'admin' ? (
                                            <>
                                                <Select
                                                    value={data.employment_status}
                                                    onValueChange={(val) => setData('employment_status', val)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select Status" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Active">Active</SelectItem>
                                                        <SelectItem value="Un-hire">Un-hire</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                {errors.employment_status && <span className="text-xs text-red-500">{errors.employment_status}</span>}
                                            </>
                                        ) : (
                                            <Badge variant="outline">
                                                {dentist.employment_status || 'N/A'}
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="flex items-center text-sm text-muted-foreground">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            Hire Date
                                        </Label>
                                         {isEditing && viewMode === 'admin' ? (
                                            <>
                                                <DatePickerWithInput
                                                    value={data.hire_date}
                                                    onChange={(date) => setData('hire_date', date)}
                                                    error={errors.hire_date}
                                                />
                                                 {errors.hire_date && <span className="text-xs text-red-500">{errors.hire_date}</span>}
                                            </>
                                        ) : (
                                            dentist.hire_date ? (
                                                <p className="font-medium">
                                                    {dentist.hire_date_formatted ||
                                                        formatDate(dentist.hire_date)}
                                                </p>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">Not set</p>
                                            )
                                        )}
                                    </div>

                                    <div className="space-y-2 col-span-1 md:col-span-2">
                                        <Label className="flex items-center text-sm text-muted-foreground">
                                            <Award className="mr-2 h-4 w-4" />
                                            Specializations
                                        </Label>
                                        
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {dentist.specializations.length > 0 || data.specialization_ids.length > 0 ? (
                                                specializations
                                                    .filter(s => data.specialization_ids.includes(s.id))
                                                    .map((spec) => {
                                                        // Check if this is a newly added specialization (not in original) - only relevant for admin editing
                                                        const isNewlyAdded = isEditing && viewMode === 'admin' && !dentist.specializations.some(s => s.id === spec.id);
                                                        
                                                        return (
                                                            <Badge
                                                                key={spec.id}
                                                                variant={isNewlyAdded ? "outline" : "secondary"}
                                                                className={`flex items-center gap-1 ${isNewlyAdded ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400' : ''}`}
                                                            >
                                                                {spec.name}
                                                                {isNewlyAdded && (
                                                                    <span className="text-[10px] font-normal opacity-75">(new)</span>
                                                                )}
                                                                {isEditing && viewMode === 'admin' && (
                                                                    <button
                                                                        type="button"
                                                                        className={`ml-1 rounded-full p-0.5 focus:outline-none ${isNewlyAdded ? 'hover:bg-green-200 hover:text-green-800 dark:hover:bg-green-800 dark:hover:text-green-200' : 'hover:bg-destructive/10 hover:text-destructive'}`}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            toggleSpecialization(spec.id);
                                                                        }}
                                                                    >
                                                                        <X className="h-3 w-3" />
                                                                    </button>
                                                                )}
                                                            </Badge>
                                                        );
                                                    })
                                            ) : (
                                                 <span className="text-sm text-muted-foreground">
                                                    No specializations assigned
                                                </span>
                                            )}
                                        </div>

                                        {isEditing && viewMode === 'admin' && (
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className="w-full justify-between hover:bg-transparent hover:text-foreground hover:border-input"
                                                    >
                                                        Add Specialization...
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[250px] p-0">
                                                    <div className="p-2">
                                                        <Input
                                                            placeholder="Search..."
                                                            value={searchQuery}
                                                            onChange={(e) => setSearchQuery(e.target.value)}
                                                            className="h-8 mb-2"
                                                        />
                                                        <div className="max-h-[200px] overflow-y-auto">
                                                            {filteredSpecializations.length === 0 ? (
                                                                <p className="p-2 text-sm text-muted-foreground text-center">No results found.</p>
                                                            ) : (
                                                                filteredSpecializations.map((spec) => (
                                                                    <div
                                                                        key={spec.id}
                                                                        className="flex items-center space-x-2 p-2 hover:bg-accent rounded-sm cursor-pointer"
                                                                        onClick={() => toggleSpecialization(spec.id)}
                                                                    >
                                                                        <div className={`flex h-4 w-4 items-center justify-center rounded-sm border border-primary ${data.specialization_ids.includes(spec.id) ? 'bg-primary text-primary-foreground' : 'opacity-50'}`}>
                                                                            {data.specialization_ids.includes(spec.id) && <Check className="h-3 w-3" />}
                                                                        </div>
                                                                        <span className="text-sm">{spec.name}</span>
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        )}
                                        {errors.specialization_ids && <span className="text-xs text-red-500">{errors.specialization_ids}</span>}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Admin-only: Additional Information */}
                        {viewMode === 'admin' && (
                            <Card className="md:col-span-1 h-full">
                                <CardHeader>
                                    <CardTitle>System Information</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-6 grid-cols-1">
                                        {dentist.created_at_formatted && (
                                            <div className="space-y-1">
                                                <div className="flex items-center text-sm text-muted-foreground">
                                                    <CalendarDays className="mr-2 h-4 w-4" />
                                                    Account Created
                                                </div>
                                                <p className="font-medium">
                                                    {dentist.created_at_formatted}
                                                </p>
                                            </div>
                                        )}

                                        {/* Password and Archive info - Read only */}
                                         {dentist.must_change_password !== undefined && (
                                            <div className="space-y-1">
                                                <div className="flex items-center text-sm text-muted-foreground">
                                                    <Shield className="mr-2 h-4 w-4" />
                                                    Password Status
                                                </div>
                                                <Badge variant={dentist.must_change_password ? 'destructive' : 'default'}>
                                                    {dentist.must_change_password ? 'Must Change Password' : 'Password Set'}
                                                </Badge>
                                            </div>
                                        )}
                                        
                                        {dentist.archived_at && (
                                            <div className="space-y-1">
                                                 <div className="flex items-center text-sm text-muted-foreground">
                                                    <CalendarDays className="mr-2 h-4 w-4" />
                                                    Archived At
                                                </div>
                                                <p className="font-medium text-red-600">
                                                    {formatDate(dentist.archived_at)}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                        

                    </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Image Crop Dialog */}
            {imageToCrop && (
                <ImageCropDialog
                    open={cropDialogOpen}
                    onOpenChange={setCropDialogOpen}
                    imageSrc={imageToCrop}
                    onCropComplete={handleCropComplete}
                />
            )}
        </AppLayout>
    );
}
