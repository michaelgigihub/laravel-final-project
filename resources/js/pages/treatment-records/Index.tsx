import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { DatePicker } from '@/components/ui/date-picker';
import { format } from 'date-fns';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Eye, MoreHorizontal, X } from 'lucide-react';

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
    const handleFilterChange = (key: keyof Filters, value: string) => {
        const newValue = value === 'all' ? '' : value;
        router.get('/treatment-records', { ...filters, [key]: newValue }, { preserveState: true });
    };

    const handleClearFilters = () => {
        router.get('/treatment-records', {}, { preserveState: true });
    };

    const hasFilters = filters.search || filters.date_from || filters.date_to || filters.dentist_id || filters.treatment_type_id;

    const columns = [
        {
            accessorKey: 'appointment_id',
            header: 'Appt ID',
            cell: ({ row }: { row: { original: TreatmentRecordItem } }) => (
                <span className="text-muted-foreground">#{row.original.appointment_id}</span>
            ),
        },
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
            header: () => <div className="text-center">Actions</div>,
            cell: ({ row }: { row: { original: TreatmentRecordItem } }) => (
                <div className="flex justify-center">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                                <Link href={`/appointments/${row.original.appointment_id}/treatment-records/${row.original.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
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

                {/* Table with Column Visibility */}
                <div className="relative flex-1 overflow-hidden rounded-xl border border-brand-dark/20 bg-card shadow-[0_22px_48px_-30px_rgba(38,41,47,0.6)] transition-shadow dark:border-brand-light/20 dark:bg-card/60 dark:shadow-[0_18px_42px_-28px_rgba(8,9,12,0.78)]">
                    <div className="h-full overflow-auto p-4">
                        <DataTable 
                            columns={columns} 
                            data={records.data}
                            customToolbar={
                                <>
                                    <div className="flex gap-2 items-center">
                                        <DatePicker
                                            value={filters.date_from}
                                            onChange={(date) => handleFilterChange('date_from', date ? format(date, 'yyyy-MM-dd') : '')}
                                            placeholder="From date"
                                            className="w-[180px]"
                                            maxDate={filters.date_to ? new Date(filters.date_to) : undefined}
                                        />
                                        <span className="text-muted-foreground text-sm">to</span>
                                        <DatePicker
                                            value={filters.date_to}
                                            onChange={(date) => handleFilterChange('date_to', date ? format(date, 'yyyy-MM-dd') : '')}
                                            placeholder="To date"
                                            className="w-[180px]"
                                            minDate={filters.date_from ? new Date(filters.date_from) : undefined}
                                        />
                                    </div>
                                    <Select
                                        value={filters.dentist_id || 'all'}
                                        onValueChange={(value) => handleFilterChange('dentist_id', value)}
                                    >
                                        <SelectTrigger className="w-[150px]">
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
                                    <Select
                                        value={filters.treatment_type_id || 'all'}
                                        onValueChange={(value) => handleFilterChange('treatment_type_id', value)}
                                    >
                                        <SelectTrigger className="w-[200px]">
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
