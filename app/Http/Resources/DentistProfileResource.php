<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DentistProfileResource extends JsonResource
{
    /**
     * Indicates if additional admin fields should be included.
     */
    protected bool $includeAdminFields;

    /**
     * Create a new resource instance.
     *
     * @param  mixed  $resource
     * @param  bool  $includeAdminFields
     */
    public function __construct($resource, bool $includeAdminFields = false)
    {
        parent::__construct($resource);
        $this->includeAdminFields = $includeAdminFields;
    }

    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'fname' => $this->fname,
            'mname' => $this->mname,
            'lname' => $this->lname,
            'name' => $this->name,
            'gender' => $this->gender,
            'email' => $this->email,
            'contact_number' => $this->contact_number,
            'avatar_path' => $this->avatar_path,
            'avatar_url' => $this->avatar_url,
            'email_verified_at' => $this->email_verified_at,
            'role' => $this->whenLoaded('role', fn() => [
                'id' => $this->role->id,
                'name' => $this->role->name,
            ]),
            'specializations' => $this->whenLoaded(
                'specializations',
                fn() =>
                $this->specializations->map(fn($spec) => [
                    'id' => $spec->id,
                    'name' => $spec->name,
                ])->values()
            ),
            'employment_status' => $this->whenLoaded(
                'dentistProfile',
                fn() => $this->dentistProfile?->employment_status
            ),
            'hire_date' => $this->whenLoaded(
                'dentistProfile',
                fn() => $this->dentistProfile?->hire_date?->format('Y-m-d')
            ),
            'hire_date_formatted' => $this->whenLoaded(
                'dentistProfile',
                fn() => $this->dentistProfile?->hire_date_formatted
            ),

            // Admin-only fields
            'archived_at' => $this->when(
                $this->includeAdminFields,
                $this->whenLoaded(
                    'dentistProfile',
                    fn() => $this->dentistProfile?->archived_at
                )
            ),
            'created_at' => $this->when(
                $this->includeAdminFields,
                $this->created_at?->format('Y-m-d H:i:s')
            ),
            'created_at_formatted' => $this->when(
                $this->includeAdminFields,
                $this->created_at?->format('F d, Y')
            ),
            'must_change_password' => $this->when(
                $this->includeAdminFields,
                $this->must_change_password
            ),
        ];
    }
}
