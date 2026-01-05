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
        // First, update existing NULL values to have a default time
        if (DB::getDriverName() === 'sqlite') {
            DB::statement("UPDATE performances SET DateDispach = DateDispach || ' 00:00:00' WHERE DateDispach IS NOT NULL");
            DB::statement("UPDATE performances SET returned_date = returned_date || ' 00:00:00' WHERE returned_date IS NOT NULL");
        } else {
            DB::statement("UPDATE performances SET DateDispach = CONCAT(DateDispach, ' 00:00:00') WHERE DateDispach IS NOT NULL");
            DB::statement("UPDATE performances SET returned_date = CONCAT(returned_date, ' 00:00:00') WHERE returned_date IS NOT NULL");
        }

        // Now modify the columns to datetime
        Schema::table('performances', function (Blueprint $table) {
            $table->dateTime('DateDispach')->change();
            $table->dateTime('returned_date')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Convert back to date only (will lose time information)
        Schema::table('performances', function (Blueprint $table) {
            $table->date('DateDispach')->change();
            $table->date('returned_date')->nullable()->change();
        });
    }
};
