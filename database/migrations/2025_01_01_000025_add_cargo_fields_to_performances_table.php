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
        Schema::table('performances', function (Blueprint $table) {
            $table->foreignId('cargo_type_id')->nullable()->constrained('cargo_types');
            $table->decimal('cargo_weight_kg', 10, 2)->nullable();
            $table->decimal('cargo_volume_cubic_meters', 10, 2)->nullable();
            $table->string('loading_method')->nullable(); // manual, crane, conveyor
            $table->string('unloading_method')->nullable();
            $table->integer('loading_time_minutes')->nullable();
            $table->integer('unloading_time_minutes')->nullable();
            $table->text('cargo_condition_notes')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('performances', function (Blueprint $table) {
            $table->dropForeign(['cargo_type_id']);
            $table->dropColumn([
                'cargo_type_id',
                'cargo_weight_kg',
                'cargo_volume_cubic_meters',
                'loading_method',
                'unloading_method',
                'loading_time_minutes',
                'unloading_time_minutes',
                'cargo_condition_notes'
            ]);
        });
    }
};



