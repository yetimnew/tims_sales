<?php

namespace Database\Seeders\Legacy;

use App\Models\Customer;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CustomersLegacySeeder extends Seeder
{
    public function run(): void
    {
        $legacy = DB::connection('legacy');

        $rows = $legacy->table('customers')->select([
            'id','name','address','officenumber','mobile','remark','status','created_at','updated_at','deleted_at'
        ])->orderBy('id')->get();

        foreach ($rows as $row) {
            Customer::withTrashed()->updateOrCreate(
                ['id' => $row->id],
                [
                    'name' => $row->name,
                    'contact_person' => null,
                    'phone' => $row->mobile,
                    'email' => null,
                    'address' => $row->address,
                    'status' => ((int) $row->status === 1 ? 'active' : 'inactive'),
                    'created_at' => $row->created_at,
                    'updated_at' => $row->updated_at,
                    'deleted_at' => $row->deleted_at,
                ]
            );
        }
    }
}


