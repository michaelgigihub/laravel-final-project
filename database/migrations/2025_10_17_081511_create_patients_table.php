<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // patients table to store patient information
        Schema::create('patients', function (Blueprint $table) {
            $table->id();
            $table->string('fname');
            $table->string('mname')->nullable();
            $table->string('lname');
            $table->string('gender');
            $table->string('contact_number')->nullable()->unique();
            $table->string('email')->unique();
            $table->date('date_of_birth');
            $table->string('address');
            $table->timestamps();

            // Indexes to support search/filter
            $table->index('lname');
            $table->index('fname');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // attempt to drop the FK constraint by name (Postgres) if it still exists
        try {
            DB::statement('ALTER TABLE IF EXISTS appointments DROP CONSTRAINT IF EXISTS appointments_patient_id_foreign');
        } catch (\Throwable $e) {
            // ignore any error, we'll still attempt to drop the patients table
        }

        Schema::dropIfExists('patients');
    }
};
