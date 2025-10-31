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
        Schema::table('driver_truck', function (Blueprint $table) {
            $table->string('driverid')->nullable()->after('driver_id');
            $table->string('plate')->nullable()->after('truck_id');
            $table->date('date_recived')->nullable()->after('plate');
            $table->date('date_detach')->nullable()->after('date_recived');
            $table->text('reason')->nullable()->after('date_detach');
            $table->boolean('is_attached')->default(1)->after('reason');
            $table->unsignedBigInteger('user_id')->nullable()->after('is_attached');

            $table->foreign('user_id')->references('id')->on('users');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('driver_truck', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn([
                'driverid',
                'plate',
                'date_recived',
                'date_detach',
                'reason',
                'is_attached',
                'user_id'
            ]);
        });
    }
};
