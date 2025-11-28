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
            $table->dropUnique('unique_active_assignment');

            $table->unique(
                ['driver_id', 'truck_id', 'status', 'assigned_date', 'unassigned_date'],
                'driver_truck_assignment_period_unique'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('driver_truck', function (Blueprint $table) {
            $table->dropUnique('driver_truck_assignment_period_unique');

            $table->unique(['driver_id', 'truck_id', 'status'], 'unique_active_assignment');
        });
    }
};
