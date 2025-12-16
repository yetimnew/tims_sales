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
        Schema::create('driver_truck', function (Blueprint $table) {
            $table->id();
            $table->foreignId('driver_id')->constrained('drivers');
            $table->foreignId('truck_id')->constrained('trucks');
            $table->string('driverid')->nullable();
            $table->string('plate')->nullable();
            $table->date('assigned_date')->nullable();
            $table->date('unassigned_date')->nullable();
            $table->date('date_recived')->nullable();
            $table->date('date_detach')->nullable();
            $table->text('reason')->nullable();
            $table->boolean('is_attached')->default(true);
            $table->foreignId('user_id')->nullable()->constrained('users');
            $table->string('status')->default('active');
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['driver_id', 'truck_id', 'status'], 'unique_active_assignment');
            $table->index(['status', 'is_attached'], 'idx_driver_truck_status_attached');
            $table->index(['driver_id', 'status'], 'idx_driver_truck_driver_status');
            $table->index(['truck_id', 'status'], 'idx_driver_truck_truck_status');
            $table->index(['date_recived'], 'idx_driver_truck_date_recived');
            $table->index(['date_detach'], 'idx_driver_truck_date_detach');
            
            // Composite indexes for performance optimization
            $table->index(['truck_id', 'is_attached'], 'idx_driver_truck_truck_attached');
            $table->index(['driver_id', 'is_attached'], 'idx_driver_truck_driver_attached');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('driver_truck');
    }
};
