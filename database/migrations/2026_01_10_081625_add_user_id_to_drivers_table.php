<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Adds user_id to drivers table to establish User → Driver relationship.
     * This allows users to optionally be drivers (1:1 relationship).
     * - user_id is nullable (drivers can exist without users initially)
     * - user_id is unique (one driver per user, but user can be without driver)
     */
    public function up(): void
    {
        Schema::table('drivers', function (Blueprint $table) {
            // Add user_id column after id, nullable to allow drivers without users
            $table->foreignId('user_id')->nullable()->after('id')
                ->constrained('users')
                ->onDelete('set null'); // If user is deleted, set driver.user_id to null
            
            // Index for faster lookups
            $table->index('user_id', 'idx_drivers_user_id');
            
            // Unique constraint: one driver per user (but user can exist without driver)
            $table->unique('user_id', 'unique_driver_user');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('drivers', function (Blueprint $table) {
            // Drop foreign key constraint first
            $table->dropForeign(['user_id']);
            
            // Drop unique constraint
            $table->dropUnique('unique_driver_user');
            
            // Drop index
            $table->dropIndex('idx_drivers_user_id');
            
            // Drop column
            $table->dropColumn('user_id');
        });
    }
};
