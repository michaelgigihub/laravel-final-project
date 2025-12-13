import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { RegisterDentistDialog } from '@/components/RegisterDentistDialog';
import AppLayout from '@/layouts/app-layout';
import admin from '@/routes/admin';
import { dashboard } from '@/routes';
import { type BreadcrumbItem, type Dentist } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Eye, Search, X } from 'lucide-react';
import { useState } from 'react';

interface Specialization {
    id: number;
    name: string;
}

interface PaginatedDentists {
    data: Dentist[];
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

interface Filters {
    search: string;
    status: string;
    specialization_id: string;
}

interface DentistsTableProps {
    dentists: PaginatedDentists;
    specializations?: Specialization[];
    filters?: Filters;
    errors?: Record<string, string>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Dentists', href: admin.dentists.index().url },
];

export default function DentistsTable({ 
    dentists, 
    specializations = [], 
    filters = { search: '', status: '', specialization_id: '' },
    errors = {} 
}: DentistsTableProps) {
    const [search, setSearch] = useState(filters.search);

    const handleSearch = () => {
        router.get('/admin/dentists', { ...filters, search }, { preserveState: true });
    };

    const handleFilterChange = (key: keyof Filters, value: string) => {
        router.get('/admin/dentists', { ...filters, [key]: value }, { preserveState: true });
    };

    const handleClearFilters = () => {
        setSearch('');
        router.get('/admin/dentists', {}, { preserveState: true });
    };

    const hasFilters = filters.search || filters.status || filters.specialization_id;

    const columns = [
        { accessorKey: 'dentist_id', header: 'ID' },
        {
            accessorKey: 'avatar_url',
            header: 'Photo',
            cell: ({ row }: { row: { original: Dentist } }) => {
                const initials = `${row.original.fname?.charAt(0) || ''}${row.original.lname?.charAt(0) || ''}`.toUpperCase();
                return (
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={row.original.avatar_url || undefined} alt={`${row.original.fname} ${row.original.lname}`} />
                        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                );
            },
        },
        { 
            accessorKey: 'name', 
            header: 'Name',
            cell: ({ row }: { row: { original: Dentist } }) => (
                <span className="font-medium">
                    {row.original.fname} {row.original.mname ? row.original.mname + ' ' : ''}{row.original.lname}
                </span>
            ),
        },
        {
            accessorKey: 'specialization',
            header: 'Specialization',
            cell: ({ row }: { row: { original: Dentist } }) => {
                const specs = row.original.specialization
                    ?.split(',')
                    .map((s) => s.trim())
                    .filter(Boolean);

                if (!specs || specs.length === 0) {
                    return <span className="text-muted-foreground">-</span>;
                }

                return (
                    <div className="flex flex-wrap gap-1">
                        {specs.map((spec, index) => (
                            <Badge key={index} variant="secondary">
                                {spec}
                            </Badge>
                        ))}
                    </div>
                );
            },
        },
        { accessorKey: 'contact_number', header: 'Contact' },
        { accessorKey: 'email', header: 'Email' },
        {
            accessorKey: 'employment_status',
            header: 'Status',
            cell: ({ row }: { row: { original: Dentist } }) => {
                const status = row.original.employment_status;
                const isActive = status?.toLowerCase() === 'active';

                const statusStyle = isActive
                    ? {
                          className: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
                          dotClass: 'bg-green-500',
                      }
                    : {
                          className: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700',
                          dotClass: 'bg-gray-500',
                      };

                return (
                    <div className="flex justify-center">
                        <div
                            className={`inline-flex h-7 items-center justify-center gap-2 rounded-full border px-3 text-xs font-semibold ${statusStyle.className}`}
                        >
                            <span className={`h-2 w-2 rounded-full ${statusStyle.dotClass}`} />
                            {status || 'Active'}
                        </div>
                    </div>
                );
            },
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }: { row: { original: Dentist } }) => (
                <div className="flex justify-center">
                    <Link
                        href={`/admin/dentists/${row.original.dentist_id}`}
                        className="inline-flex items-center justify-center rounded-md p-2 text-blue-600 hover:bg-blue-50 hover:text-blue-800 dark:text-blue-400 dark:hover:bg-blue-950 dark:hover:text-blue-300 transition-colors"
                        title="View dentist details"
                    >
                        <Eye className="size-4" />
                    </Link>
                </div>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dentists" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Dentists</h1>
                        <p className="text-sm text-muted-foreground">
                            Manage dentist profiles and credentials
                        </p>
                    </div>
                    <RegisterDentistDialog 
                        specializations={specializations} 
                        errors={errors} 
                    />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex gap-2 flex-1 min-w-[200px] max-w-md">
                        <Input
                            placeholder="Search by name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="flex-1"
                        />
                        <Button onClick={handleSearch} size="icon" variant="outline">
                            <Search className="size-4" />
                        </Button>
                    </div>

                    <Select
                        value={filters.status}
                        onValueChange={(value) => handleFilterChange('status', value)}
                    >
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Un-hire">Un-hired</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={filters.specialization_id}
                        onValueChange={(value) => handleFilterChange('specialization_id', value)}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="All Specializations" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Specializations</SelectItem>
                            {specializations.map((spec) => (
                                <SelectItem key={spec.id} value={spec.id.toString()}>
                                    {spec.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {hasFilters && (
                        <Button variant="ghost" onClick={handleClearFilters} size="sm">
                            <X className="size-4 mr-1" />
                            Clear
                        </Button>
                    )}
                </div>

                {/* Table */}
                <div className="relative flex-1 overflow-hidden rounded-xl border border-brand-dark/20 bg-card shadow-[0_22px_48px_-30px_rgba(38,41,47,0.6)] transition-shadow dark:border-brand-light/20 dark:bg-card/60 dark:shadow-[0_18px_42px_-28px_rgba(8,9,12,0.78)]">
                    <div className="h-full overflow-auto p-4">
                        <DataTable columns={columns} data={dentists.data} />
                    </div>
                </div>

                {/* Pagination */}
                {dentists.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Showing {dentists.from ?? 0} to {dentists.to ?? 0} of {dentists.total} results
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={dentists.current_page <= 1}
                                onClick={() => router.get('/admin/dentists', { ...filters, page: dentists.current_page - 1 })}
                            >
                                <ChevronLeft className="size-4" />
                                Prev
                            </Button>
                            <div className="flex items-center gap-1">
                                {dentists.links
                                    .filter((link) => !link.label.includes('Previous') && !link.label.includes('Next'))
                                    .map((link, index) => (
                                        <Button
                                            key={index}
                                            variant={link.active ? 'default' : 'outline'}
                                            size="sm"
                                            disabled={!link.url}
                                            onClick={() => link.url && router.visit(link.url)}
                                            className="min-w-[36px]"
                                        >
                                            {link.label}
                                        </Button>
                                    ))}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={dentists.current_page >= dentists.last_page}
                                onClick={() => router.get('/admin/dentists', { ...filters, page: dentists.current_page + 1 })}
                            >
                                Next
                                <ChevronRight className="size-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
