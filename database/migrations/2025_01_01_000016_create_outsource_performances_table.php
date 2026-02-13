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
        Schema::create('outsource_performances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('outsource_id')->constrained('outsources');
            $table->foreignId('operation_id')->constrained('operations');
            // outsource_performances
            $table->string('trip_number');
            // $table->dateTime('dispatch_date');
            $table->dateTime('dispatch_date');
            $table->foreignId('from_place_id')->constrained('places');
            $table->foreignId('to_place_id')->constrained('places');
            $table->decimal('distance_km', 10, 2)->nullable();
            $table->decimal('cargo_volume_mt', 10, 2)->nullable();
            $table->decimal('tonkm', 10, 2)->nullable();
            $table->decimal('cost', 10, 2)->nullable();
            $table->text('remarks')->nullable();
            $table->string('status')->default('active');
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
        Schema::dropIfExists('outsource_performances');
    }
};



