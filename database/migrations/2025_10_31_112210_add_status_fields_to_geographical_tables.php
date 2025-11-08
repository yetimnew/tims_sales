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
        // Add status field to regions table
        if (! Schema::hasColumn('regions', 'status')) {
            Schema::table('regions', function (Blueprint $table) {
                $table->enum('status', ['active', 'inactive'])->default('active')->after('code');
                $table->index(['status'], 'idx_regions_status');
            });
        } elseif (! $this->indexExists('regions', 'idx_regions_status')) {
            Schema::table('regions', function (Blueprint $table) {
                $table->index(['status'], 'idx_regions_status');
            });
        }

        // Add status field to zones table
        if (! Schema::hasColumn('zones', 'status')) {
            Schema::table('zones', function (Blueprint $table) {
                $table->enum('status', ['active', 'inactive'])->default('active')->after('code');
                $table->index(['status'], 'idx_zones_status');
                $table->index(['region_id'], 'idx_zones_region_id');
            });
        } else {
            Schema::table('zones', function (Blueprint $table) {
                if (! $this->indexExists('zones', 'idx_zones_status')) {
                    $table->index(['status'], 'idx_zones_status');
                }
                if (! $this->indexExists('zones', 'idx_zones_region_id')) {
                    $table->index(['region_id'], 'idx_zones_region_id');
                }
            });
        }

        // Add status field to woredas table
        if (! Schema::hasColumn('woredas', 'status')) {
            Schema::table('woredas', function (Blueprint $table) {
                $table->enum('status', ['active', 'inactive'])->default('active')->after('code');
                $table->index(['status'], 'idx_woredas_status');
                $table->index(['zone_id'], 'idx_woredas_zone_id');
            });
        } else {
            Schema::table('woredas', function (Blueprint $table) {
                if (! $this->indexExists('woredas', 'idx_woredas_status')) {
                    $table->index(['status'], 'idx_woredas_status');
                }
                if (! $this->indexExists('woredas', 'idx_woredas_zone_id')) {
                    $table->index(['zone_id'], 'idx_woredas_zone_id');
                }
            });
        }

        // Add status field to places table
        if (! Schema::hasColumn('places', 'status')) {
            Schema::table('places', function (Blueprint $table) {
                $table->enum('status', ['active', 'inactive'])->default('active')->after('code');
                $table->index(['status'], 'idx_places_status');
                $table->index(['woreda_id'], 'idx_places_woreda_id');
                $table->index(['latitude', 'longitude'], 'idx_places_coordinates');
            });
        } else {
            Schema::table('places', function (Blueprint $table) {
                if (! $this->indexExists('places', 'idx_places_status')) {
                    $table->index(['status'], 'idx_places_status');
                }
                if (! $this->indexExists('places', 'idx_places_woreda_id')) {
                    $table->index(['woreda_id'], 'idx_places_woreda_id');
                }
                if (! $this->indexExists('places', 'idx_places_coordinates')) {
                    $table->index(['latitude', 'longitude'], 'idx_places_coordinates');
                }
            });
        }

        // Add status field to distances table (optional, might not need status)
        if (! Schema::hasColumn('distances', 'status')) {
            Schema::table('distances', function (Blueprint $table) {
                $table->enum('status', ['active', 'inactive'])->default('active')->after('route_notes');
                $table->index(['status'], 'idx_distances_status');
                $table->index(['from_place_id'], 'idx_distances_from_place');
                $table->index(['to_place_id'], 'idx_distances_to_place');
                $table->index(['route_type'], 'idx_distances_route_type');
                $table->unique(['from_place_id', 'to_place_id'], 'unique_distance_route');
            });
        } else {
            Schema::table('distances', function (Blueprint $table) {
                if (! $this->indexExists('distances', 'idx_distances_status')) {
                    $table->index(['status'], 'idx_distances_status');
                }
                if (! $this->indexExists('distances', 'idx_distances_from_place')) {
                    $table->index(['from_place_id'], 'idx_distances_from_place');
                }
                if (! $this->indexExists('distances', 'idx_distances_to_place')) {
                    $table->index(['to_place_id'], 'idx_distances_to_place');
                }
                if (! $this->indexExists('distances', 'idx_distances_route_type')) {
                    $table->index(['route_type'], 'idx_distances_route_type');
                }
                if (! $this->indexExists('distances', 'unique_distance_route')) {
                    $table->unique(['from_place_id', 'to_place_id'], 'unique_distance_route');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove status field and indexes from distances table
        if (Schema::hasColumn('distances', 'status')) {
            Schema::table('distances', function (Blueprint $table) {
                if ($this->indexExists('distances', 'unique_distance_route')) {
                    $table->dropUnique('unique_distance_route');
                }
                if ($this->indexExists('distances', 'idx_distances_route_type')) {
                    $table->dropIndex('idx_distances_route_type');
                }
                if ($this->indexExists('distances', 'idx_distances_to_place')) {
                    $table->dropIndex('idx_distances_to_place');
                }
                if ($this->indexExists('distances', 'idx_distances_from_place')) {
                    $table->dropIndex('idx_distances_from_place');
                }
                if ($this->indexExists('distances', 'idx_distances_status')) {
                    $table->dropIndex('idx_distances_status');
                }
                $table->dropColumn('status');
            });
        }

        // Remove status field and indexes from places table
        if (Schema::hasColumn('places', 'status')) {
            Schema::table('places', function (Blueprint $table) {
                if ($this->indexExists('places', 'idx_places_coordinates')) {
                    $table->dropIndex('idx_places_coordinates');
                }
                if ($this->indexExists('places', 'idx_places_woreda_id')) {
                    $table->dropIndex('idx_places_woreda_id');
                }
                if ($this->indexExists('places', 'idx_places_status')) {
                    $table->dropIndex('idx_places_status');
                }
                $table->dropColumn('status');
            });
        }

        // Remove status field and indexes from woredas table
        if (Schema::hasColumn('woredas', 'status')) {
            Schema::table('woredas', function (Blueprint $table) {
                if ($this->indexExists('woredas', 'idx_woredas_zone_id')) {
                    $table->dropIndex('idx_woredas_zone_id');
                }
                if ($this->indexExists('woredas', 'idx_woredas_status')) {
                    $table->dropIndex('idx_woredas_status');
                }
                $table->dropColumn('status');
            });
        }

        // Remove status field and indexes from zones table
        if (Schema::hasColumn('zones', 'status')) {
            Schema::table('zones', function (Blueprint $table) {
                if ($this->indexExists('zones', 'idx_zones_region_id')) {
                    $table->dropIndex('idx_zones_region_id');
                }
                if ($this->indexExists('zones', 'idx_zones_status')) {
                    $table->dropIndex('idx_zones_status');
                }
                $table->dropColumn('status');
            });
        }

        // Remove status field and indexes from regions table
        if (Schema::hasColumn('regions', 'status')) {
            Schema::table('regions', function (Blueprint $table) {
                if ($this->indexExists('regions', 'idx_regions_status')) {
                    $table->dropIndex('idx_regions_status');
                }
                $table->dropColumn('status');
            });
        }
    }
    private function indexExists(string $table, string $index): bool
    {
        $result = DB::select('SHOW INDEX FROM `' . $table . '` WHERE Key_name = ?', [$index]);

        return ! empty($result);
    }
};
