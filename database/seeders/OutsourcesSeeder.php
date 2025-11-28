<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class OutsourcesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $datasetPath = database_path('seeders/data/legacy_outsources.json');

        if (! File::exists($datasetPath)) {
            throw new \RuntimeException('Legacy outsources dataset missing.');
        }

        $outsources = collect(json_decode(
            File::get($datasetPath),
            true,
            512,
            JSON_THROW_ON_ERROR
        ));

        if ($outsources->isEmpty()) {
            $this->command?->warn('Legacy outsources dataset is empty; skipping OutsourcesSeeder.');

            return;
        }

        Schema::disableForeignKeyConstraints();
        DB::table('outsources')->truncate();
        Schema::enableForeignKeyConstraints();

        $payload = $outsources->map(function (array $outsource): array {
            $legacyId = (int) ($outsource['legacy_id'] ?? 0);
            $name = Str::of($outsource['name'] ?? '')->trim()->squish();

            if ($legacyId === 0 || $name->isEmpty()) {
                throw new \RuntimeException('Invalid legacy outsource payload encountered.');
            }

            $phone = $this->nullableString($outsource['mobile'] ?? null);

            $addressSegments = collect([
                $this->nullableString($outsource['address'] ?? null),
                $this->formatLabeledValue('Office', $outsource['office_number'] ?? null),
                $this->formatLabeledValue('Remark', $outsource['remark'] ?? null),
            ])->filter()->values();

            return [
                'id' => $legacyId,
                'name' => (string) $name,
                'contact_person' => null,
                'phone' => $phone,
                'email' => null,
                'address' => $addressSegments->isEmpty() ? null : $addressSegments->implode(PHP_EOL),
                'service_type' => null,
                'status' => ((int) ($outsource['status'] ?? 1)) === 1 ? 'active' : 'inactive',
                'created_at' => $outsource['created_at'] ?? now(),
                'updated_at' => $outsource['updated_at'] ?? now(),
                'deleted_at' => $outsource['deleted_at'] ?? null,
            ];
        })->chunk(500);

        $payload->each(static function ($chunk): void {
            DB::table('outsources')->insert($chunk->all());
        });
    }

    private function nullableString(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $text = Str::of((string) $value)->trim();

        return $text->isEmpty() ? null : (string) $text->squish();
    }

    private function formatLabeledValue(string $label, $value): ?string
    {
        $text = $this->nullableString($value);

        return $text === null ? null : sprintf('%s: %s', $label, $text);
    }
}
