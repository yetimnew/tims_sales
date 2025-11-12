<?php

namespace Database\Seeders;

use App\Enums\CargoCategory;
use App\Models\CargoType;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CargoTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $cargoTypes = [
            // Construction Materials
            [
                'name' => 'Cement',
                'category' => CargoCategory::Construction->value,
                'weight_per_cubic_meter' => 1500.00,
                'handling_requirements' => 'Handle with care to avoid breakage, Use protective gloves, Store in dry conditions',
                'safety_requirements' => 'Wear safety goggles, Avoid inhalation of dust, Wash hands after handling',
                'requires_special_equipment' => false,
            ],
            [
                'name' => 'Sand',
                'category' => CargoCategory::Construction->value,
                'weight_per_cubic_meter' => 1600.00,
                'handling_requirements' => 'Use appropriate shovels, Avoid contamination with foreign materials',
                'safety_requirements' => 'Wear dust mask, Avoid eye contact',
                'requires_special_equipment' => false,
            ],
            [
                'name' => 'Gravel',
                'category' => CargoCategory::Construction->value,
                'weight_per_cubic_meter' => 1700.00,
                'handling_requirements' => 'Use heavy machinery for loading, Secure properly during transport',
                'safety_requirements' => 'Wear safety boots, Use hearing protection near machinery',
                'requires_special_equipment' => false,
            ],
            [
                'name' => 'Steel Rebars',
                'category' => CargoCategory::Construction->value,
                'weight_per_cubic_meter' => 7850.00,
                'handling_requirements' => 'Use cranes or forklifts, Secure with straps, Avoid bending',
                'safety_requirements' => 'Wear steel-toed boots, Use gloves, Avoid sharp edges',
                'requires_special_equipment' => true,
            ],
            [
                'name' => 'Bricks',
                'category' => CargoCategory::Construction->value,
                'weight_per_cubic_meter' => 1800.00,
                'handling_requirements' => 'Stack carefully to avoid breakage, Use pallets for transport',
                'safety_requirements' => 'Wear safety gloves, Avoid dropping from height',
                'requires_special_equipment' => false,
            ],

            // Agricultural Products
            [
                'name' => 'Wheat',
                'category' => CargoCategory::Agricultural->value,
                'weight_per_cubic_meter' => 750.00,
                'handling_requirements' => 'Store in cool, dry conditions, Use sealed containers',
                'safety_requirements' => 'Wear dust mask, Avoid moisture contamination',
                'requires_special_equipment' => false,
            ],
            [
                'name' => 'Rice',
                'category' => CargoCategory::Agricultural->value,
                'weight_per_cubic_meter' => 850.00,
                'handling_requirements' => 'Keep away from moisture, Use clean storage',
                'safety_requirements' => 'Wear protective clothing, Avoid inhalation',
                'requires_special_equipment' => false,
            ],
            [
                'name' => 'Corn',
                'category' => CargoCategory::Agricultural->value,
                'weight_per_cubic_meter' => 720.00,
                'handling_requirements' => 'Store in ventilated area, Protect from pests',
                'safety_requirements' => 'Wear gloves, Avoid dust exposure',
                'requires_special_equipment' => false,
            ],
            [
                'name' => 'Fertilizer',
                'category' => CargoCategory::Agricultural->value,
                'weight_per_cubic_meter' => 1200.00,
                'handling_requirements' => 'Keep separate from seeds, Store in dry area',
                'safety_requirements' => 'Wear protective gear, Avoid skin contact, Use in well-ventilated area',
                'requires_special_equipment' => false,
            ],

            // Industrial Materials
            [
                'name' => 'Machinery Parts',
                'category' => CargoCategory::Industrial->value,
                'weight_per_cubic_meter' => 2500.00,
                'handling_requirements' => 'Use forklifts or cranes, Secure with straps, Handle with care',
                'safety_requirements' => 'Wear safety gear, Avoid sharp edges, Use proper lifting techniques',
                'requires_special_equipment' => true,
            ],
            [
                'name' => 'Chemicals',
                'category' => CargoCategory::Industrial->value,
                'weight_per_cubic_meter' => 1300.00,
                'handling_requirements' => 'Store in approved containers, Keep away from heat sources',
                'safety_requirements' => 'Wear chemical-resistant clothing, Use PPE, Handle with care',
                'requires_special_equipment' => true,
            ],
            [
                'name' => 'Electronic Components',
                'category' => CargoCategory::Industrial->value,
                'weight_per_cubic_meter' => 800.00,
                'handling_requirements' => 'Handle with electrostatic protection, Store in climate-controlled environment',
                'safety_requirements' => 'Wear anti-static wristbands, Avoid static discharge',
                'requires_special_equipment' => true,
            ],
            [
                'name' => 'Metal Sheets',
                'category' => CargoCategory::Industrial->value,
                'weight_per_cubic_meter' => 7800.00,
                'handling_requirements' => 'Use magnetic lifters, Secure with straps, Avoid bending',
                'safety_requirements' => 'Wear cut-resistant gloves, Use proper lifting equipment',
                'requires_special_equipment' => true,
            ],
            [
                'name' => 'Plastic Pellets',
                'category' => CargoCategory::Industrial->value,
                'weight_per_cubic_meter' => 600.00,
                'handling_requirements' => 'Store in cool, dry conditions, Use sealed containers',
                'safety_requirements' => 'Wear dust mask, Avoid ignition sources',
                'requires_special_equipment' => false,
            ],
        ];

        foreach ($cargoTypes as $cargoType) {
            CargoType::create($cargoType);
        }
    }
}
