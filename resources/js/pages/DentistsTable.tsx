import type { Dentist, DentistsTableProps } from '@/types';
import { Link, router } from '@inertiajs/react';
import { DataTable } from '../components/ui/data-table';
import { ThemeToggle } from '../components/ui/theme-toggle';

export default function DentistsTable({ dentists }: DentistsTableProps) {
    const columns = [
        { accessorKey: 'dentist_id', header: 'ID' },
        { accessorKey: 'fname', header: 'First Name' },
        { accessorKey: 'mname', header: 'Middle Name' },
        { accessorKey: 'lname', header: 'Last Name' },
        { accessorKey: 'specialization', header: 'Specialization' },
        { accessorKey: 'contact_number', header: 'Contact Number' },
        { accessorKey: 'email', header: 'Email' },
        { accessorKey: 'employment_status', header: 'Employment Status' },
        { accessorKey: 'hire_date', header: 'Hire Date' },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }: { row: { original: Dentist } }) => (
                <Link
                    href={`/admin/dentists/${row.original.dentist_id}`}
                    className="text-blue-600 underline hover:text-blue-800"
                >
                    View
                </Link>
            ),
        },
    ];

    return (
        <div className="p-4">
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-2xl font-bold">Dentists</h1>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.visit('/admin/dentists/create')}
                        type="button"
                    >
                        + Register New Dentist
                    </button>
                    <ThemeToggle />
                </div>
            </div>
            <DataTable columns={columns} data={dentists} />
        </div>
    );
}
