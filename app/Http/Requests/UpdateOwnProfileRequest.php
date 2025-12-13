<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Form request for dentists updating their own profile.
 * 
 * @method User|null user($guard = null)
 * @method bool has(string $key)
 * @method mixed input(string $key = null, mixed $default = null)
 * @method void merge(array $input)
 * @property-read string|null $contact_number
 */
class UpdateOwnProfileRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     * Only dentists (role_id = 2) can update their own profile.
     */
    public function authorize(): bool
    {
        return $this->user()?->role_id === 2;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $userId = $this->user()->id;

        return [
            'fname' => 'required|string|max:255',
            'mname' => 'nullable|string|max:255',
            'lname' => 'required|string|max:255',
            'gender' => 'required|string|in:Male,Female,Other',
            'contact_number' => [
                'nullable',
                'string',
                'regex:/^(\+63|0)[\s\-\(\)]?[0-9\s\-\(\)]{9,13}$/',
                'unique:users,contact_number,' . $userId,
            ],
            'avatar' => 'nullable|image|mimes:jpeg,jpg,png,gif|max:2048',
        ];
    }

    /**
     * Prepare the data for validation.
     * Formats the contact number before validation.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('contact_number') && $this->contact_number) {
            $this->merge([
                'contact_number' => $this->formatPhoneNumber($this->contact_number),
            ]);
        }
    }

    /**
     * Format Philippine phone number to standard format: 0111 111 1111
     */
    protected function formatPhoneNumber(string $phoneNumber): ?string
    {
        // Remove all non-digit characters except +
        $cleaned = preg_replace('/[^\d+]/', '', $phoneNumber);

        // Handle +63 prefix
        if (str_starts_with($cleaned, '+63')) {
            $cleaned = '0' . substr($cleaned, 3);
        }

        // If starts with 63, add leading 0
        if (str_starts_with($cleaned, '63') && strlen($cleaned) === 12) {
            $cleaned = '0' . substr($cleaned, 2);
        }

        // Ensure it starts with 0
        if (!str_starts_with($cleaned, '0')) {
            return $phoneNumber; // Return original if format not recognized
        }

        // Should be 11 digits for Philippine mobile (0XXX XXX XXXX)
        if (strlen($cleaned) !== 11) {
            return $phoneNumber; // Return original if length doesn't match
        }

        // Format as: 0XXX XXX XXXX
        return substr($cleaned, 0, 4) . ' ' . substr($cleaned, 4, 3) . ' ' . substr($cleaned, 7);
    }
}
