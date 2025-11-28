<?php

namespace Database\Seeders;

use App\Models\Distance;
use App\Models\Place;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class EthiopiaDistancesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $dataPath = database_path('seeders/data/legacy_distances.json');

        if (! File::exists($dataPath)) {
            throw new \RuntimeException('Legacy distances dataset missing.');
        }

        $distanceDataset = collect(json_decode(File::get($dataPath), true, 512, JSON_THROW_ON_ERROR));

        $defaults = [
            'status' => 'active',
            'estimated_time_hours' => null,
            'route_description' => null,
            'route_type' => 'primary',
            'estimated_travel_time_minutes' => null,
            'road_condition_factor' => 1.0,
            'toll_road' => false,
            'toll_cost' => null,
            'restricted_for_heavy_vehicles' => false,
            'route_notes' => null,
            'average_speed_kmph' => null,
            'typical_delay_minutes' => null,
            'road_quality_index' => null,
            'seasonality_notes' => null,
            'safety_notes' => null,
        ];

        $placesByLegacyId = Place::query()
            ->get()
            ->mapWithKeys(static function (Place $place): array {
                if (preg_match('/^LEGACY_PLACE_(\d+)$/', $place->code, $matches) !== 1) {
                    return [];
                }

                return [(int) $matches[1] => $place];
            });

        Distance::query()->delete();

        foreach ($distanceDataset as $distance) {
            $legacyId = (int) ($distance['legacy_id'] ?? 0);
            $originLegacyId = $distance['origin_legacy_place_id'] ?? null;
            $destinationLegacyId = $distance['destination_legacy_place_id'] ?? null;

            if ($legacyId === 0 || $originLegacyId === null || $destinationLegacyId === null) {
                throw new \RuntimeException('Invalid legacy distance payload encountered.');
            }

            $origin = $placesByLegacyId->get((int) $originLegacyId);
            $destination = $placesByLegacyId->get((int) $destinationLegacyId);

            if ($origin === null) {
                throw new \RuntimeException("Origin place LEGACY_PLACE_{$originLegacyId} not found for distance {$legacyId}");
            }

            if ($destination === null) {
                throw new \RuntimeException("Destination place LEGACY_PLACE_{$destinationLegacyId} not found for distance {$legacyId}");
            }

            $originName = (string) Str::of($distance['origin_name'] ?? $origin->name)->trim()->squish();
            $destinationName = (string) Str::of($distance['destination_name'] ?? $destination->name)->trim()->squish();
            $status = (int) ($distance['status'] ?? 1) === 1 ? 'active' : 'inactive';
            $routeType = (string) Str::of($distance['route_type'] ?? 'primary')->trim()->lower();

            if ($routeType === '') {
                $routeType = 'primary';
            }

            $roadCondition = array_key_exists('road_condition_factor', $distance)
                ? (float) $distance['road_condition_factor']
                : 1.0;

            if ($roadCondition <= 0) {
                $roadCondition = 1.0;
            }

            $attributes = [
                'from_place_id' => $origin->id,
                'to_place_id' => $destination->id,
            ];

            $values = array_merge($defaults, [
                'distance_km' => (float) ($distance['distance_km'] ?? 0),
                'status' => $status,
                'route_type' => $routeType,
                'road_condition_factor' => $roadCondition,
                'route_description' => sprintf('%s to %s', $originName, $destinationName),
                'estimated_time_hours' => array_key_exists('estimated_time_hours', $distance) ? (float) $distance['estimated_time_hours'] : null,
                'estimated_travel_time_minutes' => array_key_exists('estimated_travel_time_minutes', $distance) ? (int) $distance['estimated_travel_time_minutes'] : null,
                'average_speed_kmph' => array_key_exists('average_speed_kmph', $distance) ? (float) $distance['average_speed_kmph'] : null,
                'typical_delay_minutes' => array_key_exists('typical_delay_minutes', $distance) ? (int) $distance['typical_delay_minutes'] : null,
                'road_quality_index' => array_key_exists('road_quality_index', $distance) ? (float) $distance['road_quality_index'] : null,
                'seasonality_notes' => $distance['seasonality_notes'] ?? null,
                'safety_notes' => $distance['safety_notes'] ?? null,
                'route_notes' => $distance['route_notes'] ?? null,
                'toll_road' => array_key_exists('toll_road', $distance) ? (bool) $distance['toll_road'] : false,
                'toll_cost' => array_key_exists('toll_cost', $distance) ? (float) $distance['toll_cost'] : null,
                'restricted_for_heavy_vehicles' => array_key_exists('restricted_for_heavy_vehicles', $distance) ? (bool) $distance['restricted_for_heavy_vehicles'] : false,
            ]);

            Distance::updateOrCreate($attributes, $values);
        }
    }
}
