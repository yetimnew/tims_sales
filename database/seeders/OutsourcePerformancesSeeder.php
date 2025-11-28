<?php

namespace Database\Seeders;

use App\Models\Operation;
use App\Models\Outsource;
use App\Models\Place;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class OutsourcePerformancesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $datasetPath = database_path('seeders/data/legacy_outsource_performances.json');

        if (! File::exists($datasetPath)) {
            throw new \RuntimeException('Legacy outsource performances dataset missing.');
        }

        $performances = collect(json_decode(
            File::get($datasetPath),
            true,
            512,
            JSON_THROW_ON_ERROR
        ));

        if ($performances->isEmpty()) {
            $this->command?->warn('Legacy outsource performances dataset is empty; skipping OutsourcePerformancesSeeder.');

            return;
        }

        $outsources = Outsource::withTrashed()->pluck('id')->all();
        if (empty($outsources)) {
            throw new \RuntimeException('Outsources must be seeded before running OutsourcePerformancesSeeder.');
        }

        $operations = Operation::withTrashed()->pluck('id')->all();
        if (empty($operations)) {
            throw new \RuntimeException('Operations must be seeded before running OutsourcePerformancesSeeder.');
        }

        $users = User::query()->pluck('id')->all();
        if (empty($users)) {
            throw new \RuntimeException('Users must be seeded before running OutsourcePerformancesSeeder.');
        }

        $placesByLegacyId = Place::query()->get()->mapWithKeys(function (Place $place): array {
            if (preg_match('/^LEGACY_PLACE_(\\d+)$/', $place->code, $matches) !== 1) {
                return [];
            }

            return [(int) $matches[1] => $place->id];
        });

        Schema::disableForeignKeyConstraints();
        DB::table('outsource_performances')->truncate();
        Schema::enableForeignKeyConstraints();

        $performances->chunk(500)->each(function ($chunk) use ($placesByLegacyId, $outsources, $operations, $users): void {
            $records = $chunk->map(function (array $performance) use ($placesByLegacyId, $outsources, $operations, $users): array {
                $legacyId = (int) ($performance['legacy_id'] ?? 0);
                $outsourceId = (int) ($performance['outsource_id'] ?? 0);
                $operationId = (int) ($performance['operation_id'] ?? 0);
                $userId = (int) ($performance['user_id'] ?? 0);
                $originLegacyId = (int) ($performance['origin_id'] ?? 0);
                $destinationLegacyId = (int) ($performance['destination_id'] ?? 0);

                if ($legacyId === 0 || $outsourceId === 0 || $operationId === 0 || $originLegacyId === 0 || $destinationLegacyId === 0) {
                    throw new \RuntimeException('Invalid legacy outsource performance payload encountered.');
                }

                if (! in_array($outsourceId, $outsources, true)) {
                    throw new \RuntimeException("Missing outsource {$outsourceId} referenced by outsource performance {$legacyId}.");
                }

                if (! in_array($operationId, $operations, true)) {
                    throw new \RuntimeException("Missing operation {$operationId} referenced by outsource performance {$legacyId}.");
                }

                if ($userId === 0 || ! in_array($userId, $users, true)) {
                    throw new \RuntimeException("Missing user {$userId} referenced by outsource performance {$legacyId}.");
                }

                $originPlaceId = $placesByLegacyId->get($originLegacyId);
                if ($originPlaceId === null) {
                    throw new \RuntimeException("Origin legacy place {$originLegacyId} not found for outsource performance {$legacyId}.");
                }

                $destinationPlaceId = $placesByLegacyId->get($destinationLegacyId);
                if ($destinationPlaceId === null) {
                    throw new \RuntimeException("Destination legacy place {$destinationLegacyId} not found for outsource performance {$legacyId}.");
                }

                $tripNumber = Str::of($performance['fo_number'] ?? '')->trim();
                if ($tripNumber->isEmpty()) {
                    $tripNumber = Str::of((string) ($performance['trip'] ?? ''))->trim();
                }

                if ($tripNumber->isEmpty()) {
                    throw new \RuntimeException("Outsource performance {$legacyId} is missing a trip number.");
                }

                $remarks = collect([
                    $this->nullableString($performance['comment'] ?? null),
                    $this->formatLabeledValue('Driver', $performance['driver_name'] ?? null),
                    $this->formatLabeledValue('Plate', $performance['plate_number'] ?? null),
                    $this->formatLabeledValue('Load type', $performance['load_type'] ?? null),
                    $this->formatLabeledValue('Distance empty', $performance['distance_without_cargo'] ?? null),
                ])->filter()->values();

                return [
                    'id' => $legacyId,
                    'outsource_id' => $outsourceId,
                    'operation_id' => $operationId,
                    'trip_number' => (string) $tripNumber,
                    'dispatch_date' => $this->asDateString($performance['dispatch_date'] ?? null),
                    'from_place_id' => $originPlaceId,
                    'to_place_id' => $destinationPlaceId,
                    'distance_km' => $this->asDecimal($performance['distance_with_cargo'] ?? null, $performance['distance_without_cargo'] ?? null),
                    'cargo_volume_mt' => $this->asDecimal($performance['cargo_volume_mt'] ?? null),
                    'tonkm' => $this->asDecimal($performance['tonkm'] ?? null),
                    'cost' => $this->asDecimal($performance['tariff'] ?? null),
                    'remarks' => $remarks->isEmpty() ? null : $remarks->implode(PHP_EOL),
                    'status' => $this->normalizeStatus($performance['status'] ?? null),
                    'user_id' => $userId,
                    'created_at' => $performance['created_at'] ?? now(),
                    'updated_at' => $performance['updated_at'] ?? now(),
                    'deleted_at' => $performance['deleted_at'] ?? null,
                ];
            })->all();

            DB::table('outsource_performances')->insert($records);
        });
    }

    private function asDateString(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        $date = Str::of((string) $value)->trim();

        if ($date->isEmpty() || $date->startsWith('0000-00-00')) {
            return null;
        }

        return (string) $date->substr(0, 10);
    }

    private function asDecimal(mixed $value, mixed $fallback = null): ?string
    {
        $candidate = $value;

        if ($candidate === null || $candidate === '') {
            $candidate = $fallback;
        }

        if ($candidate === null || $candidate === '') {
            return null;
        }

        return number_format((float) $candidate, 2, '.', '');
    }

    private function nullableString(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $text = Str::of((string) $value)->trim();

        return $text->isEmpty() ? null : (string) $text->squish();
    }

    private function formatLabeledValue(string $label, mixed $value): ?string
    {
        $text = $this->nullableString($value);

        return $text === null ? null : sprintf('%s: %s', $label, $text);
    }

    private function normalizeStatus(mixed $value): string
    {
        if (is_numeric($value)) {
            return (int) $value === 1 ? 'active' : 'inactive';
        }

        $status = Str::of((string) ($value ?? 'inactive'))->trim()->lower();

        if ($status->isEmpty()) {
            return 'inactive';
        }

        return (string) $status;
    }
}
