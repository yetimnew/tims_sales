<?php

namespace Database\Seeders\Legacy;

use App\Models\Truck;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TrucksLegacySeeder extends Seeder
{
    public function run(): void
    {
        $legacy = DB::connection('legacy');

        $rows = $legacy->table('trucks')->select([
            'id', 'plate', 'vehecletype_id', 'chasisNumber', 'engineNumber', 'tyreSyze',
            'serviceIntervalKM', 'purchasePrice', 'productionDate', 'serviceStartDate', 'status',
            'created_at', 'updated_at', 'deleted_at',
        ])->orderBy('id')->get();

        foreach ($rows as $row) {
            Truck::withTrashed()->updateOrCreate(
                ['id' => $row->id],
                [
                    'plate' => $row->plate,
                    'vehicletype_id' => $row->vehecletype_id, // relies on VehicleTypesLegacySeeder
                    'chasisNumber' => $row->chasisNumber,
                    'engineNumber' => $row->engineNumber,
                    'tyreSyze' => isset($row->tyreSyze) ? (string) $row->tyreSyze : null,
                    'serviceIntervalKM' => isset($row->serviceIntervalKM) ? (int) round((float) $row->serviceIntervalKM) : null,
                    'purchasePrice' => isset($row->purchasePrice) ? number_format((float) $row->purchasePrice, 2, '.', '') : null,
                    'productionDate' => ($row->productionDate === '0000-00-00' ? null : $row->productionDate),
                    'serviceStartDate' => ($row->serviceStartDate === '0000-00-00' ? null : $row->serviceStartDate),
                    'status' => ((int) $row->status === 1 ? 'active' : 'inactive'),
                    'created_at' => $row->created_at,
                    'updated_at' => $row->updated_at,
                    'deleted_at' => $row->deleted_at,
                ]
            );
        }
    }
}


