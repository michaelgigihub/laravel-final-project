import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { FileText, Image, Pencil } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface TreatmentType {
    id: number;
    name: string;
    standard_cost: number;
}

interface FileRecord {
    id: number;
    file_path: string;
    original_name: string;
    url: string;
}

interface Tooth {
    id: number;
    name: string;
}

interface TreatmentRecordData {
    id: number;
    treatment_type: TreatmentType | null;
    treatment_notes: string | null;
    files: FileRecord[];
    teeth: Tooth[];
    created_at: string;
}

interface Appointment {
    id: number;
    status: string;
}

interface ShowTreatmentRecordProps {
    appointment: Appointment;
    treatmentRecord: TreatmentRecordData;
    allTeeth: Tooth[];
}

export default function ShowTreatmentRecord({
    appointment,
    treatmentRecord,
}: ShowTreatmentRecordProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Appointments', href: '/appointments' },
        { title: `Appointment #${appointment.id}`, href: `/appointments/${appointment.id}` },
        { title: treatmentRecord.treatment_type?.name || 'Treatment', href: '#' },
    ];

    const isImage = (filename: string) => {
        return /\.(jpg|jpeg|png|gif)$/i.test(filename);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={treatmentRecord.treatment_type?.name || 'Treatment Record'} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {treatmentRecord.treatment_type?.name || 'Treatment Record'}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Created: {treatmentRecord.created_at}
                        </p>
                    </div>
                    <Link href={`/appointments/${appointment.id}/treatment-records/${treatmentRecord.id}/edit`}>
                        <Button>
                            <Pencil className="mr-2 size-4" />
                            Edit
                        </Button>
                    </Link>
                </div>

                {/* Treatment Details */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Notes */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Treatment Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {treatmentRecord.treatment_notes ? (
                                <p className="whitespace-pre-wrap">{treatmentRecord.treatment_notes}</p>
                            ) : (
                                <p className="text-muted-foreground">No notes recorded yet.</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Teeth Treated */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Teeth Treated</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {treatmentRecord.teeth && treatmentRecord.teeth.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {treatmentRecord.teeth.map((tooth) => (
                                        <Badge key={tooth.id} variant="secondary">
                                            {tooth.name}
                                        </Badge>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground">No teeth selected yet.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Files */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="size-5" />
                            Attached Files
                        </CardTitle>
                        <CardDescription>
                            Images and documents related to this treatment
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {treatmentRecord.files && treatmentRecord.files.length > 0 ? (
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                                {treatmentRecord.files.map((file) => (
                                    <a
                                        key={file.id}
                                        href={file.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block rounded-lg border p-2 hover:border-primary transition-colors"
                                    >
                                        {isImage(file.original_name) ? (
                                            <img
                                                src={file.url}
                                                alt={file.original_name}
                                                className="w-full h-24 object-cover rounded"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-24 bg-muted rounded">
                                                <FileText className="size-8 text-muted-foreground" />
                                            </div>
                                        )}
                                        <p className="text-xs mt-2 truncate" title={file.original_name}>
                                            {file.original_name}
                                        </p>
                                    </a>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <Image className="size-12 text-muted-foreground/50 mb-2" />
                                <p className="text-muted-foreground">No files attached.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Back Button */}
                <div>
                    <Link href={`/appointments/${appointment.id}`}>
                        <Button variant="outline">
                            Back to Appointment
                        </Button>
                    </Link>
                </div>
            </div>
        </AppLayout>
    );
}
