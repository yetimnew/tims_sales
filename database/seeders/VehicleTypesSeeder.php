<?php

namespace Database\Seeders;

use App\Models\VehicleType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class VehicleTypesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $dataPath = database_path('seeders/data/legacy_vehicle_types.json');

        if (! File::exists($dataPath)) {
            throw new \RuntimeException('Legacy vehicle types dataset missing.');
        }

        $vehicleTypeDataset = collect(json_decode(File::get($dataPath), true, 512, JSON_THROW_ON_ERROR));

        $records = $vehicleTypeDataset->map(static function (array $vehicleType): array {
            $legacyId = (int) ($vehicleType['legacy_id'] ?? 0);
            $name = Str::of($vehicleType['name'] ?? '')->trim()->squish();

            if ($legacyId === 0 || $name->isEmpty()) {
                throw new \RuntimeException('Invalid legacy vehicle type payload encountered.');
            }

            $comment = $vehicleType['comment'] ?? null;
            $description = $comment === null ? null : (string) Str::of($comment)->trim()->squish();

            $createdAt = $vehicleType['created_at'] ?? now()->toDateTimeString();
            $updatedAt = $vehicleType['updated_at'] ?? $createdAt;
            $deletedAt = $vehicleType['deleted_at'] ?? null;

            if (($vehicleType['status'] ?? 1) !== 1 && $deletedAt === null) {
                $deletedAt = now()->toDateTimeString();
            }

            return [
                'id' => $legacyId,
                'name' => (string) $name,
                'description' => $description,
                'created_at' => $createdAt,
                'updated_at' => $updatedAt,
                'deleted_at' => $deletedAt,
            ];
        });

        $records->chunk(500)->each(static function ($chunk): void {
            VehicleType::query()->upsert(
                $chunk->all(),
                ['id'],
                ['name', 'description', 'created_at', 'updated_at', 'deleted_at']
            );
        });

        $synchronisedIds = $records->pluck('id')->all();

        if ($synchronisedIds !== []) {
            VehicleType::query()
                ->whereNotIn('id', $synchronisedIds)
                ->whereDoesntHave('trucks')
                ->delete();
        }
    }
}
