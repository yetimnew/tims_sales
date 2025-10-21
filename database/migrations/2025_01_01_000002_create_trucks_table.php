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
        Schema::create('trucks', function (Blueprint $table) {
            $table->id();
            $table->string('plate')->unique();
            $table->foreignId('vehicletype_id')->constrained('vehicletypes');
            $table->string('chasisNumber')->nullable();
            $table->string('engineNumber')->nullable();
            $table->string('tyreSyze')->nullable();
            $table->integer('serviceIntervalKM')->nullable();
            $table->decimal('purchasePrice', 10, 2)->nullable();
            $table->date('productionDate')->nullable();
            $table->date('serviceStartDate')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trucks');
    }
};
