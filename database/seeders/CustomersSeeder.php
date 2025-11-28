<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class CustomersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $datasetPath = database_path('seeders/data/legacy_customers.json');

        if (! File::exists($datasetPath)) {
            throw new \RuntimeException('Legacy customers dataset missing.');
        }

        $customers = collect(json_decode(
            File::get($datasetPath),
            true,
            512,
            JSON_THROW_ON_ERROR
        ));

        if ($customers->isEmpty()) {
            $this->command?->warn('Legacy customers dataset is empty; skipping CustomersSeeder.');

            return;
        }

        Schema::disableForeignKeyConstraints();
        DB::table('customers')->truncate();
        Schema::enableForeignKeyConstraints();

        $payload = $customers->map(function (array $customer): array {
            $legacyId = (int) ($customer['legacy_id'] ?? 0);
            $name = Str::of($customer['name'] ?? '')->trim()->squish();

            if ($legacyId === 0 || $name->isEmpty()) {
                throw new \RuntimeException('Invalid legacy customer payload encountered.');
            }

            $phone = $this->nullableString($customer['mobile'] ?? null);
            $addressSegments = collect([
                $this->nullableString($customer['address'] ?? null),
                $this->formatLabeledValue('Office', $customer['office_number'] ?? null),
                $this->formatLabeledValue('Remark', $customer['remark'] ?? null),
            ])->filter()->values();

            return [
                'id' => $legacyId,
                'name' => (string) $name,
                'contact_person' => null,
                'phone' => $phone,
                'email' => null,
                'address' => $addressSegments->isEmpty() ? null : $addressSegments->implode(PHP_EOL),
                'status' => ((int) ($customer['status'] ?? 1)) === 1 ? 'active' : 'inactive',
                'created_at' => $customer['created_at'] ?? now(),
                'updated_at' => $customer['updated_at'] ?? now(),
                'deleted_at' => $customer['deleted_at'] ?? null,
            ];
        })->all();

        DB::table('customers')->insert($payload);
    }

    private function nullableString(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $text = Str::of($value)->trim();

        return $text->isEmpty() ? null : (string) $text->squish();
    }

    private function formatLabeledValue(string $label, $value): ?string
    {
        $text = $this->nullableString($value);

        return $text === null ? null : sprintf('%s: %s', $label, $text);
    }
}
