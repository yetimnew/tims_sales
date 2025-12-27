<?php

namespace Database\Seeders;

use App\Models\Region;
use App\Models\Zone;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class EthiopiaZonesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $zoneDataPath = database_path('seeders/data/legacy_zones.json');
        $regionDataPath = database_path('seeders/data/legacy_regions.json');

        if (! File::exists($zoneDataPath)) {
            throw new \RuntimeException('Legacy zones dataset missing.');
        }

        if (! File::exists($regionDataPath)) {
            throw new \RuntimeException('Legacy regions dataset missing.');
        }

        $zoneDataset = collect(json_decode(File::get($zoneDataPath), true, 512, JSON_THROW_ON_ERROR));
        $regionDataset = collect(json_decode(File::get($regionDataPath), true, 512, JSON_THROW_ON_ERROR));

        $defaults = [
            'description' => null,
            'status' => 'active',
            'administrative_center' => null,
            'area_km2' => null,
            'population' => null,
            'latitude' => null,
            'longitude' => null,
            'elevation_m' => null,
            'accessibility_score' => null,
            'infrastructure_notes' => null,
            'climate_profile' => null,
        ];

        $regionCodesByLegacyId = $regionDataset
            ->mapWithKeys(static function (array $region): array {
                $legacyId = (int) ($region['legacy_id'] ?? 0);
                $code = Str::of($region['code'] ?? '')->trim()->upper();

                if ($legacyId === 0 || $code->length() !== 3) {
                    return [];
                }

                return [$legacyId => (string) $code];
            });

        $regionsByCode = Region::query()
            ->get()
            ->keyBy(static fn (Region $region): string => Str::upper($region->code));

        foreach ($zoneDataset as $zone) {
            $legacyId = (int) ($zone['legacy_id'] ?? 0);
            $regionLegacyId = $zone['region_legacy_id'] ?? null;
            $name = Str::of($zone['name'] ?? '')->trim()->squish();

            if ($legacyId === 0 || $regionLegacyId === null || $name->isEmpty()) {
                throw new \RuntimeException('Invalid legacy zone payload encountered.');
            }

            $regionCode = $regionCodesByLegacyId->get((int) $regionLegacyId);

            if ($regionCode === null) {
                throw new \RuntimeException("Region code mapping missing for legacy ID {$regionLegacyId} used by zone '{$name}'");
            }

            $region = $regionsByCode->get($regionCode);

            if ($region === null) {
                throw new \RuntimeException("Region with code {$regionCode} not found for zone '{$name}'");
            }

            $comment = $zone['comment'] ?? null;
            $description = $comment === null ? null : (string) Str::of($comment)->trim()->squish();
            $status = (int) ($zone['status'] ?? 1) === 1 ? 'active' : 'inactive';
            $latitude = $zone['latitude'] ?? null;
            $longitude = $zone['longitude'] ?? null;

            $payload = array_merge($defaults, [
                'name' => (string) $name,
                'code' => sprintf('LEGACY_ZONE_%d', $legacyId),
                'region_id' => $region->id,
                'description' => $description,
                'status' => $status,
                'latitude' => $latitude === null ? null : (float) $latitude,
                'longitude' => $longitude === null ? null : (float) $longitude,
            ]);

            Zone::query()->updateOrCreate([
                'code' => sprintf('LEGACY_ZONE_%d', $legacyId),
            ], $payload);
        }
    }
}
