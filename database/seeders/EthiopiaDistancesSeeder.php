<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Distance;
use App\Models\Place;

class EthiopiaDistancesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $distances = [
            // Addis Ababa to major cities
            ['from' => 'AA-BA', 'to' => 'OR-AC', 'distance_km' => 99.5, 'estimated_time_hours' => 1.5],
            ['from' => 'AA-BA', 'to' => 'AM-BU', 'distance_km' => 565.0, 'estimated_time_hours' => 8.0],
            ['from' => 'AA-BA', 'to' => 'TI-MU', 'distance_km' => 783.0, 'estimated_time_hours' => 12.0],
            ['from' => 'AA-BA', 'to' => 'SO-JU', 'distance_km' => 635.0, 'estimated_time_hours' => 10.0],
            ['from' => 'AA-BA', 'to' => 'HA-HU', 'distance_km' => 525.0, 'estimated_time_hours' => 8.5],
            ['from' => 'AA-BA', 'to' => 'DD-DA', 'distance_km' => 515.0, 'estimated_time_hours' => 8.0],
            ['from' => 'AA-BA', 'to' => 'GA-GU', 'distance_km' => 557.0, 'estimated_time_hours' => 9.0],
            ['from' => 'AA-BA', 'to' => 'SI-HU', 'distance_km' => 275.0, 'estimated_time_hours' => 4.5],

            // Addis Ababa to industrial zones
            ['from' => 'AA-BA', 'to' => 'OR-AI', 'distance_km' => 99.5, 'estimated_time_hours' => 1.5],
            ['from' => 'AA-BA', 'to' => 'OR-BI', 'distance_km' => 47.0, 'estimated_time_hours' => 1.0],
            ['from' => 'AA-BA', 'to' => 'OR-MD', 'distance_km' => 70.0, 'estimated_time_hours' => 1.2],
            ['from' => 'AA-BA', 'to' => 'SI-HI', 'distance_km' => 275.0, 'estimated_time_hours' => 4.5],

            // Regional capitals to nearby cities
            ['from' => 'AM-BU', 'to' => 'AM-DU', 'distance_km' => 180.0, 'estimated_time_hours' => 3.0],
            ['from' => 'AM-BU', 'to' => 'AM-GU', 'distance_km' => 180.0, 'estimated_time_hours' => 3.0],
            ['from' => 'TI-MU', 'to' => 'TI-AU', 'distance_km' => 120.0, 'estimated_time_hours' => 2.0],
            ['from' => 'TI-MU', 'to' => 'TI-WM', 'distance_km' => 50.0, 'estimated_time_hours' => 1.0],

            // Industrial zones connections
            ['from' => 'OR-AI', 'to' => 'OR-BI', 'distance_km' => 52.5, 'estimated_time_hours' => 1.0],
            ['from' => 'OR-AI', 'to' => 'OR-MD', 'distance_km' => 29.5, 'estimated_time_hours' => 0.5],
            ['from' => 'OR-BI', 'to' => 'AA-BA', 'distance_km' => 47.0, 'estimated_time_hours' => 1.0],

            // Port connections
            ['from' => 'AM-BP', 'to' => 'AM-BU', 'distance_km' => 5.0, 'estimated_time_hours' => 0.2],
            ['from' => 'GA-GP', 'to' => 'GA-GU', 'distance_km' => 3.0, 'estimated_time_hours' => 0.1],
            ['from' => 'DD-DR', 'to' => 'DD-DA', 'distance_km' => 8.0, 'estimated_time_hours' => 0.3],

            // University connections
            ['from' => 'AM-GU', 'to' => 'AM-GC', 'distance_km' => 2.0, 'estimated_time_hours' => 0.1],
            ['from' => 'TI-MU', 'to' => 'TI-MI', 'distance_km' => 15.0, 'estimated_time_hours' => 0.5],
            ['from' => 'SN-WU', 'to' => 'SN-WO', 'distance_km' => 1.0, 'estimated_time_hours' => 0.1],

            // Market connections
            ['from' => 'AA-ME', 'to' => 'AA-PI', 'distance_km' => 3.0, 'estimated_time_hours' => 0.2],
            ['from' => 'AA-ME', 'to' => 'AA-MS', 'distance_km' => 2.0, 'estimated_time_hours' => 0.1],
            ['from' => 'SO-JM', 'to' => 'SO-JU', 'distance_km' => 1.0, 'estimated_time_hours' => 0.1],

            // Airport connections
            ['from' => 'AA-BA', 'to' => 'AA-ME', 'distance_km' => 8.0, 'estimated_time_hours' => 0.5],
            ['from' => 'AA-BA', 'to' => 'AA-PI', 'distance_km' => 12.0, 'estimated_time_hours' => 0.8],
            ['from' => 'DD-DA', 'to' => 'DD-DI', 'distance_km' => 15.0, 'estimated_time_hours' => 0.5],

            // Cross-regional connections
            ['from' => 'AM-BU', 'to' => 'TI-MU', 'distance_km' => 218.0, 'estimated_time_hours' => 4.0],
            ['from' => 'TI-MU', 'to' => 'SO-JU', 'distance_km' => 152.0, 'estimated_time_hours' => 2.5],
            ['from' => 'SO-JU', 'to' => 'HA-HU', 'distance_km' => 110.0, 'estimated_time_hours' => 1.8],
            ['from' => 'HA-HU', 'to' => 'DD-DA', 'distance_km' => 10.0, 'estimated_time_hours' => 0.3],

            // Industrial zone connections
            ['from' => 'AA-KI', 'to' => 'OR-AI', 'distance_km' => 91.5, 'estimated_time_hours' => 1.3],
            ['from' => 'OR-AI', 'to' => 'OR-WI', 'distance_km' => 45.0, 'estimated_time_hours' => 0.8],
            ['from' => 'SI-HI', 'to' => 'SI-YM', 'distance_km' => 30.0, 'estimated_time_hours' => 0.5],

            // University to university connections
            ['from' => 'AM-BU', 'to' => 'AM-DU', 'distance_km' => 180.0, 'estimated_time_hours' => 3.0],
            ['from' => 'TI-MU', 'to' => 'TI-AU', 'distance_km' => 120.0, 'estimated_time_hours' => 2.0],
            ['from' => 'SN-WU', 'to' => 'SN-SU', 'distance_km' => 150.0, 'estimated_time_hours' => 2.5],
            ['from' => 'SN-SU', 'to' => 'SN-AU', 'distance_km' => 120.0, 'estimated_time_hours' => 2.0],

            // Return routes (reverse distances)
            ['from' => 'OR-AC', 'to' => 'AA-BA', 'distance_km' => 99.5, 'estimated_time_hours' => 1.5],
            ['from' => 'AM-BU', 'to' => 'AA-BA', 'distance_km' => 565.0, 'estimated_time_hours' => 8.0],
            ['from' => 'TI-MU', 'to' => 'AA-BA', 'distance_km' => 783.0, 'estimated_time_hours' => 12.0],
            ['from' => 'SO-JU', 'to' => 'AA-BA', 'distance_km' => 635.0, 'estimated_time_hours' => 10.0],
            ['from' => 'HA-HU', 'to' => 'AA-BA', 'distance_km' => 525.0, 'estimated_time_hours' => 8.5],
            ['from' => 'DD-DA', 'to' => 'AA-BA', 'distance_km' => 515.0, 'estimated_time_hours' => 8.0],
            ['from' => 'GA-GU', 'to' => 'AA-BA', 'distance_km' => 557.0, 'estimated_time_hours' => 9.0],
            ['from' => 'SI-HU', 'to' => 'AA-BA', 'distance_km' => 275.0, 'estimated_time_hours' => 4.5],
        ];

        foreach ($distances as $distanceData) {
            $fromPlace = Place::where('code', $distanceData['from'])->first();
            $toPlace = Place::where('code', $distanceData['to'])->first();

            if ($fromPlace && $toPlace) {
                Distance::updateOrCreate(
                    [
                        'from_place_id' => $fromPlace->id,
                        'to_place_id' => $toPlace->id,
                    ],
                    [
                        'distance_km' => $distanceData['distance_km'],
                        'estimated_time_hours' => $distanceData['estimated_time_hours'],
                        'route_description' => "Route from {$fromPlace->name} to {$toPlace->name}"
                    ]
                );
            }
        }
    }
}
