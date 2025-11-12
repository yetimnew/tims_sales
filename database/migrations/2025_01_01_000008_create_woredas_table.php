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
        Schema::create('woredas', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->nullable();
            $table->foreignId('zone_id')->constrained('zones');
            $table->text('description')->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->string('administrative_center')->nullable();
            $table->decimal('area_km2', 12, 2)->nullable();
            $table->unsignedBigInteger('population')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->decimal('elevation_m', 8, 2)->nullable();
            $table->decimal('accessibility_score', 5, 2)->nullable();
            $table->text('infrastructure_notes')->nullable();
            $table->text('road_quality_notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status'], 'idx_woredas_status');
            $table->index(['zone_id'], 'idx_woredas_zone_id');
            $table->index(['accessibility_score'], 'idx_woredas_accessibility_score');
            $table->index(['population'], 'idx_woredas_population');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('woredas');
    }
};
