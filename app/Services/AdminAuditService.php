<?php

namespace App\Services;

use App\Enums\AuditModuleType;
use App\Enums\AuditTargetType;
use Illuminate\Support\Facades\DB;

class AdminAuditService
{
    /**
     * Log admin activity to the admin_audit table.
     *
     * @param  int  $adminId  The ID of the admin performing the action
     * @param  string  $activityTitle  Short title of the activity (e.g., 'Dentist Created', 'Patient Updated')
     * @param  string  $message  Detailed message describing the action
     * @param  AuditModuleType  $moduleType  The module where the action occurred
     * @param  AuditTargetType|null  $targetType  Type of the target entity (optional)
     * @param  int|null  $targetId  ID of the target entity (optional)
     * @param  array|null  $oldValue  Previous state of the entity (optional)
     * @param  array|null  $newValue  New state of the entity (optional)
     * @param  string|null  $ipAddress  IP address of the admin (optional)
     * @param  string|null  $userAgent  User agent string (optional)
     */
    public function log(
        int $adminId,
        string $activityTitle,
        string $message,
        AuditModuleType $moduleType,
        ?AuditTargetType $targetType = null,
        ?int $targetId = null,
        ?array $oldValue = null,
        ?array $newValue = null,
        ?string $ipAddress = null,
        ?string $userAgent = null
    ): void {
        DB::table('admin_audit')->insert([
            'admin_id' => $adminId,
            'activityTitle' => $activityTitle,
            'moduleType' => $moduleType->value,
            'message' => $message,
            'targetType' => $targetType?->value,
            'targetId' => $targetId,
            'oldValue' => $oldValue ? json_encode($oldValue) : null,
            'newValue' => $newValue ? json_encode($newValue) : null,
            'ipAddress' => $ipAddress ?? request()->ip(),
            'userAgent' => $userAgent ?? request()->userAgent(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
