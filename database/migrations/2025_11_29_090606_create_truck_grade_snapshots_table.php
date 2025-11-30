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
        Schema::create('truck_grade_snapshots', function (Blueprint $table) {
            $table->id();
            $table->date('snapshot_date');
            $table->foreignId('truck_id')->constrained()->cascadeOnDelete();
            $table->foreignId('vehicle_type_id')->nullable()->constrained('vehicletypes')->nullOnDelete();
            $table->string('status', 40)->nullable();
            $table->foreignId('filter_vehicle_type_id')->nullable()->constrained('vehicletypes')->nullOnDelete();
            $table->string('filter_status', 40)->nullable();
            $table->decimal('overall_score', 5, 2);
            $table->string('overall_letter', 2);
            $table->json('weights');
            $table->json('categories')->nullable();
            $table->json('metrics')->nullable();
            $table->timestamp('calculated_at');
            $table->foreignId('calculated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique([
                'snapshot_date',
                'filter_vehicle_type_id',
                'filter_status',
                'truck_id',
            ], 'truck_grade_snapshots_unique');

            $table->index(['snapshot_date', 'filter_vehicle_type_id', 'filter_status'], 'truck_grade_snapshots_filter_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('truck_grade_snapshots');
    }
};
