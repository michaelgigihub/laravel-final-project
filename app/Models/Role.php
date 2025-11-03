<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    protected $fillable = [
        'name',
    ];

    /**
     * Get the users with this role.
     */
    public function users()
    {
        return $this->hasMany(User::class, 'role_id');
    }
}
