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
            $table->json('grade_thresholds')->nullable()->after('peer_sample_size');
        });

        Schema::table('driver_grade_snapshots', function (Blueprint $table) {
            $table->json('grade_thresholds')->nullable()->after('weights');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('driver_grade_snapshots', function (Blueprint $table) {
            $table->dropColumn('grade_thresholds');
        });

        Schema::table('driver_grading_settings', function (Blueprint $table) {
            $table->dropColumn('grade_thresholds');
        });
    }
};
