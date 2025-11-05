<?php

namespace Database\Seeders;

use App\Models\MaintenanceType;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class MaintenanceTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $maintenanceTypes = [
            [
                'name' => 'Oil Change',
                'category' => 'Preventive',
                'interval_km' => 5000,
                'interval_months' => 6,
                'estimated_cost' => 75.00,
                'description' => 'Regular engine oil and filter replacement to maintain optimal engine performance.',
                'is_active' => true,
            ],
            [
                'name' => 'Brake Service',
                'category' => 'Preventive',
                'interval_km' => 25000,
                'interval_months' => 12,
                'estimated_cost' => 150.00,
                'description' => 'Brake pad replacement and brake system inspection.',
                'is_active' => true,
            ],
            [
                'name' => 'Tire Rotation',
                'category' => 'Preventive',
                'interval_km' => 8000,
                'interval_months' => 6,
                'estimated_cost' => 25.00,
                'description' => 'Rotate tires to ensure even wear and extend tire life.',
                'is_active' => true,
            ],
            [
                'name' => 'Engine Tune-up',
                'category' => 'Preventive',
                'interval_km' => 30000,
                'interval_months' => 24,
                'estimated_cost' => 200.00,
                'description' => 'Complete engine maintenance including spark plugs, air filter, and ignition system.',
                'is_active' => true,
            ],
            [
                'name' => 'Transmission Service',
                'category' => 'Preventive',
                'interval_km' => 40000,
                'interval_months' => 24,
                'estimated_cost' => 180.00,
                'description' => 'Transmission fluid change and transmission system inspection.',
                'is_active' => true,
            ],
            [
                'name' => 'Cooling System Service',
                'category' => 'Preventive',
                'interval_km' => 30000,
                'interval_months' => 24,
                'estimated_cost' => 120.00,
                'description' => 'Radiator flush, coolant replacement, and cooling system inspection.',
                'is_active' => true,
            ],
            [
                'name' => 'Battery Replacement',
                'category' => 'Corrective',
                'interval_km' => null,
                'interval_months' => null,
                'estimated_cost' => 150.00,
                'description' => 'Replace faulty or worn-out vehicle battery.',
                'is_active' => true,
            ],
            [
                'name' => 'Emergency Repair',
                'category' => 'Emergency',
                'interval_km' => null,
                'interval_months' => null,
                'estimated_cost' => null,
                'description' => 'Unscheduled emergency repairs due to breakdowns or accidents.',
                'is_active' => true,
            ],
            [
                'name' => 'Air Filter Replacement',
                'category' => 'Preventive',
                'interval_km' => 15000,
                'interval_months' => 12,
                'estimated_cost' => 35.00,
                'description' => 'Replace engine air filter to maintain optimal air flow and fuel efficiency.',
                'is_active' => true,
            ],
            [
                'name' => 'Fuel Filter Replacement',
                'category' => 'Preventive',
                'interval_km' => 30000,
                'interval_months' => 24,
                'estimated_cost' => 50.00,
                'description' => 'Replace fuel filter to ensure clean fuel delivery to the engine.',
                'is_active' => true,
            ],
            [
                'name' => 'Cabin Air Filter',
                'category' => 'Preventive',
                'interval_km' => 15000,
                'interval_months' => 12,
                'estimated_cost' => 30.00,
                'description' => 'Replace cabin air filter to maintain clean air inside the vehicle.',
                'is_active' => true,
            ],
            [
                'name' => 'Wheel Alignment',
                'category' => 'Corrective',
                'interval_km' => null,
                'interval_months' => null,
                'estimated_cost' => 80.00,
                'description' => 'Adjust wheel alignment to ensure proper tire wear and vehicle handling.',
                'is_active' => true,
            ],
        ];

        foreach ($maintenanceTypes as $type) {
            MaintenanceType::create($type);
        }
    }
}
