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
        Schema::create('performances', function (Blueprint $table) {
            $table->id();
            $table->string('trip');
            $table->string('LoadType');
            $table->string('FOnumber');
            $table->foreignId('operation_id')->constrained('operations');
            $table->foreignId('driver_truck_id')->constrained('driver_truck');
            $table->date('DateDispach');
            $table->foreignId('orgion_id')->constrained('places');
            $table->foreignId('destination_id')->constrained('places');
            $table->decimal('DistanceWCargo', 10, 2)->nullable();
            $table->decimal('tonkm', 10, 2)->nullable();
            $table->decimal('DistanceWOCargo', 10, 2)->nullable();
            $table->decimal('CargoVolumMT', 10, 2)->nullable();
            $table->decimal('fuelInLitter', 10, 2)->nullable();
            $table->decimal('fuelInBirr', 10, 2)->nullable();
            $table->decimal('perdiem', 10, 2)->nullable();
            $table->decimal('workOnGoing', 10, 2)->nullable();
            $table->decimal('other', 10, 2)->nullable();
            $table->text('comment')->nullable();
            $table->string('satus')->default('active');
            $table->boolean('is_returned')->default(false);
            $table->date('returned_date')->nullable();
            $table->foreignId('user_id')->constrained('users');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('performances');
    }
};

