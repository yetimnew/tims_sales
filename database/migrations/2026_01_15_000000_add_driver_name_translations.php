<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('drivers', function (Blueprint $table) {
            $table->json('name_translations')->nullable()->after('name');
        });

        $defaultLocale = config('app.locale', 'en');

        DB::table('drivers')
            ->orderBy('id')
            ->chunkById(100, function ($drivers) use ($defaultLocale) {
                foreach ($drivers as $driver) {
                    DB::table('drivers')
                        ->where('id', $driver->id)
                        ->update([
                            'name_translations' => json_encode([
                                $defaultLocale => $driver->name,
                            ]),
                        ]);
                }
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('drivers', function (Blueprint $table) {
            $table->dropColumn('name_translations');
        });
    }
};
