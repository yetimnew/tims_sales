<?php

namespace Database\Seeders\Legacy;

use App\Models\Region;
use App\Models\Zone;
use App\Models\Woreda;
use App\Models\Place;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class GeoLegacySeeder extends Seeder
{
    public function run(): void
    {
        $legacy = DB::connection('legacy');

        // Regions
        $legacy->table('regions')->orderBy('id')->get()->each(function ($row) {
            Region::withTrashed()->updateOrCreate(
                ['id' => $row->id],
                [
                    'name' => $row->name,
                    'code' => null,
                    'description' => $row->comment ?? null,
                    'created_at' => $row->created_at ?? null,
                    'updated_at' => $row->updated_at ?? null,
                    'deleted_at' => $row->deleted_at ?? null,
                ]
            );
        });

        // Zones
        $legacy->table('zones')->orderBy('id')->get()->each(function ($row) {
            Zone::withTrashed()->updateOrCreate(
                ['id' => $row->id],
                [
                    'name' => $row->name,
                    'code' => null,
                    'region_id' => $row->region_id,
                    'description' => $row->comment ?? null,
                    'created_at' => $row->created_at ?? null,
                    'updated_at' => $row->updated_at ?? null,
                    'deleted_at' => $row->deleted_at ?? null,
                ]
            );
        });

        // Woredas
        $legacy->table('woredas')->orderBy('id')->get()->each(function ($row) {
            Woreda::withTrashed()->updateOrCreate(
                ['id' => $row->id],
                [
                    'name' => $row->name,
                    'code' => null,
                    'zone_id' => $row->zone_id,
                    'description' => $row->comment ?? null,
                    'created_at' => $row->created_at ?? null,
                    'updated_at' => $row->updated_at ?? null,
                ]
            );
        });

        // Places
        $legacy->table('places')->orderBy('id')->get()->each(function ($row) {
            Place::withTrashed()->updateOrCreate(
                ['id' => $row->id],
                [
                    'name' => $row->name,
                    'code' => null,
                    'woreda_id' => $row->woreda_id,
                    'latitude' => null,
                    'longitude' => null,
                    'description' => $row->comment ?? null,
                    'created_at' => $row->created_at ?? null,
                    'updated_at' => $row->updated_at ?? null,
                    'deleted_at' => $row->deleted_at ?? null,
                ]
            );
        });
    }
}


