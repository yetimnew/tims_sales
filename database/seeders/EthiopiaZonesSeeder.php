<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Zone;
use App\Models\Region;

class EthiopiaZonesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $zones = [
            // Addis Ababa Zones
            ['region' => 'AA', 'name' => 'Addis Ababa Zone', 'code' => 'AA-ZONE'],

            // Afar Zones
            ['region' => 'AF', 'name' => 'Zone 1', 'code' => 'AF-Z1'],
            ['region' => 'AF', 'name' => 'Zone 2', 'code' => 'AF-Z2'],
            ['region' => 'AF', 'name' => 'Zone 3', 'code' => 'AF-Z3'],
            ['region' => 'AF', 'name' => 'Zone 4', 'code' => 'AF-Z4'],
            ['region' => 'AF', 'name' => 'Zone 5', 'code' => 'AF-Z5'],

            // Amhara Zones
            ['region' => 'AM', 'name' => 'North Gondar', 'code' => 'AM-NG'],
            ['region' => 'AM', 'name' => 'South Gondar', 'code' => 'AM-SG'],
            ['region' => 'AM', 'name' => 'North Wollo', 'code' => 'AM-NW'],
            ['region' => 'AM', 'name' => 'South Wollo', 'code' => 'AM-SW'],
            ['region' => 'AM', 'name' => 'North Shewa', 'code' => 'AM-NS'],
            ['region' => 'AM', 'name' => 'East Gojjam', 'code' => 'AM-EG'],
            ['region' => 'AM', 'name' => 'West Gojjam', 'code' => 'AM-WG'],
            ['region' => 'AM', 'name' => 'Awi', 'code' => 'AM-AW'],
            ['region' => 'AM', 'name' => 'Oromia Special Zone', 'code' => 'AM-OS'],
            ['region' => 'AM', 'name' => 'Bahir Dar Special Zone', 'code' => 'AM-BD'],

            // Benishangul-Gumuz Zones
            ['region' => 'BG', 'name' => 'Asosa', 'code' => 'BG-AS'],
            ['region' => 'BG', 'name' => 'Kamashi', 'code' => 'BG-KA'],
            ['region' => 'BG', 'name' => 'Metekel', 'code' => 'BG-ME'],

            // Dire Dawa Zones
            ['region' => 'DD', 'name' => 'Dire Dawa Zone', 'code' => 'DD-ZONE'],

            // Gambela Zones
            ['region' => 'GA', 'name' => 'Anuak', 'code' => 'GA-AN'],
            ['region' => 'GA', 'name' => 'Nuer', 'code' => 'GA-NU'],

            // Harari Zones
            ['region' => 'HA', 'name' => 'Harari Zone', 'code' => 'HA-ZONE'],

            // Oromia Zones (Major ones)
            ['region' => 'OR', 'name' => 'East Shewa', 'code' => 'OR-ES'],
            ['region' => 'OR', 'name' => 'West Shewa', 'code' => 'OR-WS'],
            ['region' => 'OR', 'name' => 'North Shewa', 'code' => 'OR-NS'],
            ['region' => 'OR', 'name' => 'South West Shewa', 'code' => 'OR-SWS'],
            ['region' => 'OR', 'name' => 'Arsi', 'code' => 'OR-AR'],
            ['region' => 'OR', 'name' => 'Bale', 'code' => 'OR-BA'],
            ['region' => 'OR', 'name' => 'Borena', 'code' => 'OR-BO'],
            ['region' => 'OR', 'name' => 'East Hararghe', 'code' => 'OR-EH'],
            ['region' => 'OR', 'name' => 'West Hararghe', 'code' => 'OR-WH'],
            ['region' => 'OR', 'name' => 'Illubabor', 'code' => 'OR-IL'],
            ['region' => 'OR', 'name' => 'Jimma', 'code' => 'OR-JI'],
            ['region' => 'OR', 'name' => 'Kelem Wollega', 'code' => 'OR-KW'],
            ['region' => 'OR', 'name' => 'West Wollega', 'code' => 'OR-WW'],
            ['region' => 'OR', 'name' => 'East Wollega', 'code' => 'OR-EW'],
            ['region' => 'OR', 'name' => 'Horo Guduru Wollega', 'code' => 'OR-HG'],
            ['region' => 'OR', 'name' => 'West Guji', 'code' => 'OR-WG'],
            ['region' => 'OR', 'name' => 'Guji', 'code' => 'OR-GU'],
            ['region' => 'OR', 'name' => 'Gedeo', 'code' => 'OR-GE'],
            ['region' => 'OR', 'name' => 'West Guji', 'code' => 'OR-WG2'],

            // Sidama Zones
            ['region' => 'SI', 'name' => 'Sidama Zone', 'code' => 'SI-ZONE'],

            // Somali Zones
            ['region' => 'SO', 'name' => 'Sitti', 'code' => 'SO-SI'],
            ['region' => 'SO', 'name' => 'Fafan', 'code' => 'SO-FA'],
            ['region' => 'SO', 'name' => 'Jarar', 'code' => 'SO-JA'],
            ['region' => 'SO', 'name' => 'Erer', 'code' => 'SO-ER'],
            ['region' => 'SO', 'name' => 'Nogob', 'code' => 'SO-NO'],
            ['region' => 'SO', 'name' => 'Dollo', 'code' => 'SO-DO'],
            ['region' => 'SO', 'name' => 'Korahe', 'code' => 'SO-KO'],
            ['region' => 'SO', 'name' => 'Shabelle', 'code' => 'SO-SH'],
            ['region' => 'SO', 'name' => 'Afder', 'code' => 'SO-AF'],
            ['region' => 'SO', 'name' => 'Liben', 'code' => 'SO-LI'],
            ['region' => 'SO', 'name' => 'Dawa', 'code' => 'SO-DA'],

            // South West Ethiopia Zones
            ['region' => 'SW', 'name' => 'Keffa', 'code' => 'SW-KE'],
            ['region' => 'SW', 'name' => 'Sheka', 'code' => 'SW-SH'],
            ['region' => 'SW', 'name' => 'Bench Sheko', 'code' => 'SW-BS'],
            ['region' => 'SW', 'name' => 'Dawro', 'code' => 'SW-DA'],
            ['region' => 'SW', 'name' => 'West Omo', 'code' => 'SW-WO'],
            ['region' => 'SW', 'name' => 'Konta', 'code' => 'SW-KO'],

            // SNNPR Zones (Major ones)
            ['region' => 'SN', 'name' => 'Gurage', 'code' => 'SN-GU'],
            ['region' => 'SN', 'name' => 'Siltie', 'code' => 'SN-SI'],
            ['region' => 'SN', 'name' => 'Hadiya', 'code' => 'SN-HA'],
            ['region' => 'SN', 'name' => 'Kembata Tembaro', 'code' => 'SN-KT'],
            ['region' => 'SN', 'name' => 'Wolayita', 'code' => 'SN-WO'],
            ['region' => 'SN', 'name' => 'Gamo Gofa', 'code' => 'SN-GG'],
            ['region' => 'SN', 'name' => 'South Omo', 'code' => 'SN-SO'],
            ['region' => 'SN', 'name' => 'Konso', 'code' => 'SN-KO'],
            ['region' => 'SN', 'name' => 'Amaro', 'code' => 'SN-AM'],
            ['region' => 'SN', 'name' => 'Burji', 'code' => 'SN-BU'],
            ['region' => 'SN', 'name' => 'Derashe', 'code' => 'SN-DE'],
            ['region' => 'SN', 'name' => 'Konso', 'code' => 'SN-KO2'],
            ['region' => 'SN', 'name' => 'Amaro', 'code' => 'SN-AM2'],
            ['region' => 'SN', 'name' => 'Burji', 'code' => 'SN-BU2'],
            ['region' => 'SN', 'name' => 'Derashe', 'code' => 'SN-DE2'],

            // Tigray Zones
            ['region' => 'TI', 'name' => 'Central', 'code' => 'TI-CE'],
            ['region' => 'TI', 'name' => 'Eastern', 'code' => 'TI-EA'],
            ['region' => 'TI', 'name' => 'North Western', 'code' => 'TI-NW'],
            ['region' => 'TI', 'name' => 'Southern', 'code' => 'TI-SO'],
            ['region' => 'TI', 'name' => 'South Eastern', 'code' => 'TI-SE'],
            ['region' => 'TI', 'name' => 'Western', 'code' => 'TI-WE'],

            // Central Ethiopia Zones
            ['region' => 'CE', 'name' => 'East Gurage', 'code' => 'CE-EG'],
            ['region' => 'CE', 'name' => 'Gurage', 'code' => 'CE-GU'],
            ['region' => 'CE', 'name' => 'Hadiya', 'code' => 'CE-HA'],
            ['region' => 'CE', 'name' => 'Halaba', 'code' => 'CE-HL'],
            ['region' => 'CE', 'name' => 'Kembata', 'code' => 'CE-KE'],
            ['region' => 'CE', 'name' => 'Siltie', 'code' => 'CE-SI'],
            ['region' => 'CE', 'name' => 'Wolayita', 'code' => 'CE-WO'],
        ];

        foreach ($zones as $zoneData) {
            $region = Region::where('code', $zoneData['region'])->first();
            if ($region) {
                Zone::updateOrCreate(
                    ['code' => $zoneData['code']],
                    [
                        'name' => $zoneData['name'],
                        'code' => $zoneData['code'],
                        'region_id' => $region->id,
                        'description' => "Zone in {$region->name} region"
                    ]
                );
            }
        }
    }
}
