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
        Schema::create('truck_grading_settings', function (Blueprint $table) {
            $table->id();
            $table->unsignedTinyInteger('utilization_weight')->default(25);
            $table->unsignedTinyInteger('efficiency_weight')->default(25);
            $table->unsignedTinyInteger('reliability_weight')->default(30);
            $table->unsignedTinyInteger('financial_weight')->default(15);
            $table->unsignedTinyInteger('compliance_weight')->default(5);
            $table->unsignedTinyInteger('peer_sample_size')->default(10);
            $table->integer('min_performance_records')->default(5);
            $table->integer('min_days_in_service')->default(30);
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
        Schema::dropIfExists('truck_grading_settings');
    }
};
