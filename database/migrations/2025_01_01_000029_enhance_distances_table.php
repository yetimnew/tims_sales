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
        Schema::table('distances', function (Blueprint $table) {
            $table->string('route_type')->default('primary'); // primary, secondary, alternative
            $table->integer('estimated_travel_time_minutes')->nullable();
            $table->decimal('road_condition_factor', 3, 2)->default(1.00); // 0.5 to 2.0
            $table->boolean('toll_road')->default(false);
            $table->decimal('toll_cost', 8, 2)->nullable();
            $table->boolean('restricted_for_heavy_vehicles')->default(false);
            $table->text('route_notes')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('distances', function (Blueprint $table) {
            $table->dropColumn([
                'route_type',
                'estimated_travel_time_minutes',
                'road_condition_factor',
                'toll_road',
                'toll_cost',
                'restricted_for_heavy_vehicles',
                'route_notes'
            ]);
        });
    }
};

