<?php

namespace App\Services;

class PasswordService
{
    /**
     * Generate a default password.
     * Format: lastname_{4 random digits}
     * Handles compound last names (e.g., "dela cruz" -> "delacruz")
     *
     * @return array{password: string, digits: string}
     */
    public function generateDefaultPassword(string $lastName): array
    {
        // Remove spaces and convert to lowercase for compound last names
        $normalizedLastName = strtolower(str_replace(' ', '', $lastName));

        // Generate 4 random digits
        $digits = str_pad(rand(0, 9999), 4, '0', STR_PAD_LEFT);

        // Construct the password
        $password = $normalizedLastName . '_' . $digits;

        return [
            'password' => $password,
            'digits' => $digits,
        ];
    }
}
