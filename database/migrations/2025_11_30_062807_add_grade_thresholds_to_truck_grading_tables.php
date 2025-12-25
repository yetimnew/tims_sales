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
        if (! Schema::hasColumn('truck_grading_settings', 'grade_thresholds')) {
            Schema::table('truck_grading_settings', function (Blueprint $table) {
                $table->json('grade_thresholds')->nullable()->after('peer_sample_size');
            });
        }

        if (! Schema::hasColumn('truck_grade_snapshots', 'grade_thresholds')) {
            Schema::table('truck_grade_snapshots', function (Blueprint $table) {
                $table->json('grade_thresholds')->nullable()->after('weights');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('truck_grade_snapshots', 'grade_thresholds')) {
            Schema::table('truck_grade_snapshots', function (Blueprint $table) {
                $table->dropColumn('grade_thresholds');
            });
        }

        if (Schema::hasColumn('truck_grading_settings', 'grade_thresholds')) {
            Schema::table('truck_grading_settings', function (Blueprint $table) {
                $table->dropColumn('grade_thresholds');
            });
        }
    }
};
