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
        Schema::table('regions', function (Blueprint $table) {
            $table->string('capital')->nullable()->after('status');
            $table->decimal('area_km2', 12, 2)->nullable()->after('capital');
            $table->unsignedBigInteger('population')->nullable()->after('area_km2');
            $table->decimal('latitude', 10, 7)->nullable()->after('population');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            $table->decimal('elevation_m', 8, 2)->nullable()->after('longitude');
            $table->decimal('accessibility_score', 5, 2)->nullable()->after('elevation_m');
            $table->date('last_surveyed_at')->nullable()->after('accessibility_score');
            $table->text('infrastructure_notes')->nullable()->after('last_surveyed_at');
            $table->text('climate_profile')->nullable()->after('infrastructure_notes');
            $table->index('accessibility_score', 'idx_regions_accessibility_score');
            $table->index('population', 'idx_regions_population');
        });

        Schema::table('zones', function (Blueprint $table) {
            $table->string('administrative_center')->nullable()->after('status');
            $table->decimal('area_km2', 12, 2)->nullable()->after('administrative_center');
            $table->unsignedBigInteger('population')->nullable()->after('area_km2');
            $table->decimal('latitude', 10, 7)->nullable()->after('population');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            $table->decimal('elevation_m', 8, 2)->nullable()->after('longitude');
            $table->decimal('accessibility_score', 5, 2)->nullable()->after('elevation_m');
            $table->text('infrastructure_notes')->nullable()->after('accessibility_score');
            $table->text('climate_profile')->nullable()->after('infrastructure_notes');
            $table->index('accessibility_score', 'idx_zones_accessibility_score');
            $table->index('population', 'idx_zones_population');
        });

        Schema::table('woredas', function (Blueprint $table) {
            $table->string('administrative_center')->nullable()->after('status');
            $table->decimal('area_km2', 12, 2)->nullable()->after('administrative_center');
            $table->unsignedBigInteger('population')->nullable()->after('area_km2');
            $table->decimal('latitude', 10, 7)->nullable()->after('population');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            $table->decimal('elevation_m', 8, 2)->nullable()->after('longitude');
            $table->decimal('accessibility_score', 5, 2)->nullable()->after('elevation_m');
            $table->text('infrastructure_notes')->nullable()->after('accessibility_score');
            $table->text('road_quality_notes')->nullable()->after('infrastructure_notes');
            $table->index('accessibility_score', 'idx_woredas_accessibility_score');
            $table->index('population', 'idx_woredas_population');
        });

        Schema::table('places', function (Blueprint $table) {
            $table->decimal('elevation_m', 8, 2)->nullable()->after('longitude');
            $table->unsignedBigInteger('population')->nullable()->after('elevation_m');
            $table->boolean('is_logistics_hub')->default(false)->after('population');
            $table->decimal('accessibility_score', 5, 2)->nullable()->after('is_logistics_hub');
            $table->text('infrastructure_notes')->nullable()->after('accessibility_score');
            $table->text('road_quality_notes')->nullable()->after('infrastructure_notes');
            $table->index('is_logistics_hub', 'idx_places_is_logistics_hub');
            $table->index('accessibility_score', 'idx_places_accessibility_score');
        });

        Schema::table('distances', function (Blueprint $table) {
            $table->decimal('average_speed_kmph', 5, 2)->nullable()->after('road_condition_factor');
            $table->integer('typical_delay_minutes')->nullable()->after('average_speed_kmph');
            $table->decimal('road_quality_index', 4, 2)->nullable()->after('typical_delay_minutes');
            $table->text('seasonality_notes')->nullable()->after('road_quality_index');
            $table->text('safety_notes')->nullable()->after('seasonality_notes');
            $table->index('average_speed_kmph', 'idx_distances_average_speed');
            $table->index('road_quality_index', 'idx_distances_road_quality');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('distances', function (Blueprint $table) {
            $table->dropIndex('idx_distances_road_quality');
            $table->dropIndex('idx_distances_average_speed');
            $table->dropColumn([
                'average_speed_kmph',
                'typical_delay_minutes',
                'road_quality_index',
                'seasonality_notes',
                'safety_notes',
            ]);
        });

        Schema::table('places', function (Blueprint $table) {
            $table->dropIndex('idx_places_accessibility_score');
            $table->dropIndex('idx_places_is_logistics_hub');
            $table->dropColumn([
                'elevation_m',
                'population',
                'is_logistics_hub',
                'accessibility_score',
                'infrastructure_notes',
                'road_quality_notes',
            ]);
        });

        Schema::table('woredas', function (Blueprint $table) {
            $table->dropIndex('idx_woredas_population');
            $table->dropIndex('idx_woredas_accessibility_score');
            $table->dropColumn([
                'administrative_center',
                'area_km2',
                'population',
                'latitude',
                'longitude',
                'elevation_m',
                'accessibility_score',
                'infrastructure_notes',
                'road_quality_notes',
            ]);
        });

        Schema::table('zones', function (Blueprint $table) {
            $table->dropIndex('idx_zones_population');
            $table->dropIndex('idx_zones_accessibility_score');
            $table->dropColumn([
                'administrative_center',
                'area_km2',
                'population',
                'latitude',
                'longitude',
                'elevation_m',
                'accessibility_score',
                'infrastructure_notes',
                'climate_profile',
            ]);
        });

        Schema::table('regions', function (Blueprint $table) {
            $table->dropIndex('idx_regions_population');
            $table->dropIndex('idx_regions_accessibility_score');
            $table->dropColumn([
                'capital',
                'area_km2',
                'population',
                'latitude',
                'longitude',
                'elevation_m',
                'accessibility_score',
                'last_surveyed_at',
                'infrastructure_notes',
                'climate_profile',
            ]);
        });
    }
};
