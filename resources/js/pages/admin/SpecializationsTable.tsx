import { Button } from '@/components/ui/button';

import { DataTable } from '@/components/ui/data-table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import admin from '@/routes/admin';
import { dashboard } from '@/routes';
import { SharedData, type BreadcrumbItem, type Specialization } from '@/types';
import { Head, usePage, useForm } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Specializations',
        href: admin.specializations.index().url,
    },
];

interface SpecializationsTableProps {
    specializations: Specialization[];
}

export default function SpecializationsTable({
    specializations,
}: SpecializationsTableProps) {
    const { auth } = usePage<SharedData>().props;
    const user = auth.user;
    const [open, setOpen] = useState(false);
    
    // Initialize with one empty specialization input
    const { data, setData, post, processing, errors, reset } = useForm<{
        names: string[];
    }>({
        names: [''],
    });

    const columns = [
        { accessorKey: 'id', header: 'ID' },
        { accessorKey: 'name', header: 'Name' },
    ];

    const addField = () => {
        setData('names', [...data.names, '']);
    };

    const removeField = (index: number) => {
        const newNames = data.names.filter((_, i) => i !== index);
        setData('names', newNames);
    };

    const updateField = (index: number, value: string) => {
        const newNames = [...data.names];
        newNames[index] = value;
        setData('names', newNames);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(admin.specializations.store().url, {
            onSuccess: () => {
                setOpen(false);
                reset();
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Specializations" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Specializations
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Manage dental specializations
                        </p>
                    </div>
                    {user.role_id === 1 && (
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="size-4" />
                                Add Specialization
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Add Specialization</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={submit}>
                                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
                                    <FieldGroup>
                                        <FieldLabel>Names</FieldLabel>
                                        {data.names.map((name, index) => (
                                            <div key={index} className="flex gap-2 mb-2">
                                                <div className="flex-1">
                                                    <Input
                                                        value={name}
                                                        onChange={(e) =>
                                                            updateField(index, e.target.value)
                                                        }
                                                        placeholder="Specialization Name"
                                                        required
                                                    />
                                                    {errors[`names.${index}` as keyof typeof errors] && (
                                                        <p className="text-sm text-destructive mt-1">
                                                            {errors[`names.${index}` as keyof typeof errors]}
                                                        </p>
                                                    )}
                                                </div>
                                                {data.names.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeField(index)}
                                                        className="text-destructive hover:text-destructive/90"
                                                    >
                                                        <span className="sr-only">Remove</span>
                                                        &times;
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </FieldGroup>
                                    
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addField}
                                        className="w-full mt-2 gap-2"
                                    >
                                        <Plus className="size-3" />
                                        Add another
                                    </Button>
                                </div>
                                <div className="flex justify-end">
                                    <Button type="submit" disabled={processing}>
                                        {processing
                                            ? 'Adding...'
                                            : 'Save Specializations'}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                    )}
                </div>
                <div className="relative flex-1 overflow-hidden rounded-xl border border-brand-dark/20 bg-card shadow-[0_22px_48px_-30px_rgba(38,41,47,0.6)] transition-shadow dark:border-brand-light/20 dark:bg-card/60 dark:shadow-[0_18px_42px_-28px_rgba(8,9,12,0.78)]">
                    <div className="h-full overflow-auto p-4">
                        <DataTable columns={columns} data={specializations} />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
