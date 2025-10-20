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
        Schema::create('treatment_types', function (Blueprint $table) {
            $table->id('treatment_type_id');
            $table->string('name');
            $table->string('description')->nullable();
            $table->decimal('standard_cost', 8, 2)->nullable();
            $table->integer('duration_minutes')->nullable(); //Indicates the average time the treatment takes, helping schedule management and workflow planning.
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('treatment_records', function (Blueprint $table) {
            $table->id('record_id');
            $table->foreignId('patient_id')->constrained('patients', 'patient_id');
            $table->foreignId('dentist_id')->constrained('dentists', 'dentist_id');
            $table->foreignId('treatment_type_id')->constrained('treatment_types', 'treatment_type_id');
            $table->text('treatment_details');
            $table->date('treatment_date');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('treatment_records');
        Schema::dropIfExists('treatment_types');
    }
};
