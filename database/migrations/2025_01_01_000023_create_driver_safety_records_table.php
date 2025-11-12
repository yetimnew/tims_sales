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
        Schema::create('driver_safety_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('driver_id')->constrained('drivers');
            $table->date('incident_date');
            $table->string('incident_type'); // accident, violation, warning
            $table->text('description');
            $table->string('severity'); // minor, major, critical
            $table->decimal('damage_cost', 10, 2)->nullable();
            $table->string('location')->nullable();
            $table->text('resolution')->nullable();
            $table->foreignId('reported_by')->constrained('users');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('driver_safety_records');
    }
};
