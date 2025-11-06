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
        // store specialization types for dentists
        Schema::create('specializations', function (Blueprint $table) {
            $table->id(); // specialization_id
            $table->string('name')->unique(); // e.g., Orthodontics, Periodontics
            $table->timestamps();
        });

        // pivot table to link dentists with their specializations
        Schema::create('dentist_specialization', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dentist_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('specialization_id')->constrained('specializations')->restrictOnDelete();
            $table->timestamps();

            $table->unique(['dentist_id', 'specialization_id']); // Prevent duplicate pairs
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dentist_specialization');
        Schema::dropIfExists('specializations');
    }
};
