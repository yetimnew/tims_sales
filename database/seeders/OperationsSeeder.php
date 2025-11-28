<?php

namespace Database\Seeders;

use App\Enums\CargoServiceType;
use App\Enums\OperationDestinationScope;
use App\Models\CargoType;
use App\Models\Customer;
use App\Models\Region;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class OperationsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $operationsPath = database_path('seeders/data/legacy_operations.json');
        $regionsPath = database_path('seeders/data/legacy_regions.json');

        if (! File::exists($operationsPath)) {
            throw new \RuntimeException('Legacy operations dataset missing.');
        }

        if (! File::exists($regionsPath)) {
            throw new \RuntimeException('Legacy regions dataset required for operations seeding.');
        }

        $operations = collect(json_decode(
            File::get($operationsPath),
            true,
            512,
            JSON_THROW_ON_ERROR
        ));

        if ($operations->isEmpty()) {
            $this->command?->warn('Legacy operations dataset is empty; skipping OperationsSeeder.');

            return;
        }

        $legacyRegions = collect(json_decode(
            File::get($regionsPath),
            true,
            512,
            JSON_THROW_ON_ERROR
        ))->keyBy(fn (array $region) => (int) ($region['legacy_id'] ?? 0));

        $regionsByCode = Region::query()->get()->keyBy(function (Region $region): string {
            return Str::of($region->code)->upper()->value();
        });

        $cargoTypeMap = [
            1 => CargoType::query()->where('name', 'Commercial Cargo')->first(),
            0 => CargoType::query()->where('name', 'Relief Cargo')->first(),
        ];

        if ($cargoTypeMap[1] === null || $cargoTypeMap[0] === null) {
            throw new \RuntimeException('Cargo types "Commercial Cargo" and "Relief Cargo" must exist before running OperationsSeeder.');
        }

        Schema::disableForeignKeyConstraints();
        DB::table('operations')->truncate();
        Schema::enableForeignKeyConstraints();

        $chunks = $operations->chunk(250);

        foreach ($chunks as $chunk) {
            $records = [];

            foreach ($chunk as $operation) {
                $legacyId = (int) ($operation['legacy_id'] ?? 0);
                $operationNumber = Str::of($operation['operationid'] ?? '')->trim();
                $customerId = (int) ($operation['customer_id'] ?? 0);
                $userId = (int) ($operation['user_id'] ?? 0);
                $regionLegacyId = (int) ($operation['region_id'] ?? 0);

                if ($legacyId === 0 || $operationNumber->isEmpty()) {
                    throw new \RuntimeException('Invalid legacy operation payload encountered.');
                }

                if (! Customer::query()->whereKey($customerId)->exists()) {
                    throw new \RuntimeException("Missing customer {$customerId} referenced by legacy operation {$legacyId}.");
                }

                $user = User::query()->find($userId);
                if ($user === null) {
                    throw new \RuntimeException("Missing user {$userId} referenced by legacy operation {$legacyId}.");
                }

                $legacyRegion = $legacyRegions->get($regionLegacyId);
                if ($legacyRegion === null) {
                    throw new \RuntimeException("Missing legacy region {$regionLegacyId} referenced by legacy operation {$legacyId}.");
                }

                $regionCode = Str::of($legacyRegion['code'] ?? '')->trim()->upper();
                $region = $regionsByCode->get($regionCode->value());

                if ($region === null) {
                    throw new \RuntimeException("Region with code {$regionCode} not found for legacy operation {$legacyId}.");
                }

                $cargoTypeId = ($cargoTypeMap[(int) ($operation['cargotype'] ?? 1)] ?? $cargoTypeMap[1])->getKey();
                $cargoServiceType = ((int) ($operation['cargotype'] ?? 1)) === 0
                    ? CargoServiceType::Relief->value
                    : CargoServiceType::Commercial->value;

                $records[] = [
                    'id' => $legacyId,
                    'operationid' => (string) $operationNumber->squish(),
                    'customer_id' => $customerId,
                    'startdate' => $this->asDateString($operation['startdate'] ?? null),
                    'destination_scope' => OperationDestinationScope::Region->value,
                    'destination_name' => $region->name,
                    'destination_reference_type' => $region::class,
                    'destination_reference_id' => $region->getKey(),
                    'volume' => $this->asDecimal($operation['volume'] ?? null),
                    'cargo_type_id' => $cargoTypeId,
                    'cargo_service_type' => $cargoServiceType,
                    'km' => $this->asDecimal($operation['km'] ?? null),
                    'tariff' => $this->asDecimal($operation['tariff'] ?? null),
                    'status' => ((int) ($operation['status'] ?? 1)) === 1 ? 'active' : 'inactive',
                    'closed' => ((int) ($operation['closed'] ?? 0)) === 1,
                    'enddate' => $this->asDateString($operation['enddate'] ?? null),
                    'remark' => $this->nullableString($operation['remark'] ?? null),
                    'user_id' => $user->getKey(),
                    'created_at' => $operation['created_at'] ?? now(),
                    'updated_at' => $operation['updated_at'] ?? now(),
                    'deleted_at' => $operation['deleted_at'] ?? null,
                ];
            }

            DB::table('operations')->insert($records);
        }
    }

    private function asDateString($value): ?string
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

    private function asDecimal($value): string
    {
        if ($value === null || $value === '') {
            return '0.00';
        }

        return number_format((float) $value, 2, '.', '');
    }

    private function nullableString($value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        $text = Str::of((string) $value)->trim();

        return $text->isEmpty() ? null : (string) $text->squish();
    }
}
