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
        Schema::create('operations', function (Blueprint $table) {
            $table->id();
            $table->string('operationid')->unique();
            $table->foreignId('customer_id')->constrained('customers');
            $table->date('startdate');
            $table->foreignId('region_id')->constrained('regions');
            $table->decimal('volume', 10, 2);
            $table->string('cargotype');
            $table->decimal('km', 10, 2);
            $table->decimal('tariff', 10, 2);
            $table->string('status')->default('open');
            $table->boolean('closed')->default(false);
            $table->date('enddate')->nullable();
            $table->text('remark')->nullable();
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
        Schema::dropIfExists('operations');
    }
};

