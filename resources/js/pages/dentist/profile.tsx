import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DentistProfileProps } from '@/types';
import { Head, Link } from '@inertiajs/react';
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
} from 'lucide-react';

export default function DentistProfile({
    dentist,
    viewMode,
}: DentistProfileProps) {
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
                <div className="mb-6">
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
                                <div className="space-y-1">
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <User className="mr-2 h-4 w-4" />
                                        First Name
                                    </div>
                                    <p className="font-medium">
                                        {dentist.fname}
                                    </p>
                                </div>

                                {dentist.mname && (
                                    <div className="space-y-1">
                                        <div className="flex items-center text-sm text-muted-foreground">
                                            <User className="mr-2 h-4 w-4" />
                                            Middle Name
                                        </div>
                                        <p className="font-medium">
                                            {dentist.mname}
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-1">
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <User className="mr-2 h-4 w-4" />
                                        Last Name
                                    </div>
                                    <p className="font-medium">
                                        {dentist.lname}
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <User className="mr-2 h-4 w-4" />
                                        Gender
                                    </div>
                                    <p className="font-medium">
                                        {dentist.gender}
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <Mail className="mr-2 h-4 w-4" />
                                        Email
                                    </div>
                                    <p className="font-medium">
                                        <a
                                            href={`mailto:${dentist.email}`}
                                            className="text-blue-600 hover:underline"
                                        >
                                            {dentist.email}
                                        </a>
                                    </p>
                                </div>

                                {dentist.contact_number && (
                                    <div className="space-y-1">
                                        <div className="flex items-center text-sm text-muted-foreground">
                                            <Phone className="mr-2 h-4 w-4" />
                                            Contact Number
                                        </div>
                                        <p className="font-medium">
                                            {dentist.contact_number}
                                        </p>
                                    </div>
                                )}
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
                                <div className="space-y-1">
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <Briefcase className="mr-2 h-4 w-4" />
                                        Employment Status
                                    </div>
                                    <Badge variant="outline">
                                        {dentist.employment_status || 'N/A'}
                                    </Badge>
                                </div>

                                {dentist.hire_date && (
                                    <div className="space-y-1">
                                        <div className="flex items-center text-sm text-muted-foreground">
                                            <Calendar className="mr-2 h-4 w-4" />
                                            Hire Date
                                        </div>
                                        <p className="font-medium">
                                            {dentist.hire_date_formatted ||
                                                formatDate(dentist.hire_date)}
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-1">
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <Award className="mr-2 h-4 w-4" />
                                        Specializations
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {dentist.specializations.length > 0 ? (
                                            dentist.specializations.map(
                                                (spec) => (
                                                    <Badge
                                                        key={spec.id}
                                                        variant="secondary"
                                                    >
                                                        {spec.name}
                                                    </Badge>
                                                ),
                                            )
                                        ) : (
                                            <span className="text-sm text-muted-foreground">
                                                No specializations assigned
                                            </span>
                                        )}
                                    </div>
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

                                    {dentist.must_change_password !==
                                        undefined && (
                                        <div className="space-y-1">
                                            <div className="flex items-center text-sm text-muted-foreground">
                                                <Shield className="mr-2 h-4 w-4" />
                                                Password Status
                                            </div>
                                            <Badge
                                                variant={
                                                    dentist.must_change_password
                                                        ? 'destructive'
                                                        : 'default'
                                                }
                                            >
                                                {dentist.must_change_password
                                                    ? 'Must Change Password'
                                                    : 'Password Set'}
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
                                                {formatDate(
                                                    dentist.archived_at,
                                                )}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </>
    );
}
