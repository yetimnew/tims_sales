<?php

namespace Database\Seeders;

use App\Models\Woreda;
use App\Models\Zone;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class EthiopiaWoredasSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $dataPath = database_path('seeders/data/legacy_woredas.json');

        if (! File::exists($dataPath)) {
            throw new \RuntimeException('Legacy woredas dataset missing.');
        }

        $woredaDataset = collect(json_decode(File::get($dataPath), true, 512, JSON_THROW_ON_ERROR));

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
            'road_quality_notes' => null,
        ];

        $zonesByLegacyId = Zone::query()
            ->get()
            ->mapWithKeys(static function (Zone $zone): array {
                if (preg_match('/^LEGACY_ZONE_(\d+)$/', $zone->code, $matches) !== 1) {
                    return [];
                }

                return [(int) $matches[1] => $zone];
            });

        foreach ($woredaDataset as $woreda) {
            $legacyId = (int) ($woreda['legacy_id'] ?? 0);
            $zoneLegacyId = $woreda['zone_legacy_id'] ?? null;

            $name = Str::of($woreda['name'] ?? '')->trim()->squish();

            if ($name->isEmpty()) {
                throw new \RuntimeException("Legacy woreda {$legacyId} is missing a name.");
            }

            if ($legacyId === 0 || $zoneLegacyId === null) {
                throw new \RuntimeException("Invalid legacy woreda payload for '{$name}'.");
            }

            $zone = $zonesByLegacyId->get((int) $zoneLegacyId);

            if ($zone === null) {
                throw new \RuntimeException("Zone LEGACY_ZONE_{$zoneLegacyId} not found for woreda '{$name}'");
            }

            $comment = $woreda['comment'] ?? null;
            $description = $comment === null ? null : (string) Str::of($comment)->trim()->squish();
            $status = (int) ($woreda['status'] ?? 1) === 1 ? 'active' : 'inactive';
            $latitude = $woreda['latitude'] ?? null;
            $longitude = $woreda['longitude'] ?? null;

            $payload = array_merge($defaults, [
                'name' => (string) $name,
                'code' => sprintf('LEGACY_WOREDA_%d', $legacyId),
                'zone_id' => $zone->id,
                'description' => $description,
                'status' => $status,
                'latitude' => $latitude === null ? null : (float) $latitude,
                'longitude' => $longitude === null ? null : (float) $longitude,
            ]);

            Woreda::query()->updateOrCreate([
                'code' => sprintf('LEGACY_WOREDA_%d', $legacyId),
            ], $payload);
        }
    }
}
