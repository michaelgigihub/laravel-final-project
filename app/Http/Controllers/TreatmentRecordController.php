<?php

namespace App\Http\Controllers;

use App\Enums\AuditModuleType;
use App\Enums\AuditTargetType;
use App\Models\Appointment;
use App\Models\Tooth;
use App\Models\TreatmentRecord;
use App\Models\TreatmentRecordFile;
use App\Models\TreatmentType;
use App\Models\User;
use App\Services\AdminAuditService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class TreatmentRecordController extends Controller
{
    public function __construct(
        protected AdminAuditService $auditService
    ) {}
    /**
     * Display a listing of all treatment records with search and filters.
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        $query = TreatmentRecord::with([
            'appointment.patient:id,fname,mname,lname',
            'appointment.dentist:id,fname,mname,lname',
            'treatmentType:id,name',
        ])->whereHas('appointment', function ($q) use ($user) {
            $q->where('status', 'Completed');
            // If user is a dentist (role_id = 2), only show their assigned records
            if ($user->role_id === 2) {
                $q->where('dentist_id', $user->id);
            }
        });

        // Search by patient name
        if ($search = $request->input('search')) {
            $query->whereHas('appointment.patient', function ($q) use ($search) {
                $q->where('fname', 'like', "%{$search}%")
                    ->orWhere('lname', 'like', "%{$search}%");
            });
        }

        // Filter by date range
        if ($dateFrom = $request->input('date_from')) {
            $query->whereHas('appointment', function ($q) use ($dateFrom) {
                $q->whereDate('appointment_start_datetime', '>=', $dateFrom);
            });
        }
        if ($dateTo = $request->input('date_to')) {
            $query->whereHas('appointment', function ($q) use ($dateTo) {
                $q->whereDate('appointment_start_datetime', '<=', $dateTo);
            });
        }


        // Filter by dentist (skip if 'all' is selected)
        $dentistId = $request->input('dentist_id');
        if ($dentistId && $dentistId !== 'all') {
            $query->whereHas('appointment', function ($q) use ($dentistId) {
                $q->where('dentist_id', $dentistId);
            });
        }

        // Filter by treatment type (skip if 'all' is selected)
        $treatmentTypeId = $request->input('treatment_type_id');
        if ($treatmentTypeId && $treatmentTypeId !== 'all') {
            $query->where('treatment_type_id', $treatmentTypeId);
        }

        // Paginate
        $perPage = $request->input('per_page', 15);
        $recordsPage = $query->orderBy('appointment_id', 'desc')
                            ->orderBy('id', 'desc')
                            ->paginate($perPage)
                            ->withQueryString();

        $records = $recordsPage->through(function ($record) {
            return [
                'id' => $record->id,
                'appointment_id' => $record->appointment_id,
                'patient_name' => $record->appointment->patient 
                    ? trim("{$record->appointment->patient->fname} {$record->appointment->patient->lname}") 
                    : 'N/A',
                'dentist_name' => $record->appointment->dentist 
                    ? trim("{$record->appointment->dentist->fname} {$record->appointment->dentist->lname}") 
                    : 'N/A',
                'treatment_type' => $record->treatmentType?->name ?? 'Unknown',
                'treatment_notes' => $record->treatment_notes,
                'appointment_date' => $record->appointment->appointment_start_datetime 
                    ? Carbon::parse($record->appointment->appointment_start_datetime)->format('M d, Y') 
                    : null,
                'created_at' => $record->created_at?->format('M d, Y'),
            ];
        });

        // Get filter options
        $dentists = User::where('role_id', 2)
            ->select('id', 'fname', 'lname')
            ->orderBy('fname')
            ->get()
            ->map(fn($d) => ['id' => $d->id, 'name' => trim("{$d->fname} {$d->lname}")]);

        $treatmentTypes = TreatmentType::select('id', 'name')
            ->orderBy('name')
            ->get();

        return Inertia::render('treatment-records/Index', [
            'records' => $records,
            'dentists' => $dentists,
            'treatmentTypes' => $treatmentTypes,
            'filters' => [
                'search' => $request->input('search', ''),
                'date_from' => $request->input('date_from', ''),
                'date_to' => $request->input('date_to', ''),
                'dentist_id' => $request->input('dentist_id', ''),
                'treatment_type_id' => $request->input('treatment_type_id', ''),
            ],
        ]);
    }

    /**
     * Display the treatment record.
     */
    public function show(Appointment $appointment, TreatmentRecord $treatmentRecord)
    {
        $treatmentRecord->load(['treatmentType', 'files', 'teeth']);

        $teeth = Tooth::all(['id', 'name']);

        return Inertia::render('treatment-records/Show', [
            'appointment' => [
                'id' => $appointment->id,
                'status' => $appointment->status,
            ],
            'treatmentRecord' => [
                'id' => $treatmentRecord->id,
                'treatment_type' => $treatmentRecord->treatmentType,
                'treatment_notes' => $treatmentRecord->treatment_notes,
                'files' => $treatmentRecord->files->map(function ($file) {
                    return [
                        'id' => $file->id,
                        'file_path' => $file->file_path,
                        'original_name' => $file->original_name,
                        'url' => Storage::url($file->file_path),
                    ];
                }),
                'teeth' => $treatmentRecord->teeth,
                'created_at' => $treatmentRecord->created_at?->format('Y-m-d H:i'),
            ],
            'allTeeth' => $teeth,
        ]);
    }

    /**
     * Update treatment notes for a record.
     */
    public function updateNotes(Request $request, Appointment $appointment, TreatmentRecord $treatmentRecord)
    {
        $validated = $request->validate([
            'treatment_notes' => ['nullable', 'string', 'max:5000'],
        ]);

        $oldNotes = $treatmentRecord->treatment_notes;

        $treatmentRecord->update([
            'treatment_notes' => $validated['treatment_notes'],
        ]);

        // Audit log
        $this->auditService->log(
            adminId: Auth::id(),
            activityTitle: 'Treatment Notes Updated',
            message: "Updated notes for treatment record #{$treatmentRecord->id}",
            moduleType: AuditModuleType::TREATMENT_MANAGEMENT,
            targetType: AuditTargetType::TREATMENT_RECORD,
            targetId: $treatmentRecord->id,
            oldValue: ['treatment_notes' => $oldNotes],
            newValue: ['treatment_notes' => $validated['treatment_notes']]
        );

        return back()->with('success', 'Treatment notes updated successfully.');
    }

    /**
     * Update teeth treated for a record.
     */
    public function updateTeeth(Request $request, Appointment $appointment, TreatmentRecord $treatmentRecord)
    {
        $validated = $request->validate([
            'tooth_ids' => ['array'],
            'tooth_ids.*' => ['exists:teeth,id'],
        ]);

        $oldTeethIds = $treatmentRecord->teeth->pluck('id')->toArray();

        // Sync teeth relationship
        $treatmentRecord->teeth()->sync($validated['tooth_ids'] ?? []);

        // Audit log
        $this->auditService->log(
            adminId: Auth::id(),
            activityTitle: 'Treatment Teeth Updated',
            message: "Updated teeth for treatment record #{$treatmentRecord->id}",
            moduleType: AuditModuleType::TREATMENT_MANAGEMENT,
            targetType: AuditTargetType::TREATMENT_RECORD,
            targetId: $treatmentRecord->id,
            oldValue: ['tooth_ids' => $oldTeethIds],
            newValue: ['tooth_ids' => $validated['tooth_ids'] ?? []]
        );

        return back()->with('success', 'Teeth treated updated successfully.');
    }

    /**
     * Unified update for treatment record (notes, teeth, files).
     */
    public function update(Request $request, Appointment $appointment, TreatmentRecord $treatmentRecord)
    {
        $validated = $request->validate([
            'treatment_notes' => ['nullable', 'string', 'max:5000'],
            'tooth_ids' => ['nullable', 'array'],
            'tooth_ids.*' => ['exists:teeth,id'],
            'files' => ['nullable', 'array'],
            'files.*' => ['file', 'max:10240', 'mimes:jpg,jpeg,png,gif,pdf,doc,docx'],
            'deleted_file_ids' => ['nullable', 'array'],
            'deleted_file_ids.*' => ['exists:treatment_record_files,id'],
        ]);

        // 1. Update Notes
        if (array_key_exists('treatment_notes', $validated)) {
            $oldNotes = $treatmentRecord->treatment_notes;
            if ($oldNotes !== $validated['treatment_notes']) {
                $treatmentRecord->update(['treatment_notes' => $validated['treatment_notes']]);
                
                $this->auditService->log(
                    adminId: Auth::id(),
                    activityTitle: 'Treatment Notes Updated',
                    message: "Updated notes for treatment record #{$treatmentRecord->id}",
                    moduleType: AuditModuleType::TREATMENT_MANAGEMENT,
                    targetType: AuditTargetType::TREATMENT_RECORD,
                    targetId: $treatmentRecord->id,
                    oldValue: ['treatment_notes' => $oldNotes],
                    newValue: ['treatment_notes' => $validated['treatment_notes']]
                );
            }
        }

        // 2. Update Teeth
        if (array_key_exists('tooth_ids', $validated)) {
            $oldTeethIds = $treatmentRecord->teeth->pluck('id')->sort()->values()->toArray();
            $newTeethIds = collect($validated['tooth_ids'])->sort()->values()->toArray();

            if ($oldTeethIds !== $newTeethIds) {
                $treatmentRecord->teeth()->sync($validated['tooth_ids']);

                $this->auditService->log(
                    adminId: Auth::id(),
                    activityTitle: 'Teeth Treated Updated',
                    message: "Updated teeth selection for treatment record #{$treatmentRecord->id}",
                    moduleType: AuditModuleType::TREATMENT_MANAGEMENT,
                    targetType: AuditTargetType::TREATMENT_RECORD,
                    targetId: $treatmentRecord->id,
                    oldValue: ['tooth_ids' => $oldTeethIds],
                    newValue: ['tooth_ids' => $validated['tooth_ids']]
                );
            }
        }

        // 3. Upload Files
        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $file) {
                // Check for duplicates
                $originalName = $file->getClientOriginalName();
                $existingFile = TreatmentRecordFile::where('appointment_treatment_record_id', $treatmentRecord->id)
                    ->where('original_name', $originalName)
                    ->exists();

                if ($existingFile) {
                    $nameWithoutExt = pathinfo($originalName, PATHINFO_FILENAME);
                    $extension = $file->getClientOriginalExtension();
                    $originalName = $nameWithoutExt . '_' . time() . '.' . $extension;
                }

                $path = $file->store('treatment-records/' . $treatmentRecord->id, 'public');

                $recordFile = TreatmentRecordFile::create([
                    'appointment_treatment_record_id' => $treatmentRecord->id,
                    'file_path' => $path,
                    'original_name' => $originalName,
                    'mime_type' => $file->getMimeType(),
                    'size' => $file->getSize(),
                ]);

                $this->auditService->log(
                    adminId: Auth::id(),
                    activityTitle: 'Treatment File Uploaded',
                    message: "Uploaded file '{$recordFile->original_name}' to treatment record #{$treatmentRecord->id}",
                    moduleType: AuditModuleType::TREATMENT_MANAGEMENT,
                    targetType: AuditTargetType::TREATMENT_RECORD,
                    targetId: $treatmentRecord->id,
                    newValue: [
                        'file_id' => $recordFile->id,
                        'file_name' => $recordFile->original_name,
                        'mime_type' => $recordFile->mime_type,
                    ]
                );
            }
        }

        // 4. Delete Files
        if (array_key_exists('deleted_file_ids', $validated) && !empty($validated['deleted_file_ids'])) {
             $filesToDelete = TreatmentRecordFile::whereIn('id', $validated['deleted_file_ids'])
                 ->where('appointment_treatment_record_id', $treatmentRecord->id)
                 ->get();

             foreach ($filesToDelete as $file) {
                 Storage::disk('public')->delete($file->file_path);
                 $file->delete();
                 
                 $this->auditService->log(
                    adminId: Auth::id(),
                    activityTitle: 'Treatment File Deleted',
                    message: "Deleted file '{$file->original_name}' from treatment record #{$treatmentRecord->id}",
                    moduleType: AuditModuleType::TREATMENT_MANAGEMENT,
                    targetType: AuditTargetType::TREATMENT_RECORD,
                    targetId: $treatmentRecord->id,
                    oldValue: [
                        'file_id' => $file->id,
                        'file_name' => $file->original_name,
                        'mime_type' => $file->mime_type,
                    ]
                );
             }
        }

        return back()->with('success', 'Treatment record updated successfully.');
    }

    /**
     * Upload file for a treatment record.
     */
    public function uploadFile(Request $request, Appointment $appointment, TreatmentRecord $treatmentRecord)
    {
        $request->validate([
            'file' => ['required', 'file', 'max:10240', 'mimes:jpg,jpeg,png,gif,pdf,doc,docx'],
        ]);

        $file = $request->file('file');
        $path = $file->store('treatment-records/' . $treatmentRecord->id, 'public');

        // Handle duplicate file names by appending timestamp
        $originalName = $file->getClientOriginalName();
        $existingWithSameName = TreatmentRecordFile::where('appointment_treatment_record_id', $treatmentRecord->id)
            ->where('original_name', $originalName)
            ->exists();

        if ($existingWithSameName) {
            $extension = pathinfo($originalName, PATHINFO_EXTENSION);
            $basename = pathinfo($originalName, PATHINFO_FILENAME);
            $originalName = "{$basename}_" . time() . ".{$extension}";
        }

        $recordFile = TreatmentRecordFile::create([
            'appointment_treatment_record_id' => $treatmentRecord->id,
            'file_path' => $path,
            'original_name' => $originalName,
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
        ]);

        // Audit log
        $this->auditService->log(
            adminId: Auth::id(),
            activityTitle: 'Treatment File Uploaded',
            message: "Uploaded file '{$recordFile->original_name}' to treatment record #{$treatmentRecord->id}",
            moduleType: AuditModuleType::TREATMENT_MANAGEMENT,
            targetType: AuditTargetType::TREATMENT_RECORD,
            targetId: $treatmentRecord->id,
            newValue: [
                'file_id' => $recordFile->id,
                'file_name' => $recordFile->original_name,
                'mime_type' => $recordFile->mime_type,
            ]
        );

        return back()->with('success', 'File uploaded successfully.');
    }

    /**
     * Delete a file from a treatment record.
     */
    public function deleteFile(Appointment $appointment, TreatmentRecord $treatmentRecord, TreatmentRecordFile $file)
    {
        // Ensure the file belongs to this treatment record
        if ($file->appointment_treatment_record_id !== $treatmentRecord->id) {
            abort(404);
        }

        $deletedData = [
            'file_id' => $file->id,
            'file_name' => $file->original_name,
            'mime_type' => $file->mime_type,
        ];

        // Delete the file from storage
        Storage::disk('public')->delete($file->file_path);

        // Delete the database record
        $file->delete();

        // Audit log
        $this->auditService->log(
            adminId: Auth::id(),
            activityTitle: 'Treatment File Deleted',
            message: "Deleted file '{$deletedData['file_name']}' from treatment record #{$treatmentRecord->id}",
            moduleType: AuditModuleType::TREATMENT_MANAGEMENT,
            targetType: AuditTargetType::TREATMENT_RECORD,
            targetId: $treatmentRecord->id,
            oldValue: $deletedData
        );

        return back()->with('success', 'File deleted successfully.');
    }

    /**
     * Show edit form for a treatment record (dentist can add notes, teeth, files).
     */
    public function edit(Appointment $appointment, TreatmentRecord $treatmentRecord)
    {
        $treatmentRecord->load(['treatmentType', 'files', 'teeth']);
        $teeth = Tooth::all(['id', 'name']);

        return Inertia::render('treatment-records/Edit', [
            'appointment' => [
                'id' => $appointment->id,
                'status' => $appointment->status,
            ],
            'treatmentRecord' => [
                'id' => $treatmentRecord->id,
                'treatment_type' => $treatmentRecord->treatmentType,
                'treatment_notes' => $treatmentRecord->treatment_notes,
                'files' => $treatmentRecord->files->map(function ($file) {
                    return [
                        'id' => $file->id,
                        'file_path' => $file->file_path,
                        'original_name' => $file->original_name,
                        'url' => Storage::url($file->file_path),
                    ];
                }),
                'teeth_ids' => $treatmentRecord->teeth->pluck('id')->toArray(),
            ],
            'allTeeth' => $teeth,
        ]);
    }
}
