<?php

namespace Database\Seeders\Legacy;

use App\Models\Operation;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class OperationsLegacySeeder extends Seeder
{
    public function run(): void
    {
        $legacy = DB::connection('legacy');

        $legacy->table('operations')->orderBy('id')->get()->each(function ($row) {
            Operation::updateOrCreate(
                ['id' => $row->id],
                [
                    'operationid' => $row->operationid,
                    'customer_id' => $row->customer_id,
                    'startdate' => substr((string) $row->startdate, 0, 10),
                    'region_id' => $row->region_id,
                    'volume' => isset($row->volume) ? number_format((float) $row->volume, 2, '.', '') : null,
                    'cargotype' => (string) $row->cargotype,
                    'km' => isset($row->km) ? number_format((float) $row->km, 2, '.', '') : null,
                    'tariff' => isset($row->tariff) ? number_format((float) $row->tariff, 2, '.', '') : null,
                    'status' => ((int) $row->status === 1 ? 'open' : 'closed'),
                    'closed' => ((int) $row->closed) === 1,
                    'enddate' => $row->enddate,
                    'remark' => $row->remark,
                    'user_id' => $row->user_id,
                    'created_at' => $row->created_at,
                    'updated_at' => $row->updated_at,
                    'deleted_at' => $row->deleted_at,
                ]
            );
        });
    }
}


