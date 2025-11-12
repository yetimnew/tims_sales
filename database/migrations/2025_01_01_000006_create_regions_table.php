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
        Schema::create('regions', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->nullable();
            $table->text('description')->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->string('capital')->nullable();
            $table->decimal('area_km2', 12, 2)->nullable();
            $table->unsignedBigInteger('population')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->decimal('elevation_m', 8, 2)->nullable();
            $table->decimal('accessibility_score', 5, 2)->nullable();
            $table->date('last_surveyed_at')->nullable();
            $table->text('infrastructure_notes')->nullable();
            $table->text('climate_profile')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status'], 'idx_regions_status');
            $table->index(['accessibility_score'], 'idx_regions_accessibility_score');
            $table->index(['population'], 'idx_regions_population');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('regions');
    }
};
