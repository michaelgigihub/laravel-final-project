import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { Calendar, Clock, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

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
            onSuccess: () => setEditingDay(null),
        });
    };

    const handleDeleteAvailability = (id: number) => {
        if (confirm('Are you sure you want to remove this availability?')) {
            router.delete(`/admin/clinic-availability/${id}`, {
                preserveScroll: true,
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
                                                    <Input
                                                        type="time"
                                                        value={availabilityForm.data.open_time}
                                                        onChange={(e) =>
                                                            availabilityForm.setData('open_time', e.target.value)
                                                        }
                                                        disabled={availabilityForm.data.is_closed}
                                                        className="w-32"
                                                    />
                                                    {availabilityForm.errors.open_time && (
                                                        <p className="text-xs text-destructive mt-1">
                                                            {availabilityForm.errors.open_time}
                                                        </p>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="time"
                                                        value={availabilityForm.data.close_time}
                                                        onChange={(e) =>
                                                            availabilityForm.setData('close_time', e.target.value)
                                                        }
                                                        disabled={availabilityForm.data.is_closed}
                                                        className="w-32"
                                                    />
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
                                                            Save
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
                                                <div className="flex justify-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleEditDay(day.value)}
                                                    >
                                                        {availability ? 'Edit' : 'Set'}
                                                    </Button>
                                                    {availability && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="text-destructive hover:text-destructive"
                                                            onClick={() => handleDeleteAvailability(availability.id)}
                                                        >
                                                            <Trash2 className="size-4" />
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
                                                onChange={(date) => closureForm.setData('date', date ? date.toISOString().split('T')[0] : '')}
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
        </AppLayout>
    );
}
