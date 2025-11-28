<?php

namespace Database\Seeders;

use App\Models\Driver;
use App\Models\DriverTruck;
use App\Models\Truck;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class DriverTrucksSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $dataPath = database_path('seeders/data/legacy_driver_trucks.json');

        if (! File::exists($dataPath)) {
            throw new \RuntimeException('Legacy driver-truck dataset missing.');
        }

        $assignmentDataset = collect(json_decode(File::get($dataPath), true, 512, JSON_THROW_ON_ERROR));
        $driverIds = Driver::withTrashed()->pluck('id')->all();
        $truckIds = Truck::withTrashed()->pluck('id')->all();

        DriverTruck::withTrashed()->forceDelete();

        $records = $assignmentDataset->map(function (array $assignment) use ($driverIds, $truckIds): array {
            $legacyId = (int) ($assignment['legacy_id'] ?? 0);
            $driverId = (int) ($assignment['driver_id'] ?? 0);
            $truckId = (int) ($assignment['truck_id'] ?? 0);

            if ($legacyId === 0 || $driverId === 0 || $truckId === 0) {
                throw new \RuntimeException('Invalid legacy driver-truck payload encountered.');
            }

            if (! in_array($driverId, $driverIds, true)) {
                throw new \RuntimeException("Legacy driver-truck {$legacyId} references unknown driver {$driverId}.");
            }

            if (! in_array($truckId, $truckIds, true)) {
                throw new \RuntimeException("Legacy driver-truck {$legacyId} references unknown truck {$truckId}.");
            }

            $createdAt = $assignment['created_at'] ?? now()->toDateTimeString();
            $updatedAt = $assignment['updated_at'] ?? $createdAt;
            $deletedAt = $assignment['deleted_at'] ?? null;

            return [
                'id' => $legacyId,
                'driver_id' => $driverId,
                'truck_id' => $truckId,
                'driverid' => $this->normalizeNullableString($assignment['driverid'] ?? null),
                'plate' => $this->normalizeNullableString($assignment['plate'] ?? null),
                'assigned_date' => $this->normalizeDate($assignment['assigned_date'] ?? null),
                'unassigned_date' => $this->normalizeDate($assignment['unassigned_date'] ?? null),
                'date_recived' => $this->normalizeDate($assignment['date_recived'] ?? null),
                'date_detach' => $this->normalizeDate($assignment['date_detach'] ?? null),
                'reason' => $this->normalizeNullableString($assignment['reason'] ?? null),
                'is_attached' => $this->normalizeBoolean($assignment['is_attached'] ?? null),
                'user_id' => $this->normalizeInteger($assignment['user_id'] ?? null),
                'status' => $this->normalizeStatus($assignment['status'] ?? null),
                'created_at' => $createdAt,
                'updated_at' => $updatedAt,
                'deleted_at' => $deletedAt,
            ];
        });

        $records->chunk(500)->each(static function ($chunk): void {
            DriverTruck::query()->insert($chunk->all());
        });
    }

    private function normalizeStatus(mixed $value, string $default = 'inactive'): string
    {
        if (is_numeric($value)) {
            return (int) $value === 1 ? 'active' : 'inactive';
        }

        $status = Str::of((string) $value)->trim()->lower();

        return $status->isEmpty() ? $default : (string) $status;
    }

    private function normalizeDate(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $trimmed = trim($value);

        if ($trimmed === '' || $trimmed === '0000-00-00' || $trimmed === '0000-00-00 00:00:00') {
            return null;
        }

        return $trimmed;
    }

    private function normalizeNullableString(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $string = Str::of((string) $value)->trim()->squish();

        return $string->isEmpty() ? null : (string) $string;
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

        return in_array((string) $normalized, ['1', 'true', 'yes', 'attached'], true);
    }

    private function normalizeInteger(mixed $value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        return (int) $value;
    }
}
