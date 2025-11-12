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
        Schema::create('places', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->nullable();
            $table->foreignId('woreda_id')->constrained('woredas');
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->text('description')->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->decimal('elevation_m', 8, 2)->nullable();
            $table->unsignedBigInteger('population')->nullable();
            $table->boolean('is_logistics_hub')->default(false);
            $table->decimal('accessibility_score', 5, 2)->nullable();
            $table->text('infrastructure_notes')->nullable();
            $table->text('road_quality_notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status'], 'idx_places_status');
            $table->index(['woreda_id'], 'idx_places_woreda_id');
            $table->index(['latitude', 'longitude'], 'idx_places_coordinates');
            $table->index(['is_logistics_hub'], 'idx_places_is_logistics_hub');
            $table->index(['accessibility_score'], 'idx_places_accessibility_score');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('places');
    }
};
