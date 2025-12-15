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
        Schema::table('treatment_types', function (Blueprint $table) {
            // Add is_per_tooth flag to indicate if pricing is multiplied by number of teeth
            // true = price per tooth (e.g., fillings, extractions, crowns)
            // false = flat rate (e.g., cleaning, checkup, x-rays)
            $table->boolean('is_per_tooth')->default(false)->after('standard_cost');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('treatment_types', function (Blueprint $table) {
            $table->dropColumn('is_per_tooth');
        });
    }
};
