<?php

namespace Database\Seeders;

use App\Enums\CargoCategory;
use App\Models\CargoType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CargoTypesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Schema::disableForeignKeyConstraints();
        DB::table('cargo_types')->truncate();
        Schema::enableForeignKeyConstraints();

        $definitions = [
            [
                'name' => 'Commercial Cargo',
                'category' => CargoCategory::General->value,
                'weight_per_cubic_meter' => 1000.00,
                'handling_requirements' => 'Standard handling procedures',
                'safety_requirements' => 'Basic safety protocols',
                'requires_special_equipment' => false,
            ],
            [
                'name' => 'Relief Cargo',
                'category' => CargoCategory::General->value,
                'weight_per_cubic_meter' => 850.00,
                'handling_requirements' => 'Coordinated with relief agencies',
                'safety_requirements' => 'Emergency response preparedness',
                'requires_special_equipment' => false,
            ],
        ];

        foreach ($definitions as $definition) {
            CargoType::updateOrCreate(
                ['name' => $definition['name']],
                $definition
            );
        }
    }
}
