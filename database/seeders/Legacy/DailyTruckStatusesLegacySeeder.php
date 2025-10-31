<?php

namespace Database\Seeders\Legacy;

use App\Models\Status;
use App\Models\Truck;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DailyTruckStatusesLegacySeeder extends Seeder
{
    public function run(): void
    {
        $legacy = DB::connection('legacy');

        // Ensure master statuses exist. We'll create one status per status type with same name.
        $statusTypeIds = DB::table('statustypes')->pluck('name','id');
        foreach ($statusTypeIds as $id => $name) {
            Status::firstOrCreate([
                'statustype_id' => $id,
                'name' => $name,
            ], [
                'description' => null,
            ]);
        }

        // Import old statuses history into daily_truck_statuses
        $batchSize = 5000;
        $offset = 0;
        while (true) {
            $rows = $legacy->table('statuses')
                ->select(['statustype_id','plate','registerddate','created_at','updated_at'])
                ->orderBy('id')
                ->offset($offset)
                ->limit($batchSize)
                ->get();

            if ($rows->isEmpty()) {
                break;
            }

            $inserts = [];
            foreach ($rows as $row) {
                $truckId = Truck::where('plate', $row->plate)->value('id');
                if (!$truckId) {
                    continue;
                }
                $statusId = Status::where('statustype_id', $row->statustype_id)
                    ->where('name', $statusTypeIds[$row->statustype_id] ?? null)
                    ->value('id');
                if (!$statusId) {
                    continue;
                }
                $inserts[] = [
                    'truck_id' => $truckId,
                    'status_id' => $statusId,
                    'status_date' => $row->registerddate,
                    'notes' => null,
                    'changed_by' => null,
                    'created_at' => $row->created_at,
                    'updated_at' => $row->updated_at,
                ];
            }

            if (!empty($inserts)) {
                DB::table('daily_truck_statuses')->insert($inserts);
            }

            $offset += $batchSize;
        }
    }
}


