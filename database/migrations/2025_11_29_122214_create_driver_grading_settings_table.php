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
        Schema::create('driver_grading_settings', function (Blueprint $table) {
            $table->id();
            $table->unsignedTinyInteger('performance_weight')->default(35);
            $table->unsignedTinyInteger('efficiency_weight')->default(20);
            $table->unsignedTinyInteger('safety_weight')->default(25);
            $table->unsignedTinyInteger('compliance_weight')->default(10);
            $table->unsignedTinyInteger('engagement_weight')->default(10);
            $table->unsignedTinyInteger('peer_sample_size')->default(10);
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('driver_grading_settings');
    }
};
