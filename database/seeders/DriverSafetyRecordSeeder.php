<?php

namespace Database\Seeders;

use App\Models\DriverSafetyRecord;
use App\Models\Driver;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class DriverSafetyRecordSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $drivers = Driver::where('status', 'active')->get();
        $users = User::all();

        if ($drivers->isEmpty()) {
            return; // Skip seeding if no active drivers exist
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

        $safetyRecords = [];

        // Generate safety records for the past 2 years
        for ($i = 0; $i < 50; $i++) {
            $incidentDate = Carbon::now()->subDays(rand(1, 730)); // Past 2 years
            $incidentType = $incidentTypes[array_rand($incidentTypes)];
            $severity = $severities[array_rand($severities)];

            // Higher damage costs for accidents and critical incidents
            $damageCost = null;
            if ($incidentType === 'accident') {
                $damageCost = rand(500, 50000); // 500-50,000 ETB
            } elseif ($severity === 'critical') {
                $damageCost = rand(1000, 100000); // 1,000-100,000 ETB
            } elseif ($severity === 'major') {
                $damageCost = rand(500, 25000); // 500-25,000 ETB
            }

            $safetyRecords[] = [
                'driver_id' => $drivers->random()->id,
                'incident_date' => $incidentDate,
                'incident_type' => $incidentType,
                'description' => $descriptions[array_rand($descriptions)],
                'severity' => $severity,
                'damage_cost' => $damageCost,
                'location' => rand(0, 1) ? $locations[array_rand($locations)] : null,
                'resolution' => rand(0, 2) ? $resolutions[array_rand($resolutions)] : null,
                'reported_by' => $users->random()->id,
                'created_at' => $incidentDate,
                'updated_at' => $incidentDate,
            ];
        }

        foreach ($safetyRecords as $record) {
            DriverSafetyRecord::create($record);
        }
    }
}
