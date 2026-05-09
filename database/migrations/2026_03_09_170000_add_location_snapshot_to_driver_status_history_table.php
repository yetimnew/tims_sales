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
        Schema::table('driver_status_history', function (Blueprint $table) {
            $table->decimal('latitude', 10, 8)->nullable()->after('notes');
            $table->decimal('longitude', 11, 8)->nullable()->after('latitude');
            $table->decimal('accuracy', 8, 2)->nullable()->after('longitude');
            $table->decimal('speed', 8, 2)->nullable()->after('accuracy');
            $table->decimal('heading', 5, 2)->nullable()->after('speed');
            $table->timestamp('location_timestamp')->nullable()->after('heading');
            $table->index(['driver_id', 'location_timestamp'], 'driver_status_history_driver_location_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('driver_status_history', function (Blueprint $table) {
            $table->dropIndex('driver_status_history_driver_location_idx');
            $table->dropColumn([
                'latitude',
                'longitude',
                'accuracy',
                'speed',
                'heading',
                'location_timestamp',
            ]);
        });
    }
};
