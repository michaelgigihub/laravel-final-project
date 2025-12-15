<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

use Illuminate\Validation\Rule;

class StoreTreatmentTypeRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->role_id === 1;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:255',
                function ($attribute, $value, $fail) {
                    if (\App\Models\TreatmentType::whereRaw('LOWER(name) = ?', [strtolower($value)])->exists()) {
                        $fail('The ' . $attribute . ' has already been taken.');
                    }
                },
            ],
            'description' => 'required|string|max:1000',
            'standard_cost' => 'required|numeric|min:0|max:999999.99',
            'is_per_tooth' => 'boolean',
            'duration_minutes' => 'required|integer|min:1|max:480',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Treatment name is required',
            'description.required' => 'Description is required',
            'standard_cost.required' => 'Standard cost is required',
            'standard_cost.numeric' => 'Standard cost must be a number',
            'standard_cost.min' => 'Standard cost cannot be negative',
            'duration_minutes.required' => 'Duration is required',
            'duration_minutes.integer' => 'Duration must be a whole number',
            'duration_minutes.min' => 'Duration must be at least 1 minute',
            'duration_minutes.max' => 'Duration cannot exceed 480 minutes (8 hours)',
        ];
    }
}
