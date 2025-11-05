<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Populate driver_truck_id from existing truck_id and driver_id
        DB::statement('
            UPDATE fuel_records
            SET driver_truck_id = (
                SELECT dt.id
                FROM driver_truck dt
                WHERE dt.truck_id = fuel_records.truck_id
                AND dt.driver_id = fuel_records.driver_id
                AND dt.is_attached = 1
                AND dt.date_detach IS NULL
                ORDER BY dt.created_at DESC
                LIMIT 1
            )
            WHERE driver_truck_id IS NULL
        ');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Clear the driver_truck_id values
        DB::statement('UPDATE fuel_records SET driver_truck_id = NULL');
    }
};
