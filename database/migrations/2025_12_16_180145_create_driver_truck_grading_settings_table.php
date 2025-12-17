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
        Schema::create('driver_truck_grading_settings', function (Blueprint $table) {
            $table->id();
            $table->unsignedTinyInteger('performance_weight')->default(40);
            $table->unsignedTinyInteger('efficiency_weight')->default(35);
            $table->unsignedTinyInteger('consistency_weight')->default(25);
            $table->unsignedTinyInteger('peer_sample_size')->default(25);
            $table->json('grade_thresholds')->nullable();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('driver_truck_grading_settings');
    }
};
