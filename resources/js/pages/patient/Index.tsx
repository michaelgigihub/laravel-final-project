import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { CalendarPlus, Eye, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { RegisterPatientDialog } from '@/components/RegisterPatientDialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

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

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

interface PatientsIndexProps {
    patients: PaginatedData<Patient>;
    filters: {
        search: string;
        gender: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Patients', href: '/patients' },
];

export default function PatientsIndex({ patients, filters }: PatientsIndexProps) {
    const handleFilterChange = (key: 'gender', value: string) => {
        const newValue = value === 'all' ? '' : value;
        router.get('/patients', { search: filters.search, [key]: newValue }, { preserveState: true, preserveScroll: true });
    };

    const handleClearFilters = () => {
        router.get('/patients', {}, { preserveState: true, preserveScroll: true });
    };

    const hasFilters = filters.search || filters.gender;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getFullName = (patient: Patient) => {
        const parts = [patient.fname, patient.mname, patient.lname].filter(Boolean);
        return parts.join(' ');
    };

    const columns = [
        { accessorKey: 'id', header: 'ID' },
        { 
            accessorKey: 'name', 
            header: 'Name',
            cell: ({ row }: { row: { original: Patient } }) => (
                <span className="font-medium">{getFullName(row.original)}</span>
            ),
        },
        {
            accessorKey: 'gender',
            header: 'Gender',
            cell: ({ row }: { row: { original: Patient } }) => (
                <Badge variant="secondary">{row.original.gender}</Badge>
            ),
        },
        {
            accessorKey: 'date_of_birth',
            header: 'Date of Birth',
            cell: ({ row }: { row: { original: Patient } }) => formatDate(row.original.date_of_birth),
        },
        {
            accessorKey: 'contact_number',
            header: 'Contact',
            cell: ({ row }: { row: { original: Patient } }) => row.original.contact_number || '-',
        },
        {
            accessorKey: 'email',
            header: 'Email',
            cell: ({ row }: { row: { original: Patient } }) => row.original.email || '-',
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }: { row: { original: Patient } }) => (
                <div className="flex justify-center gap-1">
                    <Link
                        href={`/patients/${row.original.id}`}
                        className="inline-flex items-center justify-center rounded-md p-2 text-blue-600 hover:bg-blue-50 hover:text-blue-800 dark:text-blue-400 dark:hover:bg-blue-950 dark:hover:text-blue-300 transition-colors"
                        title="View patient details"
                    >
                        <Eye className="size-4" />
                    </Link>
                    <Link
                        href={`/appointments/create?patient_id=${row.original.id}`}
                        className="inline-flex items-center justify-center rounded-md p-2 text-green-600 hover:bg-green-50 hover:text-green-800 dark:text-green-400 dark:hover:bg-green-950 dark:hover:text-green-300 transition-colors"
                        title="Book appointment"
                    >
                        <CalendarPlus className="size-4" />
                    </Link>
                </div>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Patients" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Patients</h1>
                        <p className="text-sm text-muted-foreground">
                            Manage patient records and view medical history
                        </p>
                    </div>
                    <RegisterPatientDialog />
                </div>

                {/* Table with Column Visibility */}
                <div className="relative flex-1 overflow-hidden rounded-xl border border-brand-dark/20 bg-card shadow-[0_22px_48px_-30px_rgba(38,41,47,0.6)] transition-shadow dark:border-brand-light/20 dark:bg-card/60 dark:shadow-[0_18px_42px_-28px_rgba(8,9,12,0.78)]">
                    <div className="h-full overflow-auto p-4">
                        <DataTable 
                            columns={columns} 
                            data={patients.data} 
                            customToolbar={
                                <>
                                    <Select
                                        value={filters.gender || 'all'}
                                        onValueChange={(value) => handleFilterChange('gender', value)}
                                    >
                                        <SelectTrigger className="w-[130px]">
                                            <SelectValue placeholder="All Genders" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Genders</SelectItem>
                                            <SelectItem value="Male">Male</SelectItem>
                                            <SelectItem value="Female">Female</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {hasFilters && (
                                        <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                                            <X className="size-4 mr-1" />
                                            Clear
                                        </Button>
                                    )}
                                </>
                            }
                        />
                    </div>
                </div>

                {/* Pagination */}
                {patients.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Showing {patients.from} to {patients.to} of {patients.total} patients
                        </p>
                        <div className="flex gap-2">
                            {patients.links.map((link, index) => (
                                <Button
                                    key={index}
                                    variant={link.active ? 'default' : 'outline'}
                                    size="sm"
                                    disabled={!link.url}
                                    onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
