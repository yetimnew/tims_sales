<?php

namespace Database\Seeders;

use App\Models\Truck;
use App\Models\VehicleType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class TrucksSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $dataPath = database_path('seeders/data/legacy_trucks.json');

        if (! File::exists($dataPath)) {
            throw new \RuntimeException('Legacy trucks dataset missing.');
        }

        $truckDataset = collect(json_decode(File::get($dataPath), true, 512, JSON_THROW_ON_ERROR));
        $vehicleTypeIds = VehicleType::withTrashed()->pluck('id')->all();

        Truck::withTrashed()->forceDelete();

        $records = $truckDataset->map(function (array $truck) use ($vehicleTypeIds): array {
            $legacyId = (int) ($truck['legacy_id'] ?? 0);
            $plate = Str::of($truck['plate'] ?? '')->trim()->squish();
            $vehicleTypeId = (int) ($truck['vehicle_type_legacy_id'] ?? 0);

            if ($legacyId === 0 || $plate->isEmpty() || $vehicleTypeId === 0) {
                throw new \RuntimeException('Invalid legacy truck payload encountered.');
            }

            if (! in_array($vehicleTypeId, $vehicleTypeIds, true)) {
                throw new \RuntimeException("Legacy truck {$legacyId} references unknown vehicle type {$vehicleTypeId}.");
            }

            $createdAt = $truck['created_at'] ?? now()->toDateTimeString();
            $updatedAt = $truck['updated_at'] ?? $createdAt;
            $deletedAt = $truck['deleted_at'] ?? null;

            return [
                'id' => $legacyId,
                'plate' => (string) $plate,
                'vehicletype_id' => $vehicleTypeId,
                'chasisNumber' => $this->normalizeNullableString($truck['chasis_number'] ?? null),
                'engineNumber' => $this->normalizeNullableString($truck['engine_number'] ?? null),
                'tyreSyze' => $this->normalizeNullableString($truck['tyre_size'] ?? null),
                'serviceIntervalKM' => $this->normalizeInteger($truck['service_interval_km'] ?? null),
                'purchasePrice' => $this->normalizeDecimal($truck['purchase_price'] ?? null),
                'productionDate' => $this->normalizeDate($truck['production_date'] ?? null),
                'serviceStartDate' => $this->normalizeDate($truck['service_start_date'] ?? null),
                'status' => $this->normalizeStatus($truck['status'] ?? null),
                'created_at' => $createdAt,
                'updated_at' => $updatedAt,
                'deleted_at' => $deletedAt,
            ];
        });

        $records->chunk(500)->each(static function ($chunk): void {
            Truck::query()->insert($chunk->all());
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

    private function normalizeInteger(mixed $value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        return (int) round((float) $value);
    }

    private function normalizeDecimal(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        return number_format((float) $value, 2, '.', '');
    }
}
