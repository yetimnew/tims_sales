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
        Schema::create('distances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('from_place_id')->constrained('places');
            $table->foreignId('to_place_id')->constrained('places');
            $table->decimal('distance_km', 10, 2);
            $table->decimal('estimated_time_hours', 8, 2)->nullable();
            $table->text('route_description')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('distances');
    }
};



