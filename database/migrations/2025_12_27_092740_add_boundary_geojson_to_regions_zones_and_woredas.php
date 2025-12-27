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
        Schema::table('regions', static function (Blueprint $table): void {
            $table->json('boundary_geojson')->nullable()->after('climate_profile');
        });

        Schema::table('zones', static function (Blueprint $table): void {
            $table->json('boundary_geojson')->nullable()->after('climate_profile');
        });

        Schema::table('woredas', static function (Blueprint $table): void {
            $table->json('boundary_geojson')->nullable()->after('road_quality_notes');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('regions', static function (Blueprint $table): void {
            $table->dropColumn('boundary_geojson');
        });

        Schema::table('zones', static function (Blueprint $table): void {
            $table->dropColumn('boundary_geojson');
        });

        Schema::table('woredas', static function (Blueprint $table): void {
            $table->dropColumn('boundary_geojson');
        });
    }
};
