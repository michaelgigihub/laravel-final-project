import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Eye, FileText, Search, X } from 'lucide-react';
import { useState } from 'react';

interface TreatmentRecordItem {
    id: number;
    appointment_id: number;
    patient_name: string;
    dentist_name: string;
    treatment_type: string;
    treatment_notes: string | null;
    appointment_date: string | null;
    created_at: string | null;
}

interface Dentist {
    id: number;
    name: string;
}

interface TreatmentType {
    id: number;
    name: string;
}

interface Filters {
    search: string;
    date_from: string;
    date_to: string;
    dentist_id: string;
    treatment_type_id: string;
}

interface PaginatedRecords {
    data: TreatmentRecordItem[];
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

interface IndexProps {
    records: PaginatedRecords;
    dentists: Dentist[];
    treatmentTypes: TreatmentType[];
    filters: Filters;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Treatment Records', href: '/treatment-records' },
];

export default function Index({ records, dentists, treatmentTypes, filters }: IndexProps) {
    const [search, setSearch] = useState(filters.search);

    const handleSearch = () => {
        router.get('/treatment-records', { ...filters, search }, { preserveState: true });
    };

    const handleFilterChange = (key: keyof Filters, value: string) => {
        const newValue = value === 'all' ? '' : value;
        router.get('/treatment-records', { ...filters, [key]: newValue }, { preserveState: true });
    };

    const handleClearFilters = () => {
        setSearch('');
        router.get('/treatment-records', {}, { preserveState: true });
    };

    const hasFilters = filters.search || filters.date_from || filters.date_to || filters.dentist_id || filters.treatment_type_id;

    const columns = [
        {
            accessorKey: 'patient_name',
            header: 'Patient',
            cell: ({ row }: { row: { original: TreatmentRecordItem } }) => (
                <span className="font-medium">{row.original.patient_name}</span>
            ),
        },
        {
            accessorKey: 'dentist_name',
            header: 'Dentist',
        },
        {
            accessorKey: 'treatment_type',
            header: 'Treatment',
        },
        {
            accessorKey: 'appointment_date',
            header: 'Appointment Date',
            cell: ({ row }: { row: { original: TreatmentRecordItem } }) => 
                row.original.appointment_date ?? '-',
        },
        {
            accessorKey: 'treatment_notes',
            header: 'Notes',
            cell: ({ row }: { row: { original: TreatmentRecordItem } }) => (
                <span className="max-w-[200px] truncate block">
                    {row.original.treatment_notes || '-'}
                </span>
            ),
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }: { row: { original: TreatmentRecordItem } }) => (
                <div className="flex justify-center">
                    <Link href={`/appointments/${row.original.appointment_id}/treatment-records/${row.original.id}`}>
                        <Button size="sm" variant="ghost">
                            <Eye className="size-4" />
                        </Button>
                    </Link>
                </div>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Treatment Records" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Treatment Records</h1>
                        <p className="text-sm text-muted-foreground">
                            View all completed treatment records
                        </p>
                    </div>
                </div>

                {/* Filters - matching DentistsTable style */}
                <div className="flex flex-wrap gap-3 items-center">
                    {/* Search */}
                    <div className="flex gap-2 flex-1 min-w-[200px] max-w-md">
                        <Input
                            placeholder="Search patient name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="flex-1"
                        />
                        <Button onClick={handleSearch} size="icon" variant="outline">
                            <Search className="size-4" />
                        </Button>
                    </div>

                    {/* Date Range */}
                    <div className="flex gap-2 items-center">
                        <DatePicker
                            value={filters.date_from}
                            onChange={(date) => handleFilterChange('date_from', date ? date.toISOString().split('T')[0] : '')}
                            placeholder="From date"
                            className="w-[180px]"
                        />
                        <span className="text-muted-foreground text-sm">to</span>
                        <DatePicker
                            value={filters.date_to}
                            onChange={(date) => handleFilterChange('date_to', date ? date.toISOString().split('T')[0] : '')}
                            placeholder="To date"
                            className="w-[180px]"
                        />
                    </div>

                    {/* Dentist Filter */}
                    <Select
                        value={filters.dentist_id || 'all'}
                        onValueChange={(value) => handleFilterChange('dentist_id', value)}
                    >
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="All Dentists" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Dentists</SelectItem>
                            {dentists.map((d) => (
                                <SelectItem key={d.id} value={d.id.toString()}>
                                    {d.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Treatment Type Filter */}
                    <Select
                        value={filters.treatment_type_id || 'all'}
                        onValueChange={(value) => handleFilterChange('treatment_type_id', value)}
                    >
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="All Treatments" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Treatments</SelectItem>
                            {treatmentTypes.map((t) => (
                                <SelectItem key={t.id} value={t.id.toString()}>
                                    {t.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Clear Filters */}
                    {hasFilters && (
                        <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                            <X className="size-4 mr-1" />
                            Clear
                        </Button>
                    )}
                </div>

                {/* Table with Column Visibility */}
                <div className="relative flex-1 overflow-hidden rounded-xl border border-brand-dark/20 bg-card shadow-[0_22px_48px_-30px_rgba(38,41,47,0.6)] transition-shadow dark:border-brand-light/20 dark:bg-card/60 dark:shadow-[0_18px_42px_-28px_rgba(8,9,12,0.78)]">
                    <div className="h-full overflow-auto p-4">
                        {records.data.length > 0 ? (
                            <DataTable columns={columns} data={records.data} />
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <FileText className="size-16 text-muted-foreground/50 mb-4" />
                                <h3 className="text-lg font-medium mb-1">No Treatment Records Found</h3>
                                <p className="text-muted-foreground">
                                    {hasFilters
                                        ? 'Try adjusting your filters to find what you\'re looking for.'
                                        : 'Treatment records will appear here after appointments are completed.'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Pagination */}
                {records.last_page > 1 && (
                    <div className="flex items-center justify-end gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={records.current_page <= 1}
                            onClick={() => router.get('/treatment-records', { ...filters, page: records.current_page - 1 })}
                        >
                            Previous
                        </Button>
                        <span className="text-sm text-muted-foreground px-2">
                            Page {records.current_page} of {records.last_page}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={records.current_page >= records.last_page}
                            onClick={() => router.get('/treatment-records', { ...filters, page: records.current_page + 1 })}
                        >
                            Next
                        </Button>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
