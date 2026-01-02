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
        DB::statement("UPDATE outsource_performances SET dispatch_date = CONCAT(dispatch_date, ' 00:00:00') WHERE dispatch_date IS NOT NULL");
        
        // Now modify the column to datetime
        Schema::table('outsource_performances', function (Blueprint $table) {
            $table->dateTime('dispatch_date')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Convert back to date only (will lose time information)
        Schema::table('outsource_performances', function (Blueprint $table) {
            $table->date('dispatch_date')->change();
        });
    }
};
