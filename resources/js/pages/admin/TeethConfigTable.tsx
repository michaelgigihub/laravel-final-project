import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { Pencil } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Teeth Config',
        href: '/admin/teeth',
    },
];

interface Tooth {
    id: number;
    name: string;
}

interface TeethConfigTableProps {
    teeth: Tooth[];
}

export default function TeethConfigTable({ teeth }: TeethConfigTableProps) {
    const { auth } = usePage<SharedData>().props;
    const user = auth.user;
    const [open, setOpen] = useState(false);
    const [editingTooth, setEditingTooth] = useState<Tooth | null>(null);
    const { data, setData, put, processing, errors, reset, clearErrors } =
        useForm({
            name: '',
        });

    const handleEdit = (tooth: Tooth) => {
        setEditingTooth(tooth);
        setData({ name: tooth.name });
        clearErrors();
        setOpen(true);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingTooth) {
            put(`/admin/teeth/${editingTooth.id}`, {
                onSuccess: () => {
                    setOpen(false);
                    reset();
                    setEditingTooth(null);
                },
            });
        }
    };

    const columns: ColumnDef<Tooth>[] = [
        {
            accessorKey: 'id',
            header: 'Tooth #',
            cell: ({ row }) => (
                <span className="font-mono text-muted-foreground">
                    {row.getValue('id')}
                </span>
            ),
        },
        {
            accessorKey: 'name',
            header: 'Tooth Name',
            cell: ({ row }) => (
                <span className="font-medium">{row.getValue('name')}</span>
            ),
        },
    ];

    // Only admins can edit
    if (user.role_id === 1) {
        columns.push({
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => {
                const tooth = row.original;
                return (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(tooth)}
                    >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                    </Button>
                );
            },
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Teeth Config" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Teeth Configuration
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Manage tooth names using dental nomenclature (e.g.,
                            Central Incisor, Molar)
                        </p>
                    </div>
                </div>
                <div className="relative flex-1 overflow-hidden rounded-xl border border-brand-dark/20 bg-card shadow-[0_22px_48px_-30px_rgba(38,41,47,0.6)] transition-shadow dark:border-brand-light/20 dark:bg-card/60 dark:shadow-[0_18px_42px_-28px_rgba(8,9,12,0.78)]">
                    <div className="h-full overflow-auto p-4">
                        <DataTable columns={columns} data={teeth} />
                    </div>
                </div>
            </div>

            {/* Edit Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Tooth Name</DialogTitle>
                        <DialogDescription>
                            Update the name for Tooth #{editingTooth?.id}. Use
                            dental nomenclature like "Upper Right Central
                            Incisor" or "Lower Left First Molar".
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submit}>
                        <div className="grid gap-4 py-4">
                            <FieldGroup>
                                <Field data-invalid={!!errors.name}>
                                    <FieldLabel>
                                        Tooth Name{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </FieldLabel>
                                    <Input
                                        value={data.name}
                                        onChange={(e) =>
                                            setData('name', e.target.value)
                                        }
                                        placeholder="e.g., Upper Right Central Incisor"
                                        required
                                    />
                                    <FieldError
                                        errors={[{ message: errors.name }]}
                                    />
                                </Field>
                            </FieldGroup>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setOpen(false)}
                                type="button"
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
