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
        Schema::create('distances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('from_place_id')->constrained('places');
            $table->foreignId('to_place_id')->constrained('places');
            $table->decimal('distance_km', 10, 2);
            $table->decimal('estimated_time_hours', 8, 2)->nullable();
            $table->text('route_description')->nullable();
            $table->string('route_type')->default('primary');
            $table->integer('estimated_travel_time_minutes')->nullable();
            $table->decimal('road_condition_factor', 3, 2)->default(1.00);
            $table->boolean('toll_road')->default(false);
            $table->decimal('toll_cost', 8, 2)->nullable();
            $table->boolean('restricted_for_heavy_vehicles')->default(false);
            $table->text('route_notes')->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->decimal('average_speed_kmph', 5, 2)->nullable();
            $table->integer('typical_delay_minutes')->nullable();
            $table->decimal('road_quality_index', 4, 2)->nullable();
            $table->text('seasonality_notes')->nullable();
            $table->text('safety_notes')->nullable();
            $table->timestamps();

            $table->unique(['from_place_id', 'to_place_id'], 'unique_distance_route');
            $table->index(['status'], 'idx_distances_status');
            $table->index(['from_place_id'], 'idx_distances_from_place');
            $table->index(['to_place_id'], 'idx_distances_to_place');
            $table->index(['route_type'], 'idx_distances_route_type');
            $table->index(['average_speed_kmph'], 'idx_distances_average_speed');
            $table->index(['road_quality_index'], 'idx_distances_road_quality');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('distances');
    }
};
