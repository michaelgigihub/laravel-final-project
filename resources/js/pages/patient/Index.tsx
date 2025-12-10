import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Eye, Search } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RegisterPatientDialog } from '@/components/RegisterPatientDialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

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
    const [search, setSearch] = useState(filters.search || '');
    const [gender, setGender] = useState(filters.gender || '');

    const handleSearch = () => {
        router.get('/patients', { search, gender }, { preserveState: true, preserveScroll: true });
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleGenderChange = (value: string) => {
        const newGender = value === 'all' ? '' : value;
        setGender(newGender);
        router.get('/patients', { search, gender: newGender }, { preserveState: true, preserveScroll: true });
    };

    const clearFilters = () => {
        setSearch('');
        setGender('');
        router.get('/patients', {}, { preserveState: true, preserveScroll: true });
    };

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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Patients" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Patients</h1>
                        <p className="text-sm text-muted-foreground">
                            Manage patient records and view medical history
                        </p>
                    </div>
                    <RegisterPatientDialog />
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="relative flex-1 sm:max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, email, or phone..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={handleKeyPress}
                            className="pl-8"
                        />
                    </div>
                    <Select value={gender || 'all'} onValueChange={handleGenderChange}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Gender" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Genders</SelectItem>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={handleSearch}>
                        Search
                    </Button>
                    {(filters.search || filters.gender) && (
                        <Button variant="ghost" onClick={clearFilters}>
                            Clear
                        </Button>
                    )}
                </div>

                {/* Table */}
                <div className="relative flex-1 overflow-hidden rounded-xl border border-brand-dark/20 bg-card shadow-[0_22px_48px_-30px_rgba(38,41,47,0.6)] transition-shadow dark:border-brand-light/20 dark:bg-card/60 dark:shadow-[0_18px_42px_-28px_rgba(8,9,12,0.78)]">
                    <div className="h-full overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Gender</TableHead>
                                    <TableHead>Date of Birth</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead className="text-center">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {patients.data.length > 0 ? (
                                    patients.data.map((patient) => (
                                        <TableRow key={patient.id}>
                                            <TableCell className="font-medium">{patient.id}</TableCell>
                                            <TableCell>{getFullName(patient)}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">{patient.gender}</Badge>
                                            </TableCell>
                                            <TableCell>{formatDate(patient.date_of_birth)}</TableCell>
                                            <TableCell>{patient.contact_number || '-'}</TableCell>
                                            <TableCell>{patient.email || '-'}</TableCell>
                                            <TableCell>
                                                <div className="flex justify-center">
                                                    <Link
                                                        href={`/patients/${patient.id}`}
                                                        className="inline-flex items-center justify-center rounded-md p-2 text-blue-600 hover:bg-blue-50 hover:text-blue-800 dark:text-blue-400 dark:hover:bg-blue-950 dark:hover:text-blue-300 transition-colors"
                                                        title="View patient details"
                                                    >
                                                        <Eye className="size-4" />
                                                    </Link>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">
                                            No patients found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
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
