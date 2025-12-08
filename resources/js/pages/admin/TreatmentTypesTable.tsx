import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Command,
    CommandGroup,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { BreadcrumbItem, TreatmentType } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Treatment Types',
        href: '/admin/treatment-types',
    },
];

interface TreatmentTypesTableProps {
    treatmentTypes: TreatmentType[];
}

import {
    Drawer,
    DrawerContent,
    DrawerTrigger,
} from '@/components/ui/drawer';
import { useMediaQuery } from '@/hooks/use-media-query';

// ... (other imports)

interface TreatmentStatusCellProps {
    treatmentType: TreatmentType;
}

function TreatmentStatusCell({ treatmentType }: TreatmentStatusCellProps) {
    const [open, setOpen] = useState(false);
    const isDesktop = useMediaQuery('(min-width: 768px)');
    // Ensure isActive is treated as a boolean.
    const isActive = !!treatmentType.is_active;

    const statuses = [
        {
            value: true,
            label: 'Active',
            className:
                'bg-green-100 text-green-700 hover:bg-green-200 hover:text-green-700 border-green-200',
            dotClass: 'bg-green-500',
        },
        {
            value: false,
            label: 'Archive',
            className:
                'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-700 border-gray-200',
            dotClass: 'bg-gray-500',
        },
    ];

    const selectedStatus =
        statuses.find((s) => s.value === isActive) || statuses[0];

    if (isDesktop) {
        return (
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className={`h-7 w-[100px] justify-start rounded-full border px-3 text-xs font-semibold ${selectedStatus.className}`}
                    >
                        <span
                            className={`mr-2 h-2 w-2 rounded-full ${selectedStatus.dotClass}`}
                        />
                        {selectedStatus.label}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start">
                    <StatusList
                        setOpen={setOpen}
                        statuses={statuses}
                        treatmentType={treatmentType}
                        isActive={isActive}
                    />
                </PopoverContent>
            </Popover>
        );
    }

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className={`h-7 w-[100px] justify-start rounded-full border px-3 text-xs font-semibold ${selectedStatus.className}`}
                >
                    <span
                        className={`mr-2 h-2 w-2 rounded-full ${selectedStatus.dotClass}`}
                    />
                    {selectedStatus.label}
                </Button>
            </DrawerTrigger>
            <DrawerContent>
                <div className="mt-4 border-t">
                    <StatusList
                        setOpen={setOpen}
                        statuses={statuses}
                        treatmentType={treatmentType}
                        isActive={isActive}
                    />
                </div>
            </DrawerContent>
        </Drawer>
    );
}

interface Status {
    value: boolean;
    label: string;
    className: string;
    dotClass: string;
}

function StatusList({
    setOpen,
    statuses,
    treatmentType,
    isActive,
}: {
    setOpen: (open: boolean) => void;
    statuses: Status[];
    treatmentType: TreatmentType;
    isActive: boolean;
}) {
    return (
        <Command>
            <CommandList>
                <CommandGroup>
                    {statuses.map((status) => (
                        <CommandItem
                            key={status.label}
                            value={status.label}
                            onSelect={() => {
                                if (status.value !== isActive) {
                                    router.put(
                                        `/admin/treatment-types/${treatmentType.id}`,
                                        { is_active: status.value },
                                        {
                                            preserveScroll: true,
                                            onSuccess: () => setOpen(false),
                                        },
                                    );
                                } else {
                                    setOpen(false);
                                }
                            }}
                        >
                            <span
                                className={`mr-2 h-2 w-2 rounded-full ${status.dotClass}`}
                            />
                            <span>{status.label}</span>
                        </CommandItem>
                    ))}
                </CommandGroup>
            </CommandList>
        </Command>
    );
}

export default function TreatmentTypesTable({
    treatmentTypes,
}: TreatmentTypesTableProps) {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        description: '',
        standard_cost: '',
        duration_minutes: '',
        is_active: true,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/treatment-types', {
            onSuccess: () => {
                setOpen(false);
                reset();
            },
        });
    };

    const columns: ColumnDef<TreatmentType>[] = [
        { accessorKey: 'id', header: 'ID' },
        { accessorKey: 'name', header: 'Treatment Name' },
        {
            accessorKey: 'standard_cost',
            header: 'Standard Cost',
            cell: ({ row }) => {
                const amount = parseFloat(row.getValue('standard_cost'));
                const formatted = new Intl.NumberFormat('en-PH', {
                    style: 'currency',
                    currency: 'PHP',
                }).format(amount);
                return <div className="font-medium">{formatted}</div>;
            },
        },
        {
            accessorKey: 'duration_minutes',
            header: 'Duration',
            cell: ({ row }) => {
                return <div>{row.getValue('duration_minutes')} mins</div>;
            },
        },
        {
            accessorKey: 'is_active',
            header: 'Status',
            cell: ({ row }) => <TreatmentStatusCell treatmentType={row.original} />,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Treatment Types" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Treatment Types
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Manage dental treatment types and costs
                        </p>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="size-4" />
                                Add Treatment Type
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                                <DialogTitle>Add Treatment Type</DialogTitle>
                                <DialogDescription>
                                    Create a new treatment type for the clinic.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={submit}>
                                <div className="grid gap-4 py-4">
                                    <FieldGroup>
                                        <Field data-invalid={!!errors.name}>
                                            <FieldLabel>
                                                Name{' '}
                                                <span className="text-destructive">
                                                    *
                                                </span>
                                            </FieldLabel>
                                            <Input
                                                value={data.name}
                                                onChange={(e) =>
                                                    setData(
                                                        'name',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Treatment Name (e.g. Dental Cleaning)"
                                                required
                                            />
                                            <FieldError
                                                errors={[
                                                    { message: errors.name },
                                                ]}
                                            />
                                        </Field>

                                        <Field data-invalid={!!errors.description}>
                                            <FieldLabel>
                                                Description{' '}
                                                <span className="text-destructive">
                                                    *
                                                </span>
                                            </FieldLabel>
                                            <Textarea
                                                value={data.description}
                                                onChange={(e) =>
                                                    setData(
                                                        'description',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Enter a detailed description..."
                                                required
                                            />
                                            <FieldError
                                                errors={[
                                                    {
                                                        message:
                                                            errors.description,
                                                    },
                                                ]}
                                            />
                                        </Field>

                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <Field data-invalid={!!errors.standard_cost}>
                                                <FieldLabel>
                                                    Standard Cost{' '}
                                                    <span className="text-destructive">
                                                        *
                                                    </span>
                                                </FieldLabel>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={data.standard_cost}
                                                    onChange={(e) => {
                                                        const value =
                                                            e.target.value;
                                                        if (
                                                            value === '' ||
                                                            /^\d*\.?\d{0,2}$/.test(
                                                                value,
                                                            )
                                                        ) {
                                                            setData(
                                                                'standard_cost',
                                                                value,
                                                            );
                                                        }
                                                    }}
                                                    onBlur={(e) => {
                                                        const value =
                                                            parseFloat(
                                                                e.target.value,
                                                            );
                                                        if (!isNaN(value)) {
                                                            setData(
                                                                'standard_cost',
                                                                value.toFixed(
                                                                    2,
                                                                ),
                                                            );
                                                        } else {
                                                            setData(
                                                                'standard_cost',
                                                                '',
                                                            );
                                                        }
                                                    }}
                                                    placeholder="0.00"
                                                    required
                                                />
                                                <FieldError
                                                    errors={[
                                                        {
                                                            message:
                                                                errors.standard_cost,
                                                        },
                                                    ]}
                                                />
                                            </Field>

                                            <Field>
                                                <FieldLabel>
                                                    Duration (Minutes){' '}
                                                    <span className="text-destructive">
                                                        *
                                                    </span>
                                                </FieldLabel>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={
                                                        data.duration_minutes
                                                    }
                                                    onChange={(e) =>
                                                        setData(
                                                            'duration_minutes',
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="60"
                                                    required
                                                />
                                                <FieldError
                                                    errors={[
                                                        {
                                                            message:
                                                                errors.duration_minutes,
                                                        },
                                                    ]}
                                                />
                                            </Field>
                                        </div>


                                    </FieldGroup>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={processing}>
                                        {processing
                                            ? 'Creating...'
                                            : 'Create Treatment Type'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
                <div className="relative flex-1 overflow-hidden rounded-xl border border-brand-dark/20 bg-card shadow-[0_22px_48px_-30px_rgba(38,41,47,0.6)] transition-shadow dark:border-brand-light/20 dark:bg-card/60 dark:shadow-[0_18px_42px_-28px_rgba(8,9,12,0.78)]">
                    <div className="h-full overflow-auto p-4">
                        <DataTable columns={columns} data={treatmentTypes} />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
