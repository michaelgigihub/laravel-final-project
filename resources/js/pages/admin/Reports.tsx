import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Calendar, Download, FileText, Stethoscope, Users } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Reports', href: '/admin/reports' },
];

interface ReportCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    href: string;
    hasDateRange?: boolean;
}

function ReportCard({ title, description, icon, href, hasDateRange = false }: ReportCardProps) {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const [startDate, setStartDate] = useState(format(firstDayOfMonth, 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(today, 'yyyy-MM-dd'));

    const downloadUrl = hasDateRange 
        ? `${href}?start_date=${startDate}&end_date=${endDate}`
        : href;

    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-primary/10 text-primary">
                        {icon}
                    </div>
                    <div>
                        <CardTitle className="text-lg">{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {hasDateRange && (
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                            <Label htmlFor={`${title}-start`}>Start Date</Label>
                            <DatePicker
                                value={startDate}
                                onChange={(date) => setStartDate(date ? format(date, 'yyyy-MM-dd') : '')}
                                placeholder="Select start date"
                                maxDate={endDate ? new Date(endDate) : undefined}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={`${title}-end`}>End Date</Label>
                            <DatePicker
                                value={endDate}
                                onChange={(date) => setEndDate(date ? format(date, 'yyyy-MM-dd') : '')}
                                placeholder="Select end date"
                                minDate={startDate ? new Date(startDate) : undefined}
                            />
                        </div>
                    </div>
                )}
                <a href={downloadUrl} className="block">
                    <Button className="w-full">
                        <Download className="mr-2 size-4" />
                        Download PDF
                    </Button>
                </a>
            </CardContent>
        </Card>
    );
}

export default function Reports() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Reports" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
                    <p className="text-sm text-muted-foreground">
                        Generate and download PDF reports for various data
                    </p>
                </div>

                {/* Report Cards */}
                <div className="grid gap-6 md:grid-cols-2">
                    <ReportCard
                        title="Appointments Report"
                        description="All appointments within a date range"
                        icon={<Calendar className="size-6" />}
                        href="/admin/reports/appointments"
                        hasDateRange
                    />

                    <ReportCard
                        title="Treatments Report"
                        description="Treatment records within a date range"
                        icon={<FileText className="size-6" />}
                        href="/admin/reports/treatments"
                        hasDateRange
                    />

                    <ReportCard
                        title="Patients Report"
                        description="Complete list of all registered patients"
                        icon={<Users className="size-6" />}
                        href="/admin/reports/patients"
                    />

                    <ReportCard
                        title="Dentists Report"
                        description="Staff directory with specializations"
                        icon={<Stethoscope className="size-6" />}
                        href="/admin/reports/dentists"
                    />
                </div>
            </div>
        </AppLayout>
    );
}
