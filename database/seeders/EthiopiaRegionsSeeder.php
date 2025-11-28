<?php

namespace Database\Seeders;

use App\Models\Region;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class EthiopiaRegionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $defaults = [
            'status' => 'active',
            'capital' => null,
            'area_km2' => null,
            'population' => null,
            'latitude' => null,
            'longitude' => null,
            'elevation_m' => null,
            'accessibility_score' => null,
            'last_surveyed_at' => null,
            'infrastructure_notes' => null,
            'climate_profile' => null,
        ];

        $dataPath = database_path('seeders/data/legacy_regions.json');

        if (! File::exists($dataPath)) {
            throw new \RuntimeException('Legacy regions dataset missing.');
        }

        $regionDataset = collect(json_decode(File::get($dataPath), true, 512, JSON_THROW_ON_ERROR));

        Region::query()->forceDelete();

        foreach ($regionDataset as $region) {
            $legacyId = (int) ($region['legacy_id'] ?? 0);
            $name = Str::of($region['name'] ?? '')->trim()->squish();
            $code = Str::of($region['code'] ?? '')->trim()->upper();

            if ($legacyId === 0 || $name->isEmpty() || $code->length() !== 3) {
                throw new \RuntimeException('Invalid legacy region payload encountered.');
            }

            $description = $region['description'] ?? null;
            $status = (int) ($region['status'] ?? 1) === 1 ? 'active' : 'inactive';

            $payload = array_merge($defaults, [
                'name' => (string) $name,
                'code' => (string) $code,
                'description' => $description === null ? null : (string) Str::of($description)->trim()->squish(),
                'status' => $status,
            ]);

            Region::create($payload);
        }
    }
}
