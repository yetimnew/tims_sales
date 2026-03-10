<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('fuel_records', 'receipt_image_path')) {
            Schema::table('fuel_records', function (Blueprint $table) {
                $table->string('receipt_image_path')->nullable()->after('receipt_number');
            });
        }

        if (! Schema::hasColumn('fuel_records', 'latitude')) {
            Schema::table('fuel_records', function (Blueprint $table) {
                $table->decimal('latitude', 10, 7)->nullable()->after('notes');
            });
        }

        if (! Schema::hasColumn('fuel_records', 'longitude')) {
            Schema::table('fuel_records', function (Blueprint $table) {
                $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            });
        }

        if (! Schema::hasColumn('fuel_records', 'location_accuracy_m')) {
            Schema::table('fuel_records', function (Blueprint $table) {
                $table->decimal('location_accuracy_m', 8, 2)->nullable()->after('longitude');
            });
        }

        if (! Schema::hasColumn('fuel_records', 'location_timestamp')) {
            Schema::table('fuel_records', function (Blueprint $table) {
                $table->timestamp('location_timestamp')->nullable()->after('location_accuracy_m');
            });
        }

        if (! Schema::hasColumn('fuel_records', 'submitted_via_mobile')) {
            Schema::table('fuel_records', function (Blueprint $table) {
                $table->boolean('submitted_via_mobile')->default(false)->after('location_timestamp');
            });
        }

        if (! Schema::hasColumn('fuel_records', 'reviewed_at')) {
            Schema::table('fuel_records', function (Blueprint $table) {
                $table->timestamp('reviewed_at')->nullable()->after('submitted_via_mobile');
            });
        }

        if (! Schema::hasColumn('fuel_records', 'reviewed_by_user_id')) {
            Schema::table('fuel_records', function (Blueprint $table) {
                $table->foreignId('reviewed_by_user_id')->nullable()->after('reviewed_at');
            });
        }

        if (! $this->foreignKeyExists('fuel_records', 'fuel_reviewed_by_fk')) {
            Schema::table('fuel_records', function (Blueprint $table) {
                $table->foreign('reviewed_by_user_id', 'fuel_reviewed_by_fk')->references('id')->on('users');
            });
        }

        if (! Schema::hasColumn('fuel_records', 'review_note')) {
            Schema::table('fuel_records', function (Blueprint $table) {
                $table->text('review_note')->nullable()->after('reviewed_by_user_id');
            });
        }
    }

    public function down(): void
    {
        if ($this->foreignKeyExists('fuel_records', 'fuel_reviewed_by_fk')) {
            Schema::table('fuel_records', function (Blueprint $table) {
                $table->dropForeign('fuel_reviewed_by_fk');
            });
        }

        $this->dropColumnIfExists('fuel_records', 'review_note');
        $this->dropColumnIfExists('fuel_records', 'reviewed_by_user_id');
        $this->dropColumnIfExists('fuel_records', 'reviewed_at');
        $this->dropColumnIfExists('fuel_records', 'submitted_via_mobile');
        $this->dropColumnIfExists('fuel_records', 'location_timestamp');
        $this->dropColumnIfExists('fuel_records', 'location_accuracy_m');
        $this->dropColumnIfExists('fuel_records', 'longitude');
        $this->dropColumnIfExists('fuel_records', 'latitude');
        $this->dropColumnIfExists('fuel_records', 'receipt_image_path');
    }

    private function foreignKeyExists(string $table, string $constraint): bool
    {
        return DB::table('information_schema.table_constraints')
            ->where('constraint_schema', DB::getDatabaseName())
            ->where('table_name', $table)
            ->where('constraint_name', $constraint)
            ->where('constraint_type', 'FOREIGN KEY')
            ->exists();
    }

    private function dropColumnIfExists(string $tableName, string $column): void
    {
        if (! Schema::hasColumn($tableName, $column)) {
            return;
        }

        Schema::table($tableName, function (Blueprint $table) use ($column) {
            $table->dropColumn($column);
        });
    }
};
