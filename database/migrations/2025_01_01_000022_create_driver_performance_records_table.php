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
        Schema::create('driver_performance_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('driver_id')->constrained('drivers');
            $table->foreignId('truck_id')->constrained('trucks');
            $table->date('record_date');
            $table->integer('total_trips')->default(0);
            $table->decimal('total_distance_km', 10, 2)->default(0);
            $table->decimal('total_cargo_tonnage', 10, 2)->default(0);
            $table->decimal('fuel_efficiency', 8, 2)->nullable();
            $table->integer('safety_violations')->default(0);
            $table->integer('accidents')->default(0);
            $table->decimal('customer_rating', 3, 2)->nullable(); // 1.00 to 5.00
            $table->text('performance_notes')->nullable();
            $table->string('period_type'); // daily, weekly, monthly
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('driver_performance_records');
    }
};



