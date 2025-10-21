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
        Schema::create('cargo_types', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Cement, Gravel, Steel, etc.
            $table->string('category'); // Construction, Agricultural, Industrial
            $table->decimal('weight_per_cubic_meter', 8, 2)->nullable();
            $table->text('handling_requirements')->nullable();
            $table->text('safety_requirements')->nullable();
            $table->boolean('requires_special_equipment')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cargo_types');
    }
};

