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
    FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    genderSchema,
    nameSchema,
    optionalNameSchema,
    requiredEmailSchema,
} from '@/lib/validations';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { BreadcrumbItem } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Head, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Admin Users',
        href: '/admin/users',
    },
];

interface AdminUser {
    id: number;
    fname: string;
    mname?: string;
    lname: string;
    gender: string;
    email: string;
    created_at: string;
}

interface AdminUsersProps {
    admins: AdminUser[];
}

export const columns: ColumnDef<AdminUser>[] = [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'fname', header: 'First Name' },
    { accessorKey: 'mname', header: 'Middle Name' },
    { accessorKey: 'lname', header: 'Last Name' },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'gender', header: 'Gender' },
    { accessorKey: 'created_at', header: 'Created At' },
];

const adminFormSchema = z
    .object({
        fname: nameSchema('First name'),
        mname: optionalNameSchema('Middle name'),
        lname: nameSchema('Last name'),
        gender: genderSchema,
        email: requiredEmailSchema,
    });

type AdminFormData = z.infer<typeof adminFormSchema>;

export default function AdminUsers({ admins }: AdminUsersProps) {
    const [open, setOpen] = useState(false);

    const {
        register,
        handleSubmit,
        control,
        reset,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<AdminFormData>({
        resolver: zodResolver(adminFormSchema),
        defaultValues: {
            fname: '',
            mname: '',
            lname: '',
            email: '',
            gender: undefined,
        },
    });

    const onSubmit = (data: AdminFormData) => {
        router.post('/admin/users', data as any, {
            onSuccess: () => {
                setOpen(false);
                reset();
            },
            onError: (errors) => {
                Object.keys(errors).forEach((key) => {
                    setError(key as keyof AdminFormData, {
                        type: 'server',
                        message: errors[key],
                    });
                });
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Users" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Admin Users
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Manage administrator accounts
                        </p>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="size-4" />
                                Add Admin
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Add New Admin</DialogTitle>
                                <DialogDescription>
                                    Create a new administrator account.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit(onSubmit)}>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <Field data-invalid={!!errors.fname}>
                                            <FieldLabel>
                                                First Name{' '}
                                                <span className="text-destructive">
                                                    *
                                                </span>
                                            </FieldLabel>
                                            <Input
                                                {...register('fname')}
                                            />
                                            <FieldError errors={[{ message: errors.fname?.message }]} />
                                        </Field>
                                        <Field data-invalid={!!errors.lname}>
                                            <FieldLabel>
                                                Last Name{' '}
                                                <span className="text-destructive">
                                                    *
                                                </span>
                                            </FieldLabel>
                                            <Input
                                                {...register('lname')}
                                            />
                                            <FieldError errors={[{ message: errors.lname?.message }]} />
                                        </Field>
                                    </div>
                                    <Field data-invalid={!!errors.mname}>
                                        <FieldLabel>Middle Name</FieldLabel>
                                        <Input
                                            {...register('mname')}
                                        />
                                        <FieldError errors={[{ message: errors.mname?.message }]} />
                                    </Field>
                                    <Field data-invalid={!!errors.gender}>
                                        <FieldLabel>
                                            Gender{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </FieldLabel>
                                        <Controller
                                            control={control}
                                            name="gender"
                                            render={({ field }) => (
                                                <Select
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select gender" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Male">
                                                            Male
                                                        </SelectItem>
                                                        <SelectItem value="Female">
                                                            Female
                                                        </SelectItem>
                                                        <SelectItem value="Other">
                                                            Other
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                        <FieldError
                                            errors={[{ message: errors.gender?.message }]}
                                        />
                                    </Field>
                                    <Field data-invalid={!!errors.email}>
                                        <FieldLabel>
                                            Email{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </FieldLabel>
                                        <Input
                                            type="email"
                                            {...register('email')}
                                        />
                                        <FieldError errors={[{ message: errors.email?.message }]} />
                                    </Field>
                                    <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
                                        <p>
                                            A default password will be
                                            automatically generated based on the
                                            last name (e.g., lastname_1234).
                                        </p>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? 'Creating...' : 'Create Admin'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
                <div className="relative flex-1 overflow-hidden rounded-xl border border-brand-dark/20 bg-card shadow-[0_22px_48px_-30px_rgba(38,41,47,0.6)] transition-shadow dark:border-brand-light/20 dark:bg-card/60 dark:shadow-[0_18px_42px_-28px_rgba(8,9,12,0.78)]">
                    <div className="h-full overflow-auto p-4">
                        <DataTable columns={columns} data={admins} />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
