import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { RegisterDentistDialog } from '@/components/RegisterDentistDialog';
import AppLayout from '@/layouts/app-layout';
import admin from '@/routes/admin';
import { dashboard } from '@/routes';
import { type BreadcrumbItem, type Dentist } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Eye } from 'lucide-react';

interface Specialization {
    id: number;
    name: string;
}

interface DentistsTableProps {
    dentists: Dentist[];
    specializations?: Specialization[];
    errors?: Record<string, string>;
}

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

export default function DentistsTable({ dentists, specializations = [], errors = {} }: DentistsTableProps) {
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
                            <span
                                className={`h-2 w-2 rounded-full ${statusStyle.dotClass}`}
                            />
                            {status || 'Unknown'}
                        </div>
                    </div>
                );
            },
        },
        { accessorKey: 'hire_date', header: 'Hire Date' },
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
                <div className="relative flex-1 overflow-hidden rounded-xl border border-brand-dark/20 bg-card shadow-[0_22px_48px_-30px_rgba(38,41,47,0.6)] transition-shadow dark:border-brand-light/20 dark:bg-card/60 dark:shadow-[0_18px_42px_-28px_rgba(8,9,12,0.78)]">
                    <div className="h-full overflow-auto p-4">
                        <DataTable columns={columns} data={dentists} />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

