<?php

namespace App\Http\Requests;

use App\Models\Appointment;
use App\Models\ClinicAvailability;
use App\Models\ClinicClosureException;
use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAppointmentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // Patient cannot be changed
            'dentist_id' => ['required', 'exists:users,id', Rule::exists('users', 'id')->where('role_id', 2)],
            'appointment_start_datetime' => ['required', 'date', 'after:now'],
            'appointment_end_datetime' => ['nullable', 'date', 'after:appointment_start_datetime'],
            'treatment_type_ids' => ['required', 'array', 'min:1'],
            'treatment_type_ids.*' => ['exists:treatment_types,id'],
            'purpose_of_appointment' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            if ($validator->errors()->any()) {
                return;
            }

            $datetime = Carbon::parse($this->appointment_start_datetime);
            
            // Check clinic availability for the day
            $dayOfWeek = $datetime->dayOfWeekIso;
            $availability = ClinicAvailability::where('day_of_week', $dayOfWeek)->first();
            
            if (!$availability) {
                $validator->errors()->add('appointment_start_datetime', 'The clinic is not open on this day.');
                return;
            }
            
            if ($availability->is_closed) {
                $validator->errors()->add('appointment_start_datetime', 'The clinic is closed on this day.');
                return;
            }

            // Check for closure exceptions
            $closure = ClinicClosureException::where('date', $datetime->toDateString())->first();
            if ($closure && $closure->is_closed) {
                $validator->errors()->add('appointment_start_datetime', 'The clinic is closed on this date: ' . ($closure->reason ?? 'Special closure'));
                return;
            }

            // Check if appointment time is within clinic hours
            $appointmentTime = $datetime->format('H:i:s');
            if ($appointmentTime < $availability->open_time || $appointmentTime >= $availability->close_time) {
                $validator->errors()->add(
                    'appointment_start_datetime', 
                    'Appointment time must be within clinic hours.'
                );
            }
        });
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'dentist_id.required' => 'Please select a dentist.',
            'dentist_id.exists' => 'The selected dentist does not exist.',
            'appointment_start_datetime.required' => 'Please select appointment date and time.',
            'appointment_start_datetime.after' => 'Appointment must be scheduled for a future date and time.',
            'treatment_type_ids.required' => 'Please select at least one treatment type.',
            'treatment_type_ids.min' => 'Please select at least one treatment type.',
        ];
    }
}
