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
        Schema::create('vehicle_maintenance_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('truck_id')->constrained('trucks');
            $table->foreignId('maintenance_type_id')->constrained('maintenance_types');
            $table->date('scheduled_date');
            $table->date('completed_date')->nullable();
            $table->integer('odometer_reading')->nullable();
            $table->decimal('cost', 10, 2)->nullable();
            $table->text('description')->nullable();
            $table->text('work_performed')->nullable();
            $table->text('parts_replaced')->nullable();
            $table->string('service_provider')->nullable();
            $table->string('status')->default('scheduled'); // scheduled, in_progress, completed, overdue
            $table->foreignId('assigned_mechanic_id')->nullable()->constrained('users');
            $table->foreignId('user_id')->constrained('users');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vehicle_maintenance_records');
    }
};

