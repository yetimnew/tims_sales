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
        Schema::table('fuel_records', function (Blueprint $table) {
            // Add driver_truck_id column
            $table->unsignedBigInteger('driver_truck_id')->nullable()->after('user_id');

            // Create foreign key constraint
            $table->foreign('driver_truck_id')->references('id')->on('driver_truck')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('fuel_records', function (Blueprint $table) {
            // Drop foreign key constraint first
            $table->dropForeign(['driver_truck_id']);

            // Drop the column
            $table->dropColumn('driver_truck_id');
        });
    }
};
