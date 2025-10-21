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
        Schema::create('route_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('operation_id')->constrained('operations');
            $table->foreignId('truck_id')->constrained('trucks');
            $table->foreignId('driver_id')->constrained('drivers');
            $table->date('planned_date');
            $table->time('planned_departure_time');
            $table->time('planned_arrival_time');
            $table->json('route_waypoints'); // JSON array of place IDs
            $table->decimal('total_distance_km', 10, 2);
            $table->integer('total_travel_time_minutes');
            $table->decimal('estimated_fuel_cost', 10, 2);
            $table->string('status')->default('planned'); // planned, in_progress, completed, cancelled
            $table->text('notes')->nullable();
            $table->foreignId('user_id')->constrained('users');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('route_plans');
    }
};

