<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'fname',
        'mname',
        'lname',
        'gender',
        'role_id',
        'contact_number',
        'email',
        'password',
        'must_change_password',
        'email_verified_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * Ensures computed attributes like `name` are included when the model
     * is serialized to JSON and shared with the frontend (e.g., Inertia).
     *
     * @var list<string>
     */
    protected $appends = [
        'name',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    /**
     * Get the concatenated full name.
     */
    public function getNameAttribute(): string
    {
        $parts = array_filter([$this->fname ?? null, $this->mname ?? null, $this->lname ?? null]);
        return implode(' ', $parts);
    }

    /**
     * Get the role relationship.
     */
    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    /**
     * Get the dentist profile (if user is a dentist).
     */
    public function dentistProfile()
    {
        return $this->hasOne(DentistProfile::class, 'dentist_id');
    }

    /**
     * Get the specializations (if user is a dentist).
     */
    public function specializations()
    {
        return $this->belongsToMany(
            Specialization::class,
            'dentist_specialization',
            'dentist_id',
            'specialization_id'
        )->withTimestamps();
    }

    /**
     * Check if user is an admin.
     */
    public function isAdmin(): bool
    {
        return $this->role_id === 1;
    }

    /**
     * Check if user is a dentist.
     */
    public function isDentist(): bool
    {
        return $this->role_id === 2;
    }
}
