<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasColumn('route_plans', 'deleted_at')) {
            Schema::table('route_plans', function (Blueprint $table) {
                $table->softDeletes()->after('user_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('route_plans', 'deleted_at')) {
            Schema::table('route_plans', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }
    }
};
