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
        Schema::create('performances', function (Blueprint $table) {
            $table->id();
            $table->string('load_phase', 20)->nullable();
            $table->string('load_completion', 20)->nullable();
            $table->string('FOnumber');
            $table->foreignId('operation_id')->constrained('operations');
            $table->foreignId('driver_truck_id')->constrained('driver_truck');
            $table->dateTime('DateDispach');
            $table->foreignId('orgion_id')->constrained('places');
            $table->foreignId('destination_id')->constrained('places');
            $table->decimal('DistanceWCargo', 10, 2)->nullable();
            $table->decimal('tonkm', 10, 2)->nullable();
            $table->decimal('DistanceWOCargo', 10, 2)->nullable();
            $table->decimal('CargoVolumMT', 10, 2)->nullable();
            $table->decimal('fuelInLitter', 10, 2)->nullable();
            $table->decimal('fuelInBirr', 10, 2)->nullable();
            $table->decimal('perdiem', 10, 2)->nullable();
            $table->decimal('workOnGoing', 10, 2)->nullable();
            $table->decimal('other', 10, 2)->nullable();
            $table->foreignId('cargo_type_id')->nullable()->constrained('cargo_types');
            $table->decimal('cargo_weight_kg', 10, 2)->nullable();
            $table->decimal('cargo_volume_cubic_meters', 10, 2)->nullable();
            $table->string('loading_method')->nullable();
            $table->string('unloading_method')->nullable();
            $table->integer('loading_time_minutes')->nullable();
            $table->integer('unloading_time_minutes')->nullable();
            $table->text('cargo_condition_notes')->nullable();
            $table->text('comment')->nullable();
            $table->string('satus')->default('active');
            $table->boolean('is_returned')->default(false);
            $table->dateTime('returned_date')->nullable();
            $table->foreignId('user_id')->constrained('users');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['driver_truck_id', 'DateDispach'], 'idx_performance_driver_truck_date');
            $table->index(['operation_id'], 'idx_performance_operation');
            $table->index(['orgion_id'], 'idx_performance_origin');
            $table->index(['destination_id'], 'idx_performance_destination');
            $table->index(['satus'], 'idx_performance_status');
            $table->index(['is_returned'], 'idx_performance_returned');

            // Composite indexes for performance optimization
            $table->index(['DateDispach', 'is_returned'], 'idx_performances_date_returned');
            $table->index(['load_phase', 'DateDispach'], 'idx_performances_load_phase_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('performances');
    }
};
