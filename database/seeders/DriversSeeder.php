<?php

namespace Database\Seeders;

use App\Models\Driver;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class DriversSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $dataPath = database_path('seeders/data/legacy_drivers.json');

        if (! File::exists($dataPath)) {
            throw new \RuntimeException('Legacy drivers dataset missing.');
        }

        $driverDataset = collect(json_decode(File::get($dataPath), true, 512, JSON_THROW_ON_ERROR));

        Driver::withTrashed()->forceDelete();

        $records = $driverDataset->map(function (array $driver): array {
            $legacyId = (int) ($driver['legacy_id'] ?? 0);
            $driverIdentifier = Str::of($driver['driverid'] ?? '')->trim()->squish();
            $name = Str::of($driver['name'] ?? '')->trim()->squish();

            if ($legacyId === 0 || $driverIdentifier->isEmpty() || $name->isEmpty()) {
                throw new \RuntimeException('Invalid legacy driver payload encountered.');
            }

            $status = $this->normalizeStatus($driver['status'] ?? null);
            $createdAt = $driver['created_at'] ?? now()->toDateTimeString();
            $updatedAt = $driver['updated_at'] ?? $createdAt;
            $deletedAt = $driver['deleted_at'] ?? null;

            return [
                'id' => $legacyId,
                'driverid' => (string) $driverIdentifier,
                'name' => (string) $name,
                'sex' => $this->normalizeSex($driver['sex'] ?? null),
                'birthdate' => $this->normalizeDate($driver['birthdate'] ?? null),
                'zone' => $this->normalizeNullableString($driver['zone'] ?? null),
                'woreda' => $this->normalizeNullableString($driver['woreda'] ?? null),
                'kebele' => $this->normalizeNullableString($driver['kebele'] ?? null),
                'housenumber' => $this->normalizeNullableString($driver['housenumber'] ?? null),
                'mobile' => $this->normalizeNullableString($driver['mobile'] ?? null),
                'hireddate' => $this->normalizeDate($driver['hireddate'] ?? null),
                'status' => $status,
                'created_at' => $createdAt,
                'updated_at' => $updatedAt,
                'deleted_at' => $deletedAt,
            ];
        });

        $records->chunk(500)->each(static function ($chunk): void {
            Driver::query()->insert($chunk->all());
        });
    }

    private function normalizeSex(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $sex = Str::of((string) $value)->trim()->lower();

        if ($sex->isEmpty()) {
            return null;
        }

        return match ((string) $sex) {
            'male', 'm' => 'male',
            'female', 'f' => 'female',
            default => (string) $sex,
        };
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
}
