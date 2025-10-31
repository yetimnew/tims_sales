<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Truck;
use App\Models\VehicleType;

class AdditionalTrucksSeeder extends Seeder
{
    public function run()
    {
        $vehicleTypes = VehicleType::all();

        $trucks = [
            [
                'plate' => 'BB-44444',
                'vehicletype_id' => $vehicleTypes->where('name', 'Heavy Truck')->first()->id,
                'chasisNumber' => 'CHS006',
                'engineNumber' => 'ENG006',
                'tyreSyze' => '12.00R20',
                'serviceIntervalKM' => 10000,
                'purchasePrice' => 2600000.00,
                'productionDate' => now()->subMonths(15),
                'serviceStartDate' => now()->subMonths(10),
                'status' => 'active',
            ],
            [
                'plate' => 'BB-55555',
                'vehicletype_id' => $vehicleTypes->where('name', 'Medium Truck')->first()->id,
                'chasisNumber' => 'CHS007',
                'engineNumber' => 'ENG007',
                'tyreSyze' => '11.00R20',
                'serviceIntervalKM' => 8000,
                'purchasePrice' => 1900000.00,
                'productionDate' => now()->subMonths(12),
                'serviceStartDate' => now()->subMonths(8),
                'status' => 'maintenance',
            ],
            [
                'plate' => 'BB-66666',
                'vehicletype_id' => $vehicleTypes->where('name', 'Trailer')->first()->id,
                'chasisNumber' => 'CHS008',
                'engineNumber' => 'ENG008',
                'tyreSyze' => '13.00R20',
                'serviceIntervalKM' => 12000,
                'purchasePrice' => 3300000.00,
                'productionDate' => now()->subMonths(20),
                'serviceStartDate' => now()->subMonths(15),
                'status' => 'active',
            ],
            [
                'plate' => 'BB-77777',
                'vehicletype_id' => $vehicleTypes->where('name', 'Tanker')->first()->id,
                'chasisNumber' => 'CHS009',
                'engineNumber' => 'ENG009',
                'tyreSyze' => '12.00R20',
                'serviceIntervalKM' => 10000,
                'purchasePrice' => 2900000.00,
                'productionDate' => now()->subMonths(18),
                'serviceStartDate' => now()->subMonths(12),
                'status' => 'inactive',
            ],
            [
                'plate' => 'BB-88888',
                'vehicletype_id' => $vehicleTypes->where('name', 'Light Truck')->first()->id,
                'chasisNumber' => 'CHS010',
                'engineNumber' => 'ENG010',
                'tyreSyze' => '10.00R20',
                'serviceIntervalKM' => 6000,
                'purchasePrice' => 1300000.00,
                'productionDate' => now()->subMonths(8),
                'serviceStartDate' => now()->subMonths(5),
                'status' => 'active',
            ],
        ];

        foreach ($trucks as $truckData) {
            Truck::firstOrCreate(
                ['plate' => $truckData['plate']],
                $truckData
            );
        }
    }
}
