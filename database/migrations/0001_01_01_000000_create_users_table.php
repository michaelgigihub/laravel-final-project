<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // roles table to define user roles (Admin, Dentist)
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->timestamps();
        });

        // users table to store user information (Admin, Dentist)
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('role_id')->constrained('roles')->restrictOnDelete();
            $table->string('fname');
            $table->string('mname')->nullable();
            $table->string('lname');
            $table->string('gender');
            $table->string('avatar_path')->nullable();
            $table->string('contact_number')->nullable()->unique();
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->boolean('must_change_password')->default(false); // Force password change on first login (for seeded default passwords)
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });

        // audit table to log admin activities
        Schema::create('admin_audit', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admin_id')->constrained('users')->restrictOnDelete();
            $table->string('activityTitle'); // "Login Success", "Update Employee", "User created" label
            $table->string('moduleType'); // "auth", "user-management" filter
            $table->text('message'); // Admin updated employee salary
            $table->string('targetType')->nullable(); // "user-verification under user-management" affected entity
            $table->string('targetId')->nullable(); // Dentist ID 123
            $table->json('oldValue')->nullable(); // { "salary": 30000 }
            $table->json('newValue')->nullable(); // { "salary": 50000 }
            $table->string('ipAddress')->nullable();
            $table->string('userAgent')->nullable(); // Chrome on Windows
            $table->timestamps();

            // Helpful indexes for dashboard filters
            $table->index('admin_id');
            $table->index('moduleType');
            $table->index('activityTitle');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('admin_audit');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('users');
        Schema::dropIfExists('roles');
    }
};
