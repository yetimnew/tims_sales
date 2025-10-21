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
        Schema::create('truck_financial_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('truck_id')->constrained('trucks');
            $table->date('record_date');
            $table->decimal('revenue', 10, 2)->default(0);
            $table->decimal('fuel_cost', 10, 2)->default(0);
            $table->decimal('maintenance_cost', 10, 2)->default(0);
            $table->decimal('driver_salary', 10, 2)->default(0);
            $table->decimal('insurance_cost', 10, 2)->default(0);
            $table->decimal('depreciation', 10, 2)->default(0);
            $table->decimal('other_costs', 10, 2)->default(0);
            $table->decimal('net_profit', 10, 2)->default(0);
            $table->string('period_type'); // daily, weekly, monthly
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('truck_financial_records');
    }
};

