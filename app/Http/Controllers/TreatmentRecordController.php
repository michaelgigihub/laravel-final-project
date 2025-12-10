<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Tooth;
use App\Models\TreatmentRecord;
use App\Models\TreatmentRecordFile;
use App\Models\TreatmentType;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class TreatmentRecordController extends Controller
{
    /**
     * Display a listing of all treatment records with search and filters.
     */
    public function index(Request $request)
    {
        $query = TreatmentRecord::with([
            'appointment.patient:id,fname,mname,lname',
            'appointment.dentist:id,fname,mname,lname',
            'treatmentType:id,name',
        ])->whereHas('appointment', function ($q) {
            $q->where('status', 'Completed');
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
        $recordsPage = $query->orderBy('created_at', 'desc')->paginate($perPage)->withQueryString();

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

        $treatmentRecord->update([
            'treatment_notes' => $validated['treatment_notes'],
        ]);

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

        // Sync teeth relationship
        $treatmentRecord->teeth()->sync($validated['tooth_ids'] ?? []);

        return back()->with('success', 'Teeth treated updated successfully.');
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

        TreatmentRecordFile::create([
            'appointment_treatment_record_id' => $treatmentRecord->id,
            'file_path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
        ]);

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

        // Delete the file from storage
        Storage::disk('public')->delete($file->file_path);

        // Delete the database record
        $file->delete();

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
