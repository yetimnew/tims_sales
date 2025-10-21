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
        Schema::create('fuel_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('truck_id')->constrained('trucks');
            $table->foreignId('driver_id')->constrained('drivers');
            $table->date('fuel_date');
            $table->decimal('fuel_quantity_liters', 10, 2);
            $table->decimal('fuel_price_per_liter', 10, 2);
            $table->decimal('total_cost', 10, 2);
            $table->string('fuel_station')->nullable();
            $table->string('fuel_type')->default('diesel'); // diesel, petrol, gas
            $table->integer('odometer_reading')->nullable();
            $table->string('receipt_number')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('user_id')->constrained('users');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fuel_records');
    }
};

