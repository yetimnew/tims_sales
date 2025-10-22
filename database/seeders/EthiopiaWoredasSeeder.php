<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Woreda;
use App\Models\Zone;

class EthiopiaWoredasSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $woredas = [
            // Addis Ababa Woredas
            ['zone' => 'AA-ZONE', 'name' => 'Addis Ketema', 'code' => 'AA-AK'],
            ['zone' => 'AA-ZONE', 'name' => 'Akaki Kaliti', 'code' => 'AA-AK2'],
            ['zone' => 'AA-ZONE', 'name' => 'Arada', 'code' => 'AA-AR'],
            ['zone' => 'AA-ZONE', 'name' => 'Bole', 'code' => 'AA-BO'],
            ['zone' => 'AA-ZONE', 'name' => 'Gullele', 'code' => 'AA-GU'],
            ['zone' => 'AA-ZONE', 'name' => 'Kirkos', 'code' => 'AA-KI'],
            ['zone' => 'AA-ZONE', 'name' => 'Kolfe Keranio', 'code' => 'AA-KK'],
            ['zone' => 'AA-ZONE', 'name' => 'Lideta', 'code' => 'AA-LI'],
            ['zone' => 'AA-ZONE', 'name' => 'Nifas Silk Lafto', 'code' => 'AA-NS'],
            ['zone' => 'AA-ZONE', 'name' => 'Yeka', 'code' => 'AA-YE'],

            // Oromia - East Shewa Woredas
            ['zone' => 'OR-ES', 'name' => 'Adama', 'code' => 'OR-AD'],
            ['zone' => 'OR-ES', 'name' => 'Bishoftu', 'code' => 'OR-BI'],
            ['zone' => 'OR-ES', 'name' => 'Dukem', 'code' => 'OR-DU'],
            ['zone' => 'OR-ES', 'name' => 'Lume', 'code' => 'OR-LU'],
            ['zone' => 'OR-ES', 'name' => 'Modjo', 'code' => 'OR-MO'],

            // Oromia - West Shewa Woredas
            ['zone' => 'OR-WS', 'name' => 'Ambo', 'code' => 'OR-AM'],
            ['zone' => 'OR-WS', 'name' => 'Ginchi', 'code' => 'OR-GI'],
            ['zone' => 'OR-WS', 'name' => 'Holeta', 'code' => 'OR-HO'],
            ['zone' => 'OR-WS', 'name' => 'Waliso', 'code' => 'OR-WA'],

            // Amhara - North Gondar Woredas
            ['zone' => 'AM-NG', 'name' => 'Gondar', 'code' => 'AM-GO'],
            ['zone' => 'AM-NG', 'name' => 'Debark', 'code' => 'AM-DE'],
            ['zone' => 'AM-NG', 'name' => 'Metema', 'code' => 'AM-ME'],

            // Amhara - South Gondar Woredas
            ['zone' => 'AM-SG', 'name' => 'Bahir Dar', 'code' => 'AM-BD'],
            ['zone' => 'AM-SG', 'name' => 'Debre Tabor', 'code' => 'AM-DT'],
            ['zone' => 'AM-SG', 'name' => 'Fogera', 'code' => 'AM-FO'],

            // Amhara - North Shewa Woredas
            ['zone' => 'AM-NS', 'name' => 'Debre Berhan', 'code' => 'AM-DB'],
            ['zone' => 'AM-NS', 'name' => 'Ankober', 'code' => 'AM-AN'],
            ['zone' => 'AM-NS', 'name' => 'Menz Gera', 'code' => 'AM-MG'],

            // Tigray Woredas
            ['zone' => 'TI-CE', 'name' => 'Mekelle', 'code' => 'TI-ME'],
            ['zone' => 'TI-CE', 'name' => 'Adigrat', 'code' => 'TI-AD'],
            ['zone' => 'TI-EA', 'name' => 'Wukro', 'code' => 'TI-WU'],
            ['zone' => 'TI-SO', 'name' => 'Alamata', 'code' => 'TI-AL'],
            ['zone' => 'TI-SO', 'name' => 'Korem', 'code' => 'TI-KO'],

            // SNNPR Woredas
            ['zone' => 'SN-GU', 'name' => 'Wolkite', 'code' => 'SN-WO'],
            ['zone' => 'SN-GU', 'name' => 'Butajira', 'code' => 'SN-BU'],
            ['zone' => 'SN-WO', 'name' => 'Sodo', 'code' => 'SN-SO'],
            ['zone' => 'SN-WO', 'name' => 'Arba Minch', 'code' => 'SN-AM'],
            ['zone' => 'SN-GG', 'name' => 'Jinka', 'code' => 'SN-JI'],
            ['zone' => 'SN-GG', 'name' => 'Konso', 'code' => 'SN-KO'],

            // Somali Woredas
            ['zone' => 'SO-SI', 'name' => 'Jigjiga', 'code' => 'SO-JI'],
            ['zone' => 'SO-SI', 'name' => 'Shinile', 'code' => 'SO-SH'],
            ['zone' => 'SO-FA', 'name' => 'Kebri Beyah', 'code' => 'SO-KB'],
            ['zone' => 'SO-FA', 'name' => 'Afdem', 'code' => 'SO-AF'],

            // Harari Woredas
            ['zone' => 'HA-ZONE', 'name' => 'Harar', 'code' => 'HA-HA'],

            // Dire Dawa Woredas
            ['zone' => 'DD-ZONE', 'name' => 'Dire Dawa', 'code' => 'DD-DD'],

            // Gambela Woredas
            ['zone' => 'GA-AN', 'name' => 'Gambela', 'code' => 'GA-GA'],
            ['zone' => 'GA-NU', 'name' => 'Itang', 'code' => 'GA-IT'],

            // Afar Woredas
            ['zone' => 'AF-Z1', 'name' => 'Semera', 'code' => 'AF-SE'],
            ['zone' => 'AF-Z1', 'name' => 'Logiya', 'code' => 'AF-LO'],
            ['zone' => 'AF-Z2', 'name' => 'Awash', 'code' => 'AF-AW'],
            ['zone' => 'AF-Z3', 'name' => 'Dubti', 'code' => 'AF-DU'],

            // Benishangul-Gumuz Woredas
            ['zone' => 'BG-AS', 'name' => 'Asosa', 'code' => 'BG-AS'],
            ['zone' => 'BG-KA', 'name' => 'Kamashi', 'code' => 'BG-KA'],
            ['zone' => 'BG-ME', 'name' => 'Metekel', 'code' => 'BG-ME'],

            // Sidama Woredas
            ['zone' => 'SI-ZONE', 'name' => 'Hawassa', 'code' => 'SI-HA'],
            ['zone' => 'SI-ZONE', 'name' => 'Yirgalem', 'code' => 'SI-YI'],
            ['zone' => 'SI-ZONE', 'name' => 'Aleta Wondo', 'code' => 'SI-AW'],

            // South West Ethiopia Woredas
            ['zone' => 'SW-KE', 'name' => 'Bonga', 'code' => 'SW-BO'],
            ['zone' => 'SW-SH', 'name' => 'Masha', 'code' => 'SW-MA'],
            ['zone' => 'SW-BS', 'name' => 'Mizan Teferi', 'code' => 'SW-MT'],

            // Central Ethiopia Woredas
            ['zone' => 'CE-GU', 'name' => 'Wolkite', 'code' => 'CE-WO'],
            ['zone' => 'CE-HA', 'name' => 'Hossana', 'code' => 'CE-HO'],
            ['zone' => 'CE-WO', 'name' => 'Sodo', 'code' => 'CE-SO'],
        ];

        foreach ($woredas as $woredaData) {
            $zone = Zone::where('code', $woredaData['zone'])->first();
            if ($zone) {
                Woreda::updateOrCreate(
                    ['code' => $woredaData['code']],
                    [
                        'name' => $woredaData['name'],
                        'code' => $woredaData['code'],
                        'zone_id' => $zone->id,
                        'description' => "Woreda in {$zone->name}"
                    ]
                );
            }
        }
    }
}
