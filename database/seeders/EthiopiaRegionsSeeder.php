<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Region;

class EthiopiaRegionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $regions = [
            [
                'name' => 'Addis Ababa',
                'code' => 'AA',
                'description' => 'Capital city and chartered city of Ethiopia'
            ],
            [
                'name' => 'Afar',
                'code' => 'AF',
                'description' => 'Regional state in northeastern Ethiopia'
            ],
            [
                'name' => 'Amhara',
                'code' => 'AM',
                'description' => 'Regional state in northern Ethiopia'
            ],
            [
                'name' => 'Benishangul-Gumuz',
                'code' => 'BG',
                'description' => 'Regional state in western Ethiopia'
            ],
            [
                'name' => 'Dire Dawa',
                'code' => 'DD',
                'description' => 'Chartered city in eastern Ethiopia'
            ],
            [
                'name' => 'Gambela',
                'code' => 'GA',
                'description' => 'Regional state in western Ethiopia'
            ],
            [
                'name' => 'Harari',
                'code' => 'HA',
                'description' => 'Regional state in eastern Ethiopia'
            ],
            [
                'name' => 'Oromia',
                'code' => 'OR',
                'description' => 'Largest regional state in Ethiopia'
            ],
            [
                'name' => 'Sidama',
                'code' => 'SI',
                'description' => 'Regional state in southern Ethiopia'
            ],
            [
                'name' => 'Somali',
                'code' => 'SO',
                'description' => 'Regional state in eastern Ethiopia'
            ],
            [
                'name' => 'South West Ethiopia',
                'code' => 'SW',
                'description' => 'Regional state in southwestern Ethiopia'
            ],
            [
                'name' => 'Southern Nations, Nationalities, and Peoples',
                'code' => 'SN',
                'description' => 'Regional state in southern Ethiopia'
            ],
            [
                'name' => 'Tigray',
                'code' => 'TI',
                'description' => 'Regional state in northern Ethiopia'
            ],
            [
                'name' => 'Central Ethiopia',
                'code' => 'CE',
                'description' => 'Regional state in central Ethiopia'
            ]
        ];

        foreach ($regions as $region) {
            Region::updateOrCreate(
                ['code' => $region['code']],
                $region
            );
        }
    }
}
