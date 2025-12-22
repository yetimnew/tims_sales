<?php

namespace Database\Seeders;

use App\Models\Driver;
use App\Models\DriverSafetyRecord;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class DriverSafetyRecordSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $drivers = Driver::query()->where('status', 'active')->get(['id']);
        $users = User::query()->get(['id']);

        if ($drivers->isEmpty() || $users->isEmpty()) {
            return;
        }

        $incidentTypes = ['accident', 'violation', 'warning'];
        $severities = ['minor', 'major', 'critical'];
        $locations = [
            'Addis Ababa - Bole Road',
            'Adama Highway',
            'Awash International Road',
            'Debre Zeyit Junction',
            'Entoto Hill Road',
            'Ghion Hotel Area',
            'Kazanchis Road',
            'Mexico Square',
            'Piassa Area',
            'Shiromeda Market',
            'St. George Cathedral',
            'Zewditu Hospital Area',
        ];

        $descriptions = [
            'Driver failed to maintain safe following distance, resulting in near collision.',
            'Traffic violation for improper lane change without signaling.',
            'Minor accident involving rear-end collision due to sudden braking.',
            'Driver exceeded speed limit in residential area.',
            'Failure to yield right of way at intersection.',
            'Improper parking blocking traffic flow.',
            'Driver involved in accident while distracted by mobile phone.',
            'Violation of traffic signal at busy intersection.',
            'Minor damage to vehicle from curb impact.',
            'Driver received warning for unsafe driving behavior.',
            'Traffic citation for running red light.',
            'Accident caused by mechanical failure combined with driver error.',
        ];

        $resolutions = [
            'Driver received verbal warning and additional training scheduled.',
            'Formal written warning issued with record in employee file.',
            'Driver suspended for 3 days with pay pending investigation.',
            'Traffic citation paid and driving privileges reviewed.',
            'Vehicle repaired at company expense, driver retrained.',
            'Incident reviewed by safety committee, no further action required.',
            'Driver completed defensive driving course.',
            'Insurance claim filed, driver partially responsible.',
            'Matter resolved through mediation with involved parties.',
            'Driver terminated due to repeated violations.',
            'Incident documented for insurance purposes.',
            'Safety audit conducted following the incident.',
        ];

        $records = [];

        for ($i = 0; $i < 50; $i++) {
            $incidentDate = Carbon::now()->subDays(random_int(1, 730));
            $incidentType = $incidentTypes[array_rand($incidentTypes)];
            $severity = $severities[array_rand($severities)];

            $damageCost = null;
            if ($incidentType === 'accident') {
                $damageCost = random_int(500, 50000);
            } elseif ($severity === 'critical') {
                $damageCost = random_int(1000, 100000);
            } elseif ($severity === 'major') {
                $damageCost = random_int(500, 25000);
            }

            $records[] = [
                'driver_id' => $drivers->random()->id,
                'incident_date' => $incidentDate,
                'incident_type' => $incidentType,
                'description' => $descriptions[array_rand($descriptions)],
                'severity' => $severity,
                'damage_cost' => $damageCost,
                'location' => random_int(0, 1) === 1 ? $locations[array_rand($locations)] : null,
                'resolution' => random_int(0, 2) > 0 ? $resolutions[array_rand($resolutions)] : null,
                'reported_by' => $users->random()->id,
                'created_at' => $incidentDate,
                'updated_at' => $incidentDate,
            ];
        }

        DriverSafetyRecord::query()->insert($records);
    }
}
