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
import { Check, ChevronsUpDown, X } from 'lucide-react';
import type { DentistProfileProps } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Award,
    Briefcase,
    Calendar,
    CalendarDays,
    Mail,
    Phone,
    Shield,
    User,
    Pencil,
    Save,
    XCircle,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { Label } from '@/components/ui/label';

// Define strict types for props since we are adding new ones
interface ExtendedDentistProfileProps extends DentistProfileProps {
    specializations: Array<{ id: number; name: string }>;
}

export default function DentistProfile({
    dentist,
    viewMode,
    specializations = [], // Default to empty if not passed
}: ExtendedDentistProfileProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const { data, setData, put, processing, errors, reset } = useForm({
        fname: dentist.fname,
        mname: dentist.mname || '',
        lname: dentist.lname,
        gender: dentist.gender,
        email: dentist.email,
        contact_number: dentist.contact_number || '',
        employment_status: dentist.employment_status || 'Active',
        hire_date: dentist.hire_date ? new Date(dentist.hire_date).toISOString().split('T')[0] : '',
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
        put(`/admin/dentists/${dentist.id}`, {
            onSuccess: () => setIsEditing(false),
        });
    };

    const handleCancel = () => {
        reset();
        setIsEditing(false);
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
        <>
            <Head title={pageTitle} />

            <div className="container mx-auto px-4 py-8">
                {/* Header with back button for admin */}
                <div className="mb-6 flex items-start justify-between">
                    <div>
                        {viewMode === 'admin' && (
                            <Link
                                href="/admin/dentists"
                                className="mb-4 inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Dentists List
                            </Link>
                        )}
                        <h1 className="text-3xl font-bold">{pageTitle}</h1>
                        <p className="text-muted-foreground">{pageDescription}</p>
                    </div>
                     {viewMode === 'admin' && !isEditing && (
                        <Button onClick={() => setIsEditing(true)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit Profile
                        </Button>
                    )}
                </div>

                <form onSubmit={handleSave}>
                    <div className="grid gap-6 md:grid-cols-3">
                        {/* Profile Summary Card */}
                        <Card className="md:col-span-1">
                            <CardContent className="pt-6">
                                <div className="flex flex-col items-center text-center">
                                    <Avatar className="mb-4 h-32 w-32">
                                        <AvatarImage
                                            src={dentist.avatar_url || undefined}
                                            alt={dentist.name}
                                        />
                                        <AvatarFallback className="text-2xl">
                                            {getInitials()}
                                        </AvatarFallback>
                                    </Avatar>
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
                        <Card className="md:col-span-2">
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
                                            <a
                                                href={`mailto:${dentist.email}`}
                                                className="text-blue-600 hover:underline"
                                            >
                                                {dentist.email}
                                            </a>
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
                        <Card className="md:col-span-3">
                            <CardHeader>
                                <CardTitle>Professional Information</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-6 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label className="flex items-center text-sm text-muted-foreground">
                                            <Briefcase className="mr-2 h-4 w-4" />
                                            Employment Status
                                        </Label>
                                         {isEditing ? (
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
                                            <Calendar className="mr-2 h-4 w-4" />
                                            Hire Date
                                        </Label>
                                         {isEditing ? (
                                            <>
                                                <Input
                                                    type="date"
                                                    value={data.hire_date}
                                                    onChange={(e) => setData('hire_date', e.target.value)}
                                                    className={errors.hire_date ? 'border-red-500' : ''}
                                                />
                                                 {errors.hire_date && <span className="text-xs text-red-500">{errors.hire_date}</span>}
                                            </>
                                        ) : (
                                            dentist.hire_date && (
                                                <p className="font-medium">
                                                    {dentist.hire_date_formatted ||
                                                        formatDate(dentist.hire_date)}
                                                </p>
                                            )
                                        )}
                                    </div>

                                    <div className="space-y-2 col-span-3 md:col-span-1">
                                        <Label className="flex items-center text-sm text-muted-foreground">
                                            <Award className="mr-2 h-4 w-4" />
                                            Specializations
                                        </Label>
                                        
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {dentist.specializations.length > 0 || data.specialization_ids.length > 0 ? (
                                                specializations
                                                    .filter(s => data.specialization_ids.includes(s.id))
                                                    .map((spec) => (
                                                        <Badge
                                                            key={spec.id}
                                                            variant="secondary"
                                                            className="flex items-center gap-1"
                                                        >
                                                            {spec.name}
                                                            {isEditing && (
                                                                <X
                                                                    className="h-3 w-3 cursor-pointer hover:text-red-500"
                                                                    onClick={() => toggleSpecialization(spec.id)} 
                                                                />
                                                            )}
                                                        </Badge>
                                                ))
                                            ) : (
                                                 !isEditing && <span className="text-sm text-muted-foreground">
                                                    No specializations assigned
                                                </span>
                                            )}
                                        </div>

                                        {isEditing && (
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className="w-full justify-between"
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
                            <Card className="md:col-span-3">
                                <CardHeader>
                                    <CardTitle>System Information</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-6 md:grid-cols-3">
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
                        
                        {isEditing && (
                            <div className="md:col-span-3 flex justify-end gap-2 fixed bottom-6 right-6 z-50">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="lg"
                                    onClick={handleCancel}
                                    disabled={processing}
                                    className="shadow-lg bg-background"
                                >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    size="lg"
                                    disabled={processing}
                                    className="shadow-lg"
                                >
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                </Button>
                            </div>
                        )}
                    </div>
                </form>
            </div>
        </>
    );
}
