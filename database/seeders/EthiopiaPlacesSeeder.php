<?php

namespace Database\Seeders;

use App\Models\Place;
use App\Models\Woreda;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class EthiopiaPlacesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $dataPath = database_path('seeders/data/legacy_places.json');

        if (! File::exists($dataPath)) {
            throw new \RuntimeException('Legacy places dataset missing.');
        }

        $placeDataset = collect(json_decode(File::get($dataPath), true, 512, JSON_THROW_ON_ERROR));

        $defaults = [
            'status' => 'active',
            'latitude' => null,
            'longitude' => null,
            'elevation_m' => null,
            'population' => null,
            'is_logistics_hub' => false,
            'accessibility_score' => null,
            'description' => null,
            'infrastructure_notes' => null,
            'road_quality_notes' => null,
        ];

        $woredasByLegacyId = Woreda::query()
            ->get()
            ->mapWithKeys(static function (Woreda $woreda): array {
                if (preg_match('/^LEGACY_WOREDA_(\d+)$/', $woreda->code, $matches) !== 1) {
                    return [];
                }

                return [(int) $matches[1] => $woreda];
            });

        foreach ($placeDataset as $place) {
            $legacyId = (int) ($place['legacy_id'] ?? 0);
            $woredaLegacyId = $place['woreda_legacy_id'] ?? null;

            if ($legacyId === 0 || $woredaLegacyId === null) {
                throw new \RuntimeException('Invalid legacy place payload encountered.');
            }

            $woreda = $woredasByLegacyId->get((int) $woredaLegacyId);

            if ($woreda === null) {
                $legacyPlaceName = $place['name'] ?? 'UNKNOWN';

                throw new \RuntimeException("Woreda LEGACY_WOREDA_{$woredaLegacyId} not found for place '{$legacyPlaceName}'");
            }

            $name = Str::of($place['name'] ?? '')->trim()->squish();

            if ($name->isEmpty()) {
                throw new \RuntimeException("Legacy place {$legacyId} is missing a name.");
            }

            $comment = $place['comment'] ?? null;
            $description = $comment === null ? null : (string) Str::of($comment)->trim()->squish();
            $status = (int) ($place['status'] ?? 1) === 1 ? 'active' : 'inactive';

            $latitude = $place['latitude'] ?? null;
            $longitude = $place['longitude'] ?? null;

            $placeCode = sprintf('LEGACY_PLACE_%d', $legacyId);

            $payload = array_merge($defaults, [
                'name' => (string) $name,
                'code' => $placeCode,
                'woreda_id' => $woreda->id,
                'status' => $status,
                'description' => $description,
                'latitude' => $latitude === null ? null : (float) $latitude,
                'longitude' => $longitude === null ? null : (float) $longitude,
            ]);

            Place::query()->updateOrCreate([
                'code' => $placeCode,
            ], $payload);
        }
    }
}
