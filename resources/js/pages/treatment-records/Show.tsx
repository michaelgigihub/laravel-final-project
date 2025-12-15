import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { FileText, Image, Pencil, Save, Trash2, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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
    teeth: Tooth[];
    teeth_ids?: number[];
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
    allTeeth,
}: ShowTreatmentRecordProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [selectedTeeth, setSelectedTeeth] = useState<number[]>(
        treatmentRecord.teeth_ids || treatmentRecord.teeth.map((t) => t.id),
    );
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Track which fields have been modified
    const [hasNotesChanged, setHasNotesChanged] = useState(false);
    const [hasTeethChanged, setHasTeethChanged] = useState(false);
    const [deletedFileIds, setDeletedFileIds] = useState<number[]>([]);
    const [pendingUploads, setPendingUploads] = useState<File[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Appointments', href: '/appointments' },
        {
            title: `Appointment #${appointment.id}`,
            href: `/appointments/${appointment.id}`,
        },
        {
            title: treatmentRecord.treatment_type?.name || 'Treatment',
            href: '#',
        },
    ];

    const notesForm = useForm({
        treatment_notes: treatmentRecord.treatment_notes || '',
    });

    // Auto-enable edit mode if edit query parameter is present
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('edit') === 'true') {
            setIsEditing(true);
            // Remove the query parameter from URL without reloading
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    const isImage = (filename: string) => {
        return /\.(jpg|jpeg|png|gif)$/i.test(filename);
    };

    const toggleTooth = (toothId: number) => {
        setSelectedTeeth((prev) => {
            const newSelection = prev.includes(toothId)
                ? prev.filter((id) => id !== toothId)
                : [...prev, toothId];

            // Check if teeth selection has changed from original
            const originalTeethIds =
                treatmentRecord.teeth_ids ||
                treatmentRecord.teeth.map((t) => t.id);
            const hasChanged =
                JSON.stringify(newSelection.sort()) !==
                JSON.stringify(originalTeethIds.sort());
            setHasTeethChanged(hasChanged);

            return newSelection;
        });
    };

    const handleNotesChange = (value: string) => {
        notesForm.setData('treatment_notes', value);
        setHasNotesChanged(value !== (treatmentRecord.treatment_notes || ''));
    };

    const handleNotesKeyDown = (
        e: React.KeyboardEvent<HTMLTextAreaElement>,
    ) => {
        const textarea = e.currentTarget;
        const { selectionStart, selectionEnd, value } = textarea;

        // Auto-bullet: "- " -> "• "
        if (e.key === ' ' && selectionStart === selectionEnd) {
            const textBefore = value.substring(0, selectionStart);
            const lastNewLine = textBefore.lastIndexOf('\n');
            const textInLine = textBefore.substring(lastNewLine + 1);

            // Check if line starts with "-" (possibly with indentation)
            const match = textInLine.match(/^(\s*)-$/);
            if (match) {
                e.preventDefault();
                // Replace "-" with "• " preserving indentation
                const indentation = match[1];
                const prefix = value.substring(0, lastNewLine + 1);
                const suffix = value.substring(selectionEnd);
                const newValue = `${prefix}${indentation}• ${suffix}`;
                
                handleNotesChange(newValue);

                // Set cursor after the bullet
                requestAnimationFrame(() => {
                    const newCursorPos = (prefix + indentation + '• ').length;
                    textarea.setSelectionRange(newCursorPos, newCursorPos);
                });
            }
        }

        // Auto-continue bullet on Enter
        if (e.key === 'Enter' && selectionStart === selectionEnd) {
            const textBefore = value.substring(0, selectionStart);
            const lastNewLine = textBefore.lastIndexOf('\n');
            const currentLine = textBefore.substring(lastNewLine + 1);

            // Check if line starts with bullet
            const match = currentLine.match(/^(\s*)•/);
            if (match) {
                e.preventDefault();
                const indentation = match[1];
                
                // If the line is empty (just Indent + Bullet + space potentially), remove the bullet
                // Check if line content is just bullet + optional space
                if (currentLine.trim() === '•') {
                     // Empty bullet line -> user wants to exit list
                     // Remove the bullet from current line
                     const lineStart = lastNewLine + 1;
                     const cleanValue = value.substring(0, lineStart) + value.substring(selectionEnd);
                     
                     handleNotesChange(cleanValue);
                     requestAnimationFrame(() => {
                        textarea.setSelectionRange(lineStart, lineStart);
                     });
                     return;
                }

                // Normal case: Continue list
                const insertion = `\n${indentation}• `;
                const newValue =
                    value.substring(0, selectionStart) +
                    insertion +
                    value.substring(selectionEnd);

                handleNotesChange(newValue);

                requestAnimationFrame(() => {
                    const newCursorPos = selectionStart + insertion.length;
                    textarea.setSelectionRange(newCursorPos, newCursorPos);
                });
            }
        }
    };

    const handleGlobalSave = () => {
        setIsSaving(true);

        router.post(
            `/appointments/${appointment.id}/treatment-records/${treatmentRecord.id}/update`,
            {
                _method: 'POST',
                treatment_notes: notesForm.data.treatment_notes,
                // Send null if empty to ensure backend clears teeth, otherwise send IDs
                tooth_ids: selectedTeeth.length > 0 ? selectedTeeth : null,
                files: pendingUploads.length > 0 ? pendingUploads : undefined,
                deleted_file_ids: deletedFileIds.length > 0 ? deletedFileIds : undefined,
            },
            {
                preserveScroll: true,
                forceFormData: true,
                onSuccess: () => {
                    setHasNotesChanged(false);
                    setHasTeethChanged(false);
                    setPendingUploads([]);
                    setDeletedFileIds([]);
                    setIsEditing(false);
                },
                onError: (errors) => {
                    console.error('Save failed:', errors);
                },
                onFinish: () => setIsSaving(false),
            },
        );
    };

    const handleCancelEdit = () => {
        // Reset to original values
        notesForm.setData(
            'treatment_notes',
            treatmentRecord.treatment_notes || '',
        );
        setSelectedTeeth(
            treatmentRecord.teeth_ids || treatmentRecord.teeth.map((t) => t.id),
        );
        setHasNotesChanged(false);
        setHasTeethChanged(false);
        setPendingUploads([]);
        setDeletedFileIds([]);
        setIsEditing(false);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        // Add to pending uploads
        setPendingUploads((prev) => [...prev, ...Array.from(files)]);

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDeleteFile = (fileId: number) => {
        // Queue for deletion instead of immediate delete
        setDeletedFileIds((prev) => [...prev, fileId]);
    };

    const handleRemovePendingFile = (index: number) => {
        setPendingUploads((prev) => prev.filter((_, i) => i !== index));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head
                title={
                    treatmentRecord.treatment_type?.name || 'Treatment Record'
                }
            />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {treatmentRecord.treatment_type?.name ||
                                'Treatment Record'}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Created: {treatmentRecord.created_at}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {isEditing ? (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={handleCancelEdit}
                                >
                                    <X className="mr-2 size-4" />
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleGlobalSave}
                                    disabled={
                                        isSaving ||
                                        (!hasNotesChanged &&
                                            !hasTeethChanged &&
                                            pendingUploads.length === 0 &&
                                            deletedFileIds.length === 0)
                                    }
                                >
                                    <Save className="mr-2 size-4" />
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </>
                        ) : (
                            <Button onClick={() => setIsEditing(true)}>
                                <Pencil className="mr-2 size-4" />
                                Edit
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Treatment Notes */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                {isEditing && <Pencil className="size-5" />}
                                Treatment Notes
                            </CardTitle>
                            {isEditing && (
                                <CardDescription>
                                    Add detailed notes about the treatment
                                    performed
                                </CardDescription>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {isEditing ? (
                                <Textarea
                                    value={notesForm.data.treatment_notes}
                                    onChange={(e) => handleNotesChange(e.target.value)}
                                    onKeyDown={handleNotesKeyDown}
                                    placeholder="Enter treatment notes..."
                                    rows={6}
                                />
                            ) : (
                                <>
                                    {treatmentRecord.treatment_notes ? (
                                        <p className="whitespace-pre-wrap">
                                            {treatmentRecord.treatment_notes}
                                        </p>
                                    ) : (
                                        <p className="text-muted-foreground">
                                            No notes recorded yet.
                                        </p>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Teeth Treated */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Teeth Treated</CardTitle>
                            {isEditing && (
                                <CardDescription>
                                    Select the teeth that were treated in this
                                    procedure
                                </CardDescription>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {isEditing ? (
                                <div className="grid max-h-48 grid-cols-4 gap-2 overflow-y-auto">
                                    {allTeeth.map((tooth) => (
                                        <div
                                            key={tooth.id}
                                            className="flex items-center space-x-2 rounded border p-2"
                                        >
                                            <Checkbox
                                                id={`tooth-${tooth.id}`}
                                                checked={selectedTeeth.includes(
                                                    tooth.id,
                                                )}
                                                onCheckedChange={() =>
                                                    toggleTooth(tooth.id)
                                                }
                                            />
                                            <label
                                                htmlFor={`tooth-${tooth.id}`}
                                                className="cursor-pointer text-xs font-medium"
                                            >
                                                {tooth.name}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <>
                                    {treatmentRecord.teeth &&
                                    treatmentRecord.teeth.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {treatmentRecord.teeth.map(
                                                (tooth) => (
                                                    <Badge
                                                        key={tooth.id}
                                                        variant="secondary"
                                                    >
                                                        {tooth.name}
                                                    </Badge>
                                                ),
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground">
                                            No teeth selected yet.
                                        </p>
                                    )}
                                </>
                            )}
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
                                    {isEditing
                                        ? 'Upload images or documents related to this treatment'
                                        : 'Images and documents related to this treatment'}
                                </CardDescription>
                            </div>
                            {isEditing && (
                                <div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                        id="file-upload"
                                        multiple
                                    />
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
                                    >
                                        <Upload className="mr-2 size-4" />
                                        Upload File
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {(treatmentRecord.files &&
                            treatmentRecord.files.filter((f) => !deletedFileIds.includes(f.id))
                                .length > 0) ||
                        pendingUploads.length > 0 ? (
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                                {treatmentRecord.files
                                    .filter((f) => !deletedFileIds.includes(f.id))
                                    .map((file) => (
                                    <div
                                        key={file.id}
                                        className={`group relative overflow-hidden rounded-lg border bg-background ${isEditing ? 'cursor-default' : 'hover:border-primary'}`}
                                    >
                                        {isEditing ? (
                                            <>
                                                <div className="aspect-video w-full overflow-hidden bg-muted relative">
                                                    {isImage(file.original_name) ? (
                                                        <img
                                                            src={file.url}
                                                            alt={file.original_name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : file.original_name
                                                          .toLowerCase()
                                                          .endsWith('.pdf') ? (
                                                        <div className="h-full w-full relative overflow-hidden">
                                                            <embed
                                                                src={`${file.url}#toolbar=0&navpanes=0&scrollbar=0&view=Fit&statusbar=0&messages=0`}
                                                                type="application/pdf"
                                                                className="absolute top-[-50px] left-0 h-[calc(100%+50px)] w-full pointer-events-none border-0"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="flex h-full items-center justify-center">
                                                            <FileText className="size-8 text-muted-foreground" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="truncate border-t bg-muted/50 px-2 py-1.5 text-xs font-medium" title={file.original_name}>
                                                    {file.original_name}
                                                </div>
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute right-1 top-1 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                                                    onClick={() =>
                                                        handleDeleteFile(
                                                            file.id,
                                                        )
                                                    }
                                                >
                                                    <Trash2 className="size-3" />
                                                </Button>
                                            </>
                                        ) : (
                                            <a
                                                href={file.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block h-full"
                                            >
                                                <div className="aspect-video w-full overflow-hidden bg-muted relative">
                                                    {isImage(file.original_name) ? (
                                                        <img
                                                            src={file.url}
                                                            alt={file.original_name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : file.original_name
                                                          .toLowerCase()
                                                          .endsWith('.pdf') ? (
                                                        <div className="h-full w-full relative overflow-hidden">
                                                            <embed
                                                                src={`${file.url}#toolbar=0&navpanes=0&scrollbar=0&view=Fit&statusbar=0&messages=0`}
                                                                type="application/pdf"
                                                                className="absolute top-[-50px] left-0 h-[calc(100%+50px)] w-full pointer-events-none border-0"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="flex h-full items-center justify-center">
                                                            <FileText className="size-8 text-muted-foreground" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="truncate border-t bg-muted/50 px-2 py-1.5 text-xs font-medium" title={file.original_name}>
                                                    {file.original_name}
                                                </div>
                                            </a>
                                        )}
                                    </div>
                                ))}
                                {pendingUploads.map((file, index) => (
                                    <div
                                        key={`pending-${index}`}
                                        className="group relative overflow-hidden rounded-lg border bg-background"
                                    >
                                        <div className="aspect-video w-full overflow-hidden bg-muted relative opacity-70">
                                            {isImage(file.name) ? (
                                                <img
                                                    src={URL.createObjectURL(file)}
                                                    alt={file.name}
                                                    className="h-full w-full object-cover"
                                                    onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)}
                                                />
                                            ) : (
                                                <div className="flex h-full items-center justify-center">
                                                    <FileText className="size-8 text-muted-foreground" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                                                <Badge variant="secondary" className="bg-white/80 text-black">New</Badge>
                                            </div>
                                        </div>
                                        <div className="truncate border-t bg-muted/50 px-2 py-1.5 text-xs font-medium" title={file.name}>
                                            {file.name}
                                        </div>
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="absolute right-1 top-1 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                                            onClick={() => handleRemovePendingFile(index)}
                                        >
                                            <X className="size-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <Image className="mb-2 size-12 text-muted-foreground/50" />
                                <p className="text-muted-foreground">
                                    {isEditing
                                        ? 'No files attached yet.'
                                        : 'No files attached.'}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Back Button */}
                <div>
                    <Button
                        variant="outline"
                        onClick={() =>
                            router.visit(`/appointments/${appointment.id}`)
                        }
                    >
                        Back to Appointment
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}
