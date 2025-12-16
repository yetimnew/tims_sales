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
        Schema::dropIfExists('daily_truck_statuses');

        Schema::create('daily_truck_statuses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('truck_id')->constrained('trucks');
            $table->foreignId('status_id')->constrained('statuses');
            $table->date('status_date');
            $table->text('notes')->nullable();
            $table->foreignId('changed_by')->nullable()->constrained('users');
            $table->timestamps();
            $table->softDeletes();
            
            // Composite indexes for performance optimization
            $table->index(['truck_id', 'status_date'], 'idx_daily_status_truck_date');
            $table->index(['status_date', 'status_id'], 'idx_daily_status_date_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daily_truck_statuses');
    }
};


