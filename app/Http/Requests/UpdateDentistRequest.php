<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

/**
 * @method User|null user($guard = null)
 * @method bool has(string $key)
 * @method mixed input(string $key = null, mixed $default = null)
 * @method void merge(array $input)
 * @property-read string|null $contact_number
 */
class UpdateDentistRequest extends BaseDentistRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $dentistId = $this->route('dentist')->id;

        return [
            'fname' => 'required|string|max:255',
            'mname' => 'nullable|string|max:255',
            'lname' => 'required|string|max:255',
            'gender' => 'required|string|in:Male,Female,Other',
            'contact_number' => [
                'nullable',
                'string',
                'regex:/^(\+63|0)[\s\-\(\)]?[0-9\s\-\(\)]{9,13}$/',
                'unique:users,contact_number,' . $dentistId,
            ],
            'email' => 'required|string|email|max:255|unique:users,email,' . $dentistId,
            // Avatar update might be separate or same, mostly usually same but handle if file exists
            'avatar' => 'nullable|image|mimes:jpeg,jpg,png,gif|max:2048', 
            'specialization_ids' => 'nullable|array',
            'specialization_ids.*' => 'exists:specializations,id',
            'employment_status' => 'nullable|string|in:Active,Un-hire',
            'hire_date' => 'nullable|date',
        ];
    }
}
