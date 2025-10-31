<?php

namespace Database\Seeders\Legacy;

use App\Models\VehicleType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class VehicleTypesLegacySeeder extends Seeder
{
    public function run(): void
    {
        $legacy = DB::connection('legacy');

        $rows = $legacy->table('vehecletypes')->select([
            'id', 'name', 'comment', 'created_at', 'updated_at', 'deleted_at',
        ])->orderBy('id')->get();

        foreach ($rows as $row) {
            VehicleType::withTrashed()->updateOrCreate(
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


