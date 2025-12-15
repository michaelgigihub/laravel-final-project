<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SendGuestMessageRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     * Guests are allowed - no authentication required.
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
            'message' => ['required', 'string', 'min:1', 'max:2000'],
        ];
    }

    /**
     * Get custom error messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'message.required' => 'Please enter a message.',
            'message.max' => 'Your message is too long. Please keep it under 2000 characters.',
        ];
    }
}
