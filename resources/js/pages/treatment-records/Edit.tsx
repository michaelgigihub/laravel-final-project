import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { FileText, Image, Pencil, Save, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

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
    teeth_ids: number[];
}

interface Appointment {
    id: number;
    status: string;
}

interface EditTreatmentRecordProps {
    appointment: Appointment;
    treatmentRecord: TreatmentRecordData;
    allTeeth: Tooth[];
}

export default function EditTreatmentRecord({
    appointment,
    treatmentRecord,
    allTeeth,
}: EditTreatmentRecordProps) {
    const [selectedTeeth, setSelectedTeeth] = useState<number[]>(treatmentRecord.teeth_ids);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Appointments', href: '/appointments' },
        { title: `Appointment #${appointment.id}`, href: `/appointments/${appointment.id}` },
        { title: 'Edit Treatment', href: '#' },
    ];

    const notesForm = useForm({
        treatment_notes: treatmentRecord.treatment_notes || '',
    });

    const toggleTooth = (toothId: number) => {
        setSelectedTeeth((prev) =>
            prev.includes(toothId) ? prev.filter((id) => id !== toothId) : [...prev, toothId]
        );
    };

    const handleSaveNotes = () => {
        notesForm.put(`/appointments/${appointment.id}/treatment-records/${treatmentRecord.id}/notes`, {
            preserveScroll: true,
        });
    };

    const handleSaveTeeth = () => {
        router.put(
            `/appointments/${appointment.id}/treatment-records/${treatmentRecord.id}/teeth`,
            { tooth_ids: selectedTeeth },
            { preserveScroll: true }
        );
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        router.post(
            `/appointments/${appointment.id}/treatment-records/${treatmentRecord.id}/files`,
            formData,
            { preserveScroll: true, forceFormData: true }
        );

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDeleteFile = (fileId: number) => {
        if (confirm('Are you sure you want to delete this file?')) {
            router.delete(
                `/appointments/${appointment.id}/treatment-records/${treatmentRecord.id}/files/${fileId}`,
                { preserveScroll: true }
            );
        }
    };

    const isImage = (filename: string) => {
        return /\.(jpg|jpeg|png|gif)$/i.test(filename);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Treatment Record" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Edit Treatment Record
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {treatmentRecord.treatment_type?.name || 'Unknown Treatment'}
                    </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Treatment Notes */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Pencil className="size-5" />
                                Treatment Notes
                            </CardTitle>
                            <CardDescription>
                                Add detailed notes about the treatment performed
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Textarea
                                value={notesForm.data.treatment_notes}
                                onChange={(e) => notesForm.setData('treatment_notes', e.target.value)}
                                placeholder="Enter treatment notes..."
                                rows={6}
                            />
                            <Button onClick={handleSaveNotes} disabled={notesForm.processing}>
                                <Save className="mr-2 size-4" />
                                Save Notes
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Teeth Selection */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Teeth Treated</CardTitle>
                            <CardDescription>
                                Select the teeth that were treated in this procedure
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                                {allTeeth.map((tooth) => (
                                    <div
                                        key={tooth.id}
                                        className="flex items-center space-x-2 p-2 rounded border"
                                    >
                                        <Checkbox
                                            id={`tooth-${tooth.id}`}
                                            checked={selectedTeeth.includes(tooth.id)}
                                            onCheckedChange={() => toggleTooth(tooth.id)}
                                        />
                                        <label
                                            htmlFor={`tooth-${tooth.id}`}
                                            className="text-xs font-medium cursor-pointer"
                                        >
                                            {tooth.id}. {tooth.name}
                                        </label>
                                    </div>
                                ))}
                            </div>
                            <Button onClick={handleSaveTeeth}>
                                <Save className="mr-2 size-4" />
                                Save Teeth Selection
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Files */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="size-5" />
                                    Attached Files
                                </CardTitle>
                                <CardDescription>
                                    Upload images or documents related to this treatment
                                </CardDescription>
                            </div>
                            <div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    id="file-upload"
                                />
                                <Button
                                    variant="outline"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload className="mr-2 size-4" />
                                    Upload File
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {treatmentRecord.files.length > 0 ? (
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                                {treatmentRecord.files.map((file) => (
                                    <div
                                        key={file.id}
                                        className="relative group rounded-lg border p-2"
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
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleDeleteFile(file.id)}
                                        >
                                            <Trash2 className="size-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <Image className="size-12 text-muted-foreground/50 mb-2" />
                                <p className="text-muted-foreground">No files attached yet.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Back Button */}
                <div>
                    <Button
                        variant="outline"
                        onClick={() => router.visit(`/appointments/${appointment.id}`)}
                    >
                        Back to Appointment
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}
