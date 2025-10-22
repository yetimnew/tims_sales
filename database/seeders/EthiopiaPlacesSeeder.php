<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Place;
use App\Models\Woreda;

class EthiopiaPlacesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $places = [
            // Addis Ababa Places
            ['woreda' => 'AA-BO', 'name' => 'Bole Airport', 'code' => 'AA-BA', 'latitude' => 8.9779, 'longitude' => 38.7993],
            ['woreda' => 'AA-AK', 'name' => 'Mercato', 'code' => 'AA-ME', 'latitude' => 9.0054, 'longitude' => 38.7636],
            ['woreda' => 'AA-AR', 'name' => 'Piazza', 'code' => 'AA-PI', 'latitude' => 9.0400, 'longitude' => 38.7500],
            ['woreda' => 'AA-KI', 'name' => 'Meskel Square', 'code' => 'AA-MS', 'latitude' => 9.0054, 'longitude' => 38.7636],
            ['woreda' => 'AA-YE', 'name' => 'Cazanchis', 'code' => 'AA-CA', 'latitude' => 9.0000, 'longitude' => 38.7500],
            ['woreda' => 'AA-NS', 'name' => 'Kality Industrial Zone', 'code' => 'AA-KI', 'latitude' => 8.9500, 'longitude' => 38.8000],

            // Oromia - East Shewa Places
            ['woreda' => 'OR-AD', 'name' => 'Adama Industrial Zone', 'code' => 'OR-AI', 'latitude' => 8.5500, 'longitude' => 39.2667],
            ['woreda' => 'OR-AD', 'name' => 'Adama City Center', 'code' => 'OR-AC', 'latitude' => 8.5500, 'longitude' => 39.2667],
            ['woreda' => 'OR-BI', 'name' => 'Bishoftu Industrial Park', 'code' => 'OR-BI', 'latitude' => 8.7500, 'longitude' => 38.9833],
            ['woreda' => 'OR-MO', 'name' => 'Modjo Dry Port', 'code' => 'OR-MD', 'latitude' => 8.6000, 'longitude' => 39.1167],

            // Oromia - West Shewa Places
            ['woreda' => 'OR-AM', 'name' => 'Ambo University', 'code' => 'OR-AU', 'latitude' => 8.9833, 'longitude' => 37.8500],
            ['woreda' => 'OR-AM', 'name' => 'Ambo Town Center', 'code' => 'OR-AT', 'latitude' => 8.9833, 'longitude' => 37.8500],
            ['woreda' => 'OR-WA', 'name' => 'Waliso Industrial Zone', 'code' => 'OR-WI', 'latitude' => 8.5333, 'longitude' => 37.9667],

            // Amhara - North Gondar Places
            ['woreda' => 'AM-GO', 'name' => 'Gondar University', 'code' => 'AM-GU', 'latitude' => 12.6000, 'longitude' => 37.4667],
            ['woreda' => 'AM-GO', 'name' => 'Gondar Castle', 'code' => 'AM-GC', 'latitude' => 12.6000, 'longitude' => 37.4667],
            ['woreda' => 'AM-DE', 'name' => 'Debark Market', 'code' => 'AM-DM', 'latitude' => 13.1333, 'longitude' => 37.9000],

            // Amhara - South Gondar Places
            ['woreda' => 'AM-BD', 'name' => 'Bahir Dar University', 'code' => 'AM-BU', 'latitude' => 11.6000, 'longitude' => 37.3833],
            ['woreda' => 'AM-BD', 'name' => 'Bahir Dar Port', 'code' => 'AM-BP', 'latitude' => 11.6000, 'longitude' => 37.3833],
            ['woreda' => 'AM-BD', 'name' => 'Tana Hotel', 'code' => 'AM-TH', 'latitude' => 11.6000, 'longitude' => 37.3833],

            // Amhara - North Shewa Places
            ['woreda' => 'AM-DB', 'name' => 'Debre Berhan University', 'code' => 'AM-DU', 'latitude' => 9.6833, 'longitude' => 39.5333],
            ['woreda' => 'AM-DB', 'name' => 'Debre Berhan Market', 'code' => 'AM-DM', 'latitude' => 9.6833, 'longitude' => 39.5333],

            // Tigray Places
            ['woreda' => 'TI-ME', 'name' => 'Mekelle University', 'code' => 'TI-MU', 'latitude' => 13.5000, 'longitude' => 39.4667],
            ['woreda' => 'TI-ME', 'name' => 'Mekelle Industrial Zone', 'code' => 'TI-MI', 'latitude' => 13.5000, 'longitude' => 39.4667],
            ['woreda' => 'TI-AD', 'name' => 'Adigrat University', 'code' => 'TI-AU', 'latitude' => 14.2667, 'longitude' => 39.4667],
            ['woreda' => 'TI-WU', 'name' => 'Wukro Market', 'code' => 'TI-WM', 'latitude' => 13.7833, 'longitude' => 39.6000],

            // SNNPR Places
            ['woreda' => 'SN-WO', 'name' => 'Wolkite University', 'code' => 'SN-WU', 'latitude' => 8.2833, 'longitude' => 37.7833],
            ['woreda' => 'SN-SO', 'name' => 'Sodo University', 'code' => 'SN-SU', 'latitude' => 6.8667, 'longitude' => 37.7667],
            ['woreda' => 'SN-AM', 'name' => 'Arba Minch University', 'code' => 'SN-AU', 'latitude' => 6.0333, 'longitude' => 37.5500],
            ['woreda' => 'SN-JI', 'name' => 'Jinka Market', 'code' => 'SN-JM', 'latitude' => 5.7833, 'longitude' => 36.5667],

            // Somali Places
            ['woreda' => 'SO-JI', 'name' => 'Jigjiga University', 'code' => 'SO-JU', 'latitude' => 9.3500, 'longitude' => 42.8000],
            ['woreda' => 'SO-JI', 'name' => 'Jigjiga Market', 'code' => 'SO-JM', 'latitude' => 9.3500, 'longitude' => 42.8000],
            ['woreda' => 'SO-KB', 'name' => 'Kebri Beyah Port', 'code' => 'SO-KP', 'latitude' => 9.6833, 'longitude' => 43.0333],

            // Harari Places
            ['woreda' => 'HA-HA', 'name' => 'Harar University', 'code' => 'HA-HU', 'latitude' => 9.3167, 'longitude' => 42.1167],
            ['woreda' => 'HA-HA', 'name' => 'Harar Old City', 'code' => 'HA-HC', 'latitude' => 9.3167, 'longitude' => 42.1167],

            // Dire Dawa Places
            ['woreda' => 'DD-DD', 'name' => 'Dire Dawa Airport', 'code' => 'DD-DA', 'latitude' => 9.6167, 'longitude' => 41.8500],
            ['woreda' => 'DD-DD', 'name' => 'Dire Dawa Railway Station', 'code' => 'DD-DR', 'latitude' => 9.6167, 'longitude' => 41.8500],
            ['woreda' => 'DD-DD', 'name' => 'Dire Dawa Industrial Zone', 'code' => 'DD-DI', 'latitude' => 9.6167, 'longitude' => 41.8500],

            // Gambela Places
            ['woreda' => 'GA-GA', 'name' => 'Gambela University', 'code' => 'GA-GU', 'latitude' => 8.2500, 'longitude' => 34.5833],
            ['woreda' => 'GA-GA', 'name' => 'Gambela Port', 'code' => 'GA-GP', 'latitude' => 8.2500, 'longitude' => 34.5833],

            // Afar Places
            ['woreda' => 'AF-SE', 'name' => 'Semera University', 'code' => 'AF-SU', 'latitude' => 11.7833, 'longitude' => 41.0000],
            ['woreda' => 'AF-AW', 'name' => 'Awash Industrial Zone', 'code' => 'AF-AI', 'latitude' => 8.9833, 'longitude' => 40.1667],

            // Benishangul-Gumuz Places
            ['woreda' => 'BG-AS', 'name' => 'Asosa University', 'code' => 'BG-AU', 'latitude' => 10.0667, 'longitude' => 34.5167],
            ['woreda' => 'BG-AS', 'name' => 'Asosa Market', 'code' => 'BG-AM', 'latitude' => 10.0667, 'longitude' => 34.5167],

            // Sidama Places
            ['woreda' => 'SI-HA', 'name' => 'Hawassa University', 'code' => 'SI-HU', 'latitude' => 7.0500, 'longitude' => 38.4667],
            ['woreda' => 'SI-HA', 'name' => 'Hawassa Industrial Park', 'code' => 'SI-HI', 'latitude' => 7.0500, 'longitude' => 38.4667],
            ['woreda' => 'SI-YI', 'name' => 'Yirgalem Market', 'code' => 'SI-YM', 'latitude' => 6.7500, 'longitude' => 38.4167],

            // South West Ethiopia Places
            ['woreda' => 'SW-BO', 'name' => 'Bonga University', 'code' => 'SW-BU', 'latitude' => 7.2667, 'longitude' => 36.2333],
            ['woreda' => 'SW-MT', 'name' => 'Mizan Teferi University', 'code' => 'SW-MU', 'latitude' => 6.9833, 'longitude' => 35.5833],

            // Central Ethiopia Places
            ['woreda' => 'CE-WO', 'name' => 'Wolkite University', 'code' => 'CE-WU', 'latitude' => 8.2833, 'longitude' => 37.7833],
            ['woreda' => 'CE-HO', 'name' => 'Hossana University', 'code' => 'CE-HU', 'latitude' => 7.5500, 'longitude' => 37.8500],
            ['woreda' => 'CE-SO', 'name' => 'Sodo University', 'code' => 'CE-SU', 'latitude' => 6.8667, 'longitude' => 37.7667],
        ];

        foreach ($places as $placeData) {
            $woreda = Woreda::where('code', $placeData['woreda'])->first();
            if ($woreda) {
                Place::updateOrCreate(
                    ['code' => $placeData['code']],
                    [
                        'name' => $placeData['name'],
                        'code' => $placeData['code'],
                        'woreda_id' => $woreda->id,
                        'latitude' => $placeData['latitude'],
                        'longitude' => $placeData['longitude'],
                        'description' => "Transport hub in {$woreda->name}"
                    ]
                );
            }
        }
    }
}
