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
        Schema::table('drivers', function (Blueprint $table) {
            // Add indexes for search columns to improve LIKE query performance
            $table->index('name', 'idx_drivers_name');
            $table->index('mobile', 'idx_drivers_mobile');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('drivers', function (Blueprint $table) {
            $table->dropIndex('idx_drivers_name');
            $table->dropIndex('idx_drivers_mobile');
        });
    }
};
