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
        Schema::table('truck_grading_settings', function (Blueprint $table) {
            $table->integer('min_performance_records')->default(5)->after('peer_sample_size');
            $table->integer('min_days_in_service')->default(30)->after('min_performance_records');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('truck_grading_settings', function (Blueprint $table) {
            $table->dropColumn(['min_performance_records', 'min_days_in_service']);
        });
    }
};
