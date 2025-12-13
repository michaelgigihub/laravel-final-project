import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Eye, FileText, Search, X } from 'lucide-react';
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
        router.get('/treatment-records', { ...filters, [key]: value }, { preserveState: true });
    };

    const handleClearFilters = () => {
        setSearch('');
        router.get('/treatment-records', {}, { preserveState: true });
    };

    const hasFilters = filters.search || filters.date_from || filters.date_to || filters.dentist_id || filters.treatment_type_id;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Treatment Records" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Treatment Records</h1>
                        <p className="text-sm text-muted-foreground">
                            View all completed treatment records
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="text-base">Filters</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-4 items-end">
                            {/* Search */}
                            <div className="flex gap-2 flex-1 min-w-[200px] max-w-xs">
                                <Input
                                    placeholder="Search patient name..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                                <Button onClick={handleSearch} size="icon" variant="outline">
                                    <Search className="size-4" />
                                </Button>
                            </div>

                            {/* Date Range */}
                            <div className="flex gap-2 items-center">
                                <Input
                                    type="date"
                                    value={filters.date_from}
                                    onChange={(e) => handleFilterChange('date_from', e.target.value)}
                                    className="w-[150px]"
                                />
                                <span className="text-muted-foreground">to</span>
                                <Input
                                    type="date"
                                    value={filters.date_to}
                                    onChange={(e) => handleFilterChange('date_to', e.target.value)}
                                    className="w-[150px]"
                                />
                            </div>

                            {/* Dentist Filter */}
                            <Select
                                value={filters.dentist_id}
                                onValueChange={(value) => handleFilterChange('dentist_id', value)}
                            >
                                <SelectTrigger className="w-[180px]">
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
                                value={filters.treatment_type_id}
                                onValueChange={(value) => handleFilterChange('treatment_type_id', value)}
                            >
                                <SelectTrigger className="w-[180px]">
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
                                <Button variant="ghost" onClick={handleClearFilters} size="sm">
                                    <X className="size-4 mr-1" />
                                    Clear
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Table */}
                <div className="relative flex-1 overflow-hidden rounded-xl border border-brand-dark/20 bg-card shadow-[0_22px_48px_-30px_rgba(38,41,47,0.6)] transition-shadow dark:border-brand-light/20 dark:bg-card/60 dark:shadow-[0_18px_42px_-28px_rgba(8,9,12,0.78)]">
                    <div className="h-full overflow-auto p-4">
                        {records.data.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Patient</TableHead>
                                        <TableHead>Dentist</TableHead>
                                        <TableHead>Treatment</TableHead>
                                        <TableHead>Appointment Date</TableHead>
                                        <TableHead>Notes</TableHead>
                                        <TableHead className="text-center">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {records.data.map((record) => (
                                        <TableRow key={record.id}>
                                            <TableCell className="font-medium">{record.patient_name}</TableCell>
                                            <TableCell>{record.dentist_name}</TableCell>
                                            <TableCell>{record.treatment_type}</TableCell>
                                            <TableCell>{record.appointment_date ?? '-'}</TableCell>
                                            <TableCell className="max-w-[200px] truncate">
                                                {record.treatment_notes || '-'}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Link href={`/appointments/${record.appointment_id}/treatment-records/${record.id}`}>
                                                    <Button size="sm" variant="ghost">
                                                        <Eye className="size-4" />
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
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
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Showing {records.from ?? 0} to {records.to ?? 0} of {records.total} results
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={records.current_page <= 1}
                                onClick={() => router.get('/treatment-records', { ...filters, page: records.current_page - 1 })}
                            >
                                <ChevronLeft className="size-4" />
                                Prev
                            </Button>
                            <div className="flex items-center gap-1">
                                {records.links
                                    .filter((link) => !link.label.includes('Previous') && !link.label.includes('Next'))
                                    .slice(0, 5)
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
                                disabled={records.current_page >= records.last_page}
                                onClick={() => router.get('/treatment-records', { ...filters, page: records.current_page + 1 })}
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
