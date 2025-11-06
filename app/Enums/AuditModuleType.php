<?php

namespace App\Enums;

enum AuditModuleType: string
{
    case USER_MANAGEMENT = 'user-management';
    case APPOINTMENT_MANAGEMENT = 'appointment-management';
    case PATIENT_MANAGEMENT = 'patient-management';
    case TREATMENT_MANAGEMENT = 'treatment-management';
    case INVENTORY_MANAGEMENT = 'inventory-management';
    case BILLING_MANAGEMENT = 'billing-management';
    case SETTINGS = 'settings';
    case AUTHENTICATION = 'authentication';
    case SYSTEM = 'system';

    /**
     * Get all available module types as an array.
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Get module type label for display.
     */
    public function label(): string
    {
        return match ($this) {
            self::USER_MANAGEMENT => 'User Management',
            self::APPOINTMENT_MANAGEMENT => 'Appointment Management',
            self::PATIENT_MANAGEMENT => 'Patient Management',
            self::TREATMENT_MANAGEMENT => 'Treatment Management',
            self::INVENTORY_MANAGEMENT => 'Inventory Management',
            self::BILLING_MANAGEMENT => 'Billing Management',
            self::SETTINGS => 'Settings',
            self::AUTHENTICATION => 'Authentication',
            self::SYSTEM => 'System',
        };
    }
}
