import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import AppLayout from '@/layouts/app-layout';
import admin from '@/routes/admin';
import { dashboard } from '@/routes';
import { type BreadcrumbItem, type Dentist, type DentistsTableProps } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { UserPlus, Eye } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Dentists',
        href: admin.dentists.index().url,
    },
];

export default function DentistsTable({ dentists }: DentistsTableProps) {
    const columns = [
        { accessorKey: 'dentist_id', header: 'ID' },
        { accessorKey: 'fname', header: 'First Name' },
        { accessorKey: 'mname', header: 'Middle Name' },
        { accessorKey: 'lname', header: 'Last Name' },
        {
            accessorKey: 'specialization',
            header: 'Specialization',
            cell: ({ row }: { row: { original: Dentist } }) => {
                const specializations = row.original.specialization
                    ?.split(',')
                    .map((s) => s.trim())
                    .filter(Boolean);

                if (!specializations || specializations.length === 0) {
                    return <span className="text-muted-foreground">-</span>;
                }

                return (
                    <div className="flex flex-wrap gap-1">
                        {specializations.map((spec, index) => (
                            <Badge key={index} variant="secondary">
                                {spec}
                            </Badge>
                        ))}
                    </div>
                );
            },
        },
        { accessorKey: 'contact_number', header: 'Contact Number' },
        { accessorKey: 'email', header: 'Email' },
        {
            accessorKey: 'employment_status',
            header: 'Employment Status',
            cell: ({ row }: { row: { original: Dentist } }) => {
                const status = row.original.employment_status;
                const isActive = status?.toLowerCase() === 'active';

                return (
                    <Badge
                        variant={isActive ? 'default' : 'destructive'}
                        className={
                            isActive
                                ? 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800'
                                : ''
                        }
                    >
                        {status || 'Unknown'}
                    </Badge>
                );
            },
        },
        { accessorKey: 'hire_date', header: 'Hire Date' },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }: { row: { original: Dentist } }) => (
                <Link
                    href={`/admin/dentists/${row.original.dentist_id}`}
                    className="inline-flex items-center justify-center rounded-md p-2 text-blue-600 hover:bg-blue-50 hover:text-blue-800 dark:text-blue-400 dark:hover:bg-blue-950 dark:hover:text-blue-300 transition-colors"
                    title="View dentist details"
                >
                    <Eye className="size-4" />
                </Link>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dentists" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Dentists</h1>
                        <p className="text-sm text-muted-foreground">
                            Manage dentist profiles and credentials
                        </p>
                    </div>
                    <Button
                        onClick={() => router.visit('/admin/dentists/create')}
                        className="gap-2"
                    >
                        <UserPlus className="size-4" />
                        Register New Dentist
                    </Button>
                </div>
                <div className="relative flex-1 overflow-hidden rounded-xl border border-brand-dark/20 bg-card shadow-[0_22px_48px_-30px_rgba(38,41,47,0.6)] transition-shadow dark:border-brand-light/20 dark:bg-card/60 dark:shadow-[0_18px_42px_-28px_rgba(8,9,12,0.78)]">
                    <div className="h-full overflow-auto p-4">
                        <DataTable columns={columns} data={dentists} />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
