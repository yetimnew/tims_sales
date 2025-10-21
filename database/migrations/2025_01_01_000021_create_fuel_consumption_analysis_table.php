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
        Schema::create('fuel_consumption_analysis', function (Blueprint $table) {
            $table->id();
            $table->foreignId('truck_id')->constrained('trucks');
            $table->date('analysis_date');
            $table->integer('total_distance_km');
            $table->decimal('total_fuel_consumed_liters', 10, 2);
            $table->decimal('fuel_efficiency_km_per_liter', 8, 2);
            $table->decimal('fuel_cost_per_km', 8, 2);
            $table->decimal('average_load_weight', 10, 2)->nullable();
            $table->string('period_type'); // daily, weekly, monthly
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fuel_consumption_analysis');
    }
};



