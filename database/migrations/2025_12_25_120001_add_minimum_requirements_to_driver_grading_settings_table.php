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
        Schema::table('driver_grading_settings', function (Blueprint $table) {
            $table->integer('min_trips')->default(3)->after('peer_sample_size');
            $table->integer('min_days_employed')->default(30)->after('min_trips');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('driver_grading_settings', function (Blueprint $table) {
            $table->dropColumn(['min_trips', 'min_days_employed']);
        });
    }
};
