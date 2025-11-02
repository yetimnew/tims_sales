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
        // Add status field to regions table
        Schema::table('regions', function (Blueprint $table) {
            $table->enum('status', ['active', 'inactive'])->default('active')->after('code');
            $table->index(['status'], 'idx_regions_status');
        });

        // Add status field to zones table
        Schema::table('zones', function (Blueprint $table) {
            $table->enum('status', ['active', 'inactive'])->default('active')->after('code');
            $table->index(['status'], 'idx_zones_status');
            $table->index(['region_id'], 'idx_zones_region_id');
        });

        // Add status field to woredas table
        Schema::table('woredas', function (Blueprint $table) {
            $table->enum('status', ['active', 'inactive'])->default('active')->after('code');
            $table->index(['status'], 'idx_woredas_status');
            $table->index(['zone_id'], 'idx_woredas_zone_id');
        });

        // Add status field to places table
        Schema::table('places', function (Blueprint $table) {
            $table->enum('status', ['active', 'inactive'])->default('active')->after('code');
            $table->index(['status'], 'idx_places_status');
            $table->index(['woreda_id'], 'idx_places_woreda_id');
            $table->index(['latitude', 'longitude'], 'idx_places_coordinates');
        });

        // Add status field to distances table (optional, might not need status)
        Schema::table('distances', function (Blueprint $table) {
            $table->enum('status', ['active', 'inactive'])->default('active')->after('route_notes');
            $table->index(['status'], 'idx_distances_status');
            $table->index(['from_place_id'], 'idx_distances_from_place');
            $table->index(['to_place_id'], 'idx_distances_to_place');
            $table->index(['route_type'], 'idx_distances_route_type');
            $table->unique(['from_place_id', 'to_place_id'], 'unique_distance_route');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove status field and indexes from distances table
        Schema::table('distances', function (Blueprint $table) {
            $table->dropUnique('unique_distance_route');
            $table->dropIndex('idx_distances_route_type');
            $table->dropIndex('idx_distances_to_place');
            $table->dropIndex('idx_distances_from_place');
            $table->dropIndex('idx_distances_status');
            $table->dropColumn('status');
        });

        // Remove status field and indexes from places table
        Schema::table('places', function (Blueprint $table) {
            $table->dropIndex('idx_places_coordinates');
            $table->dropIndex('idx_places_woreda_id');
            $table->dropIndex('idx_places_status');
            $table->dropColumn('status');
        });

        // Remove status field and indexes from woredas table
        Schema::table('woredas', function (Blueprint $table) {
            $table->dropIndex('idx_woredas_zone_id');
            $table->dropIndex('idx_woredas_status');
            $table->dropColumn('status');
        });

        // Remove status field and indexes from zones table
        Schema::table('zones', function (Blueprint $table) {
            $table->dropIndex('idx_zones_region_id');
            $table->dropIndex('idx_zones_status');
            $table->dropColumn('status');
        });

        // Remove status field and indexes from regions table
        Schema::table('regions', function (Blueprint $table) {
            $table->dropIndex('idx_regions_status');
            $table->dropColumn('status');
        });
    }
};
