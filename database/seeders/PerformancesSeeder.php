<?php

namespace Database\Seeders;

use App\Models\DriverTruck;
use App\Models\Operation;
use App\Models\Place;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class PerformancesSeeder extends Seeder
{
    private const DECIMAL_MAX_VALUE = 99999999.99;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $datasetPath = database_path('seeders/data/legacy_performances.json');
        $operationsPath = database_path('seeders/data/legacy_operations.json');

        if (! File::exists($datasetPath)) {
            throw new \RuntimeException('Legacy performances dataset missing.');
        }

        $performances = collect(json_decode(
            File::get($datasetPath),
            true,
            512,
            JSON_THROW_ON_ERROR
        ));

        if ($performances->isEmpty()) {
            $this->command?->warn('Legacy performances dataset is empty; skipping PerformancesSeeder.');

            return;
        }

        // Build operation resolution maps to handle deduped operation numbers
        if (! File::exists($operationsPath)) {
            throw new \RuntimeException('Legacy operations dataset required for performances seeding.');
        }

        $legacyOperationsById = collect(json_decode(
            File::get($operationsPath),
            true,
            512,
            JSON_THROW_ON_ERROR
        ))->mapWithKeys(function (array $op): array {
            $id = (int) ($op['legacy_id'] ?? 0);
            $number = (string) \Illuminate\Support\Str::of($op['operationid'] ?? '')->trim()->squish();

            return $id === 0 || $number === '' ? [] : [$id => $number];
        });

        $currentOperationsByNumber = Operation::withTrashed()->get()->keyBy(function (Operation $op): string {
            return (string) \Illuminate\Support\Str::of($op->operationid)->trim()->squish();
        });

        $operations = Operation::withTrashed()->pluck('id')->all();
        if (empty($operations)) {
            throw new \RuntimeException('Operations must be seeded before running PerformancesSeeder.');
        }

        $driverTrucks = DriverTruck::withTrashed()->pluck('id')->all();
        if (empty($driverTrucks)) {
            throw new \RuntimeException('Driver-truck assignments must be seeded before running PerformancesSeeder.');
        }

        $users = User::query()->pluck('id')->all();
        if (empty($users)) {
            throw new \RuntimeException('Users must be seeded before running PerformancesSeeder.');
        }

        $placesByLegacyId = Place::query()->get()->mapWithKeys(function (Place $place): array {
            if (preg_match('/^LEGACY_PLACE_(\\d+)$/', $place->code, $matches) !== 1) {
                return [];
            }

            return [(int) $matches[1] => $place->id];
        });

        Schema::disableForeignKeyConstraints();
        DB::table('performances')->truncate();
        Schema::enableForeignKeyConstraints();

        $performances->chunk(500)->each(function ($chunk) use ($operations, $driverTrucks, $users, $placesByLegacyId, $legacyOperationsById, $currentOperationsByNumber): void {
            $records = $chunk->map(function (array $performance) use ($operations, $driverTrucks, $users, $placesByLegacyId, $legacyOperationsById, $currentOperationsByNumber): array {
                $legacyId = (int) ($performance['legacy_id'] ?? 0);
                $operationId = (int) ($performance['operation_id'] ?? 0);
                $driverTruckId = (int) ($performance['driver_truck_id'] ?? 0);
                $userId = (int) ($performance['user_id'] ?? 0);
                $originLegacyId = (int) ($performance['origin_id'] ?? 0);
                $destinationLegacyId = (int) ($performance['destination_id'] ?? 0);
                $dispatchDate = $this->asDateString($performance['dispatch_date'] ?? null);
                $foNumber = Str::of((string) ($performance['fo_number'] ?? ''))->trim();

                if ($legacyId === 0 || $operationId === 0 || $driverTruckId === 0 || $userId === 0) {
                    throw new \RuntimeException('Invalid legacy performance payload encountered.');
                }

                if ($foNumber->isEmpty()) {
                    throw new \RuntimeException("Legacy performance {$legacyId} is missing an FO number.");
                }

                if ($dispatchDate === null) {
                    throw new \RuntimeException("Legacy performance {$legacyId} is missing a dispatch date.");
                }

                if (! in_array($operationId, $operations, true)) {
                    // Attempt to resolve via legacy operation number mapping
                    $operationNumber = $legacyOperationsById->get($operationId);
                    if ($operationNumber !== null) {
                        $resolved = $currentOperationsByNumber->get($operationNumber);
                        if ($resolved !== null) {
                            $operationId = $resolved->getKey();
                        }
                    }

                    if (! in_array($operationId, $operations, true)) {
                        throw new \RuntimeException("Missing operation {$operationId} referenced by legacy performance {$legacyId}.");
                    }
                }

                if (! in_array($driverTruckId, $driverTrucks, true)) {
                    throw new \RuntimeException("Missing driver-truck assignment {$driverTruckId} referenced by legacy performance {$legacyId}.");
                }

                if (! in_array($userId, $users, true)) {
                    throw new \RuntimeException("Missing user {$userId} referenced by legacy performance {$legacyId}.");
                }

                $originPlaceId = $placesByLegacyId->get($originLegacyId);
                if ($originPlaceId === null) {
                    throw new \RuntimeException("Origin legacy place {$originLegacyId} not found for legacy performance {$legacyId}.");
                }

                $destinationPlaceId = $placesByLegacyId->get($destinationLegacyId);
                if ($destinationPlaceId === null) {
                    throw new \RuntimeException("Destination legacy place {$destinationLegacyId} not found for legacy performance {$legacyId}.");
                }

                return [
                    'id' => $legacyId,
                    'load_phase' => $this->normalizeLoadPhase($performance['load_phase'] ?? null),
                    'load_completion' => $this->normalizeLoadCompletion($performance['load_completion'] ?? null),
                    'FOnumber' => (string) $foNumber,
                    'operation_id' => $operationId,
                    'driver_truck_id' => $driverTruckId,
                    'DateDispach' => $dispatchDate,
                    'orgion_id' => $originPlaceId,
                    'destination_id' => $destinationPlaceId,
                    'DistanceWCargo' => $this->asDecimal($performance['distance_with_cargo'] ?? null),
                    'tonkm' => $this->asDecimal($performance['tonkm'] ?? null),
                    'DistanceWOCargo' => $this->asDecimal($performance['distance_without_cargo'] ?? null),
                    'CargoVolumMT' => $this->asDecimal($performance['cargo_volume_mt'] ?? null),
                    'fuelInLitter' => $this->asDecimal($performance['fuel_in_liter'] ?? null),
                    'fuelInBirr' => $this->asDecimal($performance['fuel_in_birr'] ?? null),
                    'perdiem' => $this->asDecimal($performance['perdiem'] ?? null),
                    'workOnGoing' => $this->asDecimal($performance['work_on_going'] ?? null),
                    'other' => $this->asDecimal($performance['other'] ?? null),
                    'comment' => $this->nullableString($performance['comment'] ?? null),
                    'satus' => $this->normalizeStatus($performance['status'] ?? null),
                    'is_returned' => $this->normalizeBoolean($performance['is_returned'] ?? null),
                    'returned_date' => $this->asDateString($performance['returned_date'] ?? null),
                    'user_id' => $userId,
                    'cargo_type_id' => null,
                    'cargo_weight_kg' => null,
                    'cargo_volume_cubic_meters' => null,
                    'loading_method' => null,
                    'unloading_method' => null,
                    'loading_time_minutes' => null,
                    'unloading_time_minutes' => null,
                    'cargo_condition_notes' => null,
                    'created_at' => $performance['created_at'] ?? now(),
                    'updated_at' => $performance['updated_at'] ?? now(),
                    'deleted_at' => $performance['deleted_at'] ?? null,
                ];
            })->all();

            DB::table('performances')->insert($records);
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

    private function asDecimal(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        $numeric = (float) $value;

        if (abs($numeric) > self::DECIMAL_MAX_VALUE) {
            $numeric = self::DECIMAL_MAX_VALUE * ($numeric < 0 ? -1 : 1);

            $this->command?->warn(
                sprintf(
                    'Clamped decimal value exceeding %s during performances seeding.',
                    number_format(self::DECIMAL_MAX_VALUE, 2, '.', '')
                )
            );
        }

        return number_format($numeric, 2, '.', '');
    }

    private function nullableString(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $text = Str::of((string) $value)->trim();

        return $text->isEmpty() ? null : (string) $text->squish();
    }

    private function normalizeLoadPhase(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (is_numeric($value)) {
            return (int) $value === 1 ? 'main' : 'return';
        }

        $normalized = Str::of((string) $value)->trim()->lower();

        if ($normalized->isEmpty()) {
            return null;
        }

        return match ($normalized->value()) {
            '1', 'main' => 'main',
            '0', 'return' => 'return',
            default => null,
        };
    }

    private function normalizeLoadCompletion(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (is_numeric($value)) {
            return (int) $value === 1 ? 'full' : 'partial';
        }

        $normalized = Str::of((string) $value)->trim()->lower();

        if ($normalized->isEmpty()) {
            return null;
        }

        return match ($normalized->value()) {
            '1', 'full' => 'full',
            '0', 'partial' => 'partial',
            default => null,
        };
    }

    private function normalizeStatus(mixed $value, string $default = 'inactive'): string
    {
        if (is_numeric($value)) {
            return (int) $value === 1 ? 'active' : 'inactive';
        }

        $status = Str::of((string) ($value ?? ''))->trim()->lower();

        return $status->isEmpty() ? $default : (string) $status;
    }

    private function normalizeBoolean(mixed $value): bool
    {
        if (is_bool($value)) {
            return $value;
        }

        if (is_numeric($value)) {
            return (int) $value === 1;
        }

        $normalized = Str::of((string) $value)->trim()->lower();

        if ($normalized->isEmpty()) {
            return false;
        }

        return in_array((string) $normalized, ['1', 'true', 'yes'], true);
    }
}
