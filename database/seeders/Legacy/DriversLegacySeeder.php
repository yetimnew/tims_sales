<?php

namespace Database\Seeders\Legacy;

use App\Models\Driver;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DriversLegacySeeder extends Seeder
{
    public function run(): void
    {
        $legacy = DB::connection('legacy');

        $rows = $legacy->table('drivers')->select([
            'id','driverid','name','sex','birthdate','zone','woreda','kebele','housenumber','mobile','hireddate','status','created_at','updated_at','deleted_at'
        ])->orderBy('id')->get();

        foreach ($rows as $row) {
            Driver::withTrashed()->updateOrCreate(
                ['id' => $row->id],
                [
                    'driverid' => $row->driverid,
                    'name' => $row->name,
                    'sex' => match ((int) $row->sex) {
                        1 => 'male',
                        0 => 'female',
                        default => 'unknown',
                    },
                    'birthdate' => ($row->birthdate === '0000-00-00' ? null : $row->birthdate),
                    'zone' => $row->zone,
                    'woreda' => $row->woreda,
                    'kebele' => $row->kebele,
                    'housenumber' => $row->housenumber,
                    'mobile' => $row->mobile,
                    'hireddate' => ($row->hireddate === '0000-00-00' ? null : $row->hireddate),
                    'status' => ((int) $row->status === 1 ? 'active' : 'inactive'),
                    'created_at' => $row->created_at,
                    'updated_at' => $row->updated_at,
                    'deleted_at' => $row->deleted_at,
                ]
            );
        }
    }
}


