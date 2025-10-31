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
        Schema::table('driver_truck', function (Blueprint $table) {
            // Add unique constraint to prevent duplicate active assignments
            $table->unique(['driver_id', 'truck_id', 'status'], 'unique_active_assignment');

            // Add indexes for performance
            $table->index(['status', 'is_attached'], 'idx_driver_truck_status_attached');
            $table->index(['driver_id', 'status'], 'idx_driver_truck_driver_status');
            $table->index(['truck_id', 'status'], 'idx_driver_truck_truck_status');
            $table->index(['date_recived'], 'idx_driver_truck_date_recived');
            $table->index(['date_detach'], 'idx_driver_truck_date_detach');
        });

        // Add indexes to performances table for better query performance
        Schema::table('performances', function (Blueprint $table) {
            $table->index(['driver_truck_id', 'DateDispach'], 'idx_performance_driver_truck_date');
            $table->index(['operation_id'], 'idx_performance_operation');
            $table->index(['orgion_id'], 'idx_performance_origin');
            $table->index(['destination_id'], 'idx_performance_destination');
            $table->index(['satus'], 'idx_performance_status');
            $table->index(['is_returned'], 'idx_performance_returned');
        });

        // Add indexes to trucks table
        Schema::table('trucks', function (Blueprint $table) {
            $table->index(['status'], 'idx_trucks_status');
            $table->index(['vehicletype_id'], 'idx_trucks_vehicle_type');
        });

        // Add indexes to drivers table
        Schema::table('drivers', function (Blueprint $table) {
            $table->index(['status'], 'idx_drivers_status');
            $table->index(['zone'], 'idx_drivers_zone');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('drivers', function (Blueprint $table) {
            $table->dropIndex('idx_drivers_zone');
            $table->dropIndex('idx_drivers_status');
        });

        Schema::table('trucks', function (Blueprint $table) {
            $table->dropIndex('idx_trucks_vehicle_type');
            $table->dropIndex('idx_trucks_status');
        });

        Schema::table('performances', function (Blueprint $table) {
            $table->dropIndex('idx_performance_returned');
            $table->dropIndex('idx_performance_status');
            $table->dropIndex('idx_performance_destination');
            $table->dropIndex('idx_performance_origin');
            $table->dropIndex('idx_performance_operation');
            $table->dropIndex('idx_performance_driver_truck_date');
        });

        Schema::table('driver_truck', function (Blueprint $table) {
            $table->dropIndex('idx_driver_truck_date_detach');
            $table->dropIndex('idx_driver_truck_date_recived');
            $table->dropIndex('idx_driver_truck_truck_status');
            $table->dropIndex('idx_driver_truck_driver_status');
            $table->dropIndex('idx_driver_truck_status_attached');
            $table->dropUnique('unique_active_assignment');
        });
    }
};
