<?php

namespace Database\Seeders\Legacy;

use App\Models\StatusType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class StatusTypesLegacySeeder extends Seeder
{
    public function run(): void
    {
        $legacy = DB::connection('legacy');

        $rows = $legacy->table('statustypes')->select([
            'id','name','comment','created_at','updated_at','deleted_at'
        ])->orderBy('id')->get();

        foreach ($rows as $row) {
            StatusType::withTrashed()->updateOrCreate(
                ['id' => $row->id],
                [
                    'name' => $row->name,
                    'description' => $row->comment,
                    'created_at' => $row->created_at,
                    'updated_at' => $row->updated_at,
                    'deleted_at' => $row->deleted_at,
                ]
            );
        }
    }
}


