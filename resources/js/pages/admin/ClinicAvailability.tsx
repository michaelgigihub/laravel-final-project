import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { Calendar, Clock, MoreHorizontal, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { TimePicker } from '@/components/ui/time-picker';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Availability {
    id: number;
    day_of_week: number;
    day_name: string;
    open_time: string | null;
    close_time: string | null;
    is_closed: boolean;
}

interface Closure {
    id: number;
    date: string;
    reason: string | null;
    is_closed: boolean;
}

interface ClinicAvailabilityProps {
    availabilities: Availability[];
    closures: Closure[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Clinic Availability', href: '/admin/clinic-availability' },
];

const DAYS_OF_WEEK = [
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
    { value: 7, label: 'Sunday' },
];

export default function ClinicAvailability({ availabilities, closures }: ClinicAvailabilityProps) {
    const [editingDay, setEditingDay] = useState<number | null>(null);
    const [showClosureDialog, setShowClosureDialog] = useState(false);
    const [deletingAvailability, setDeletingAvailability] = useState<{ id: number; dayName: string } | null>(null);

    // Form for editing availability
    const availabilityForm = useForm({
        day_of_week: 1,
        open_time: '09:00',
        close_time: '18:00',
        is_closed: false,
    });

    // Form for adding closure
    const closureForm = useForm({
        date: '',
        reason: '',
        is_closed: true,
    });

    const getAvailabilityForDay = (dayOfWeek: number): Availability | undefined => {
        return availabilities.find((a) => a.day_of_week === dayOfWeek);
    };

    const handleEditDay = (dayOfWeek: number) => {
        const existing = getAvailabilityForDay(dayOfWeek);
        if (existing) {
            availabilityForm.setData({
                day_of_week: dayOfWeek,
                open_time: existing.open_time || '09:00',
                close_time: existing.close_time || '18:00',
                is_closed: existing.is_closed,
            });
        } else {
            availabilityForm.setData({
                day_of_week: dayOfWeek,
                open_time: '09:00',
                close_time: '18:00',
                is_closed: false,
            });
        }
        setEditingDay(dayOfWeek);
    };

    const handleSaveAvailability = () => {
        availabilityForm.post('/admin/clinic-availability', {
            preserveScroll: true,
            onSuccess: () => {
                setEditingDay(null);
                toast.success('Schedule saved successfully!', {
                    description: 'The clinic hours have been updated.',
                });
            },
            onError: () => {
                toast.error('Failed to save schedule', {
                    description: 'Please check the times and try again.',
                });
            },
        });
    };

    const handleDeleteAvailability = () => {
        if (deletingAvailability) {
            router.delete(`/admin/clinic-availability/${deletingAvailability.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    setDeletingAvailability(null);
                    toast.success('Schedule removed', {
                        description: 'The clinic hours have been reset.',
                    });
                },
                onError: () => {
                    toast.error('Failed to remove schedule', {
                        description: 'Please try again.',
                    });
                },
            });
        }
    };

    const handleAddClosure = () => {
        closureForm.post('/admin/clinic-closures', {
            preserveScroll: true,
            onSuccess: () => {
                setShowClosureDialog(false);
                closureForm.reset();
            },
        });
    };

    const handleDeleteClosure = (id: number) => {
        if (confirm('Are you sure you want to remove this closure?')) {
            router.delete(`/admin/clinic-closures/${id}`, {
                preserveScroll: true,
            });
        }
    };

    const formatTime = (time: string | null) => {
        if (!time) return '-';
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Clinic Availability" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Clinic Availability</h1>
                    <p className="text-sm text-muted-foreground">
                        Manage the clinic's operating hours and special closures
                    </p>
                </div>

                {/* Weekly Schedule */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="size-5" />
                            Weekly Schedule
                        </CardTitle>
                        <CardDescription>
                            Set the regular operating hours for each day of the week
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Day</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Open Time</TableHead>
                                    <TableHead>Close Time</TableHead>
                                    <TableHead className="text-center">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {DAYS_OF_WEEK.map((day) => {
                                    const availability = getAvailabilityForDay(day.value);
                                    const isEditing = editingDay === day.value;

                                    if (isEditing) {
                                        return (
                                            <TableRow key={day.value}>
                                                <TableCell className="font-medium">{day.label}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Switch
                                                            checked={!availabilityForm.data.is_closed}
                                                            onCheckedChange={(checked: boolean) =>
                                                                availabilityForm.setData('is_closed', !checked)
                                                            }
                                                        />
                                                        <span className="text-sm">
                                                            {availabilityForm.data.is_closed ? 'Closed' : 'Open'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                disabled={availabilityForm.data.is_closed}
                                                                className={cn(
                                                                    'w-[130px] justify-between text-left font-normal',
                                                                    !availabilityForm.data.open_time && 'text-muted-foreground'
                                                                )}
                                                            >
                                                                <span>
                                                                    {availabilityForm.data.open_time ? (() => {
                                                                        const [h, m] = availabilityForm.data.open_time.split(':');
                                                                        const hour = parseInt(h);
                                                                        const period = hour >= 12 ? 'PM' : 'AM';
                                                                        const hour12 = hour % 12 || 12;
                                                                        return `${hour12.toString().padStart(2, '0')}:${m} ${period}`;
                                                                    })() : 'Select time'}
                                                                </span>
                                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0" align="start">
                                                            <div className="p-3 border-b border-border">
                                                                <h4 className="font-medium text-sm text-center mb-2">Open Time</h4>
                                                                <TimePicker
                                                                    value={availabilityForm.data.open_time}
                                                                    onChange={(time) => availabilityForm.setData('open_time', time)}
                                                                    disabled={availabilityForm.data.is_closed}
                                                                />
                                                            </div>
                                                        </PopoverContent>
                                                    </Popover>
                                                    {availabilityForm.errors.open_time && (
                                                        <p className="text-xs text-destructive mt-1">
                                                            {availabilityForm.errors.open_time}
                                                        </p>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                disabled={availabilityForm.data.is_closed}
                                                                className={cn(
                                                                    'w-[130px] justify-between text-left font-normal',
                                                                    !availabilityForm.data.close_time && 'text-muted-foreground'
                                                                )}
                                                            >
                                                                <span>
                                                                    {availabilityForm.data.close_time ? (() => {
                                                                        const [h, m] = availabilityForm.data.close_time.split(':');
                                                                        const hour = parseInt(h);
                                                                        const period = hour >= 12 ? 'PM' : 'AM';
                                                                        const hour12 = hour % 12 || 12;
                                                                        return `${hour12.toString().padStart(2, '0')}:${m} ${period}`;
                                                                    })() : 'Select time'}
                                                                </span>
                                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0" align="start">
                                                            <div className="p-3 border-b border-border">
                                                                <h4 className="font-medium text-sm text-center mb-2">Close Time</h4>
                                                                <TimePicker
                                                                    value={availabilityForm.data.close_time}
                                                                    onChange={(time) => availabilityForm.setData('close_time', time)}
                                                                    disabled={availabilityForm.data.is_closed}
                                                                />
                                                            </div>
                                                        </PopoverContent>
                                                    </Popover>
                                                    {availabilityForm.errors.close_time && (
                                                        <p className="text-xs text-destructive mt-1">
                                                            {availabilityForm.errors.close_time}
                                                        </p>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex justify-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            onClick={handleSaveAvailability}
                                                            disabled={availabilityForm.processing}
                                                        >
                                                            {availabilityForm.processing ? (
                                                                <>
                                                                    <Spinner className="mr-2 size-4" />
                                                                    Saving...
                                                                </>
                                                            ) : (
                                                                'Save'
                                                            )}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => setEditingDay(null)}
                                                        >
                                                            <X className="size-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    }

                                    return (
                                        <TableRow key={day.value}>
                                            <TableCell className="font-medium">{day.label}</TableCell>
                                            <TableCell>
                                                {availability ? (
                                                    availability.is_closed ? (
                                                        <Badge variant="secondary">Closed</Badge>
                                                    ) : (
                                                        <Badge variant="default">Open</Badge>
                                                    )
                                                ) : (
                                                    <Badge variant="outline">Not Set</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {availability && !availability.is_closed
                                                    ? formatTime(availability.open_time)
                                                    : '-'}
                                            </TableCell>
                                            <TableCell>
                                                {availability && !availability.is_closed
                                                    ? formatTime(availability.close_time)
                                                    : '-'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-center">
                                                    {availability ? (
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                                    <span className="sr-only">Open menu</span>
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                                <DropdownMenuItem
                                                                    onClick={() => handleEditDay(day.value)}
                                                                >
                                                                    <Pencil className="mr-2 h-4 w-4" />
                                                                    Edit
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => setDeletingAvailability({ id: availability.id, dayName: day.label })}
                                                                    className="text-destructive focus:text-destructive"
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleEditDay(day.value)}
                                                        >
                                                            Set
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Closure Exceptions */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="size-5" />
                                    Closure Exceptions
                                </CardTitle>
                                <CardDescription>
                                    Add special closures for holidays or maintenance
                                </CardDescription>
                            </div>
                            <Dialog open={showClosureDialog} onOpenChange={setShowClosureDialog}>
                                <DialogTrigger asChild>
                                    <Button>
                                        <Plus className="mr-2 size-4" />
                                        Add Closure
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add Closure Exception</DialogTitle>
                                        <DialogDescription>
                                            Mark a specific date as closed for the clinic.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="date">Date</Label>
                                            <DatePicker
                                                value={closureForm.data.date}
                                                onChange={(date) => closureForm.setData('date', date ? format(date, 'yyyy-MM-dd') : '')}
                                                placeholder="Select closure date"
                                                disablePast
                                            />
                                            {closureForm.errors.date && (
                                                <p className="text-sm text-destructive">{closureForm.errors.date}</p>
                                            )}
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="reason">Reason (Optional)</Label>
                                            <Input
                                                id="reason"
                                                value={closureForm.data.reason}
                                                onChange={(e) => closureForm.setData('reason', e.target.value)}
                                                placeholder="e.g., Holiday, Maintenance"
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            variant="outline"
                                            onClick={() => setShowClosureDialog(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleAddClosure}
                                            disabled={closureForm.processing}
                                        >
                                            Add Closure
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {closures.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Reason</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-center">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {closures.map((closure) => (
                                        <TableRow key={closure.id}>
                                            <TableCell className="font-medium">
                                                {formatDate(closure.date)}
                                            </TableCell>
                                            <TableCell>{closure.reason || '-'}</TableCell>
                                            <TableCell>
                                                <Badge variant={closure.is_closed ? 'destructive' : 'secondary'}>
                                                    {closure.is_closed ? 'Closed' : 'Modified Hours'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-center">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-destructive hover:text-destructive"
                                                        onClick={() => handleDeleteClosure(closure.id)}
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Calendar className="size-12 text-muted-foreground/50 mb-4" />
                                <p className="text-muted-foreground">No closure exceptions scheduled.</p>
                                <p className="text-sm text-muted-foreground">
                                    Add closures for holidays or special occasions.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Delete Availability Confirmation Dialog */}
            <AlertDialog open={!!deletingAvailability} onOpenChange={(open: boolean) => !open && setDeletingAvailability(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Schedule</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove the schedule for{' '}
                            <span className="font-semibold">{deletingAvailability?.dayName}</span>?
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteAvailability}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
