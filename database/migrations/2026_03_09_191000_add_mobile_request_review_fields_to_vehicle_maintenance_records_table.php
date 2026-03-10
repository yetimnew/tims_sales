<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('vehicle_maintenance_records', 'mobile_request_status')) {
            Schema::table('vehicle_maintenance_records', function (Blueprint $table) {
                $table->string('mobile_request_status')->nullable()->after('driver_service_request_notes');
            });
        }

        if (! Schema::hasColumn('vehicle_maintenance_records', 'mobile_request_reviewed_at')) {
            Schema::table('vehicle_maintenance_records', function (Blueprint $table) {
                $table->timestamp('mobile_request_reviewed_at')->nullable()->after('mobile_request_status');
            });
        }

        if (! Schema::hasColumn('vehicle_maintenance_records', 'mobile_request_reviewed_by_user_id')) {
            Schema::table('vehicle_maintenance_records', function (Blueprint $table) {
                $table->foreignId('mobile_request_reviewed_by_user_id')->nullable()->after('mobile_request_reviewed_at');
            });
        }

        if (! $this->foreignKeyExists('vehicle_maintenance_records', 'vmr_mobile_review_user_fk')) {
            Schema::table('vehicle_maintenance_records', function (Blueprint $table) {
                $table->foreign('mobile_request_reviewed_by_user_id', 'vmr_mobile_review_user_fk')->references('id')->on('users');
            });
        }

        if (! Schema::hasColumn('vehicle_maintenance_records', 'mobile_request_review_note')) {
            Schema::table('vehicle_maintenance_records', function (Blueprint $table) {
                $table->text('mobile_request_review_note')->nullable()->after('mobile_request_reviewed_by_user_id');
            });
        }
    }

    public function down(): void
    {
        if ($this->foreignKeyExists('vehicle_maintenance_records', 'vmr_mobile_review_user_fk')) {
            Schema::table('vehicle_maintenance_records', function (Blueprint $table) {
                $table->dropForeign('vmr_mobile_review_user_fk');
            });
        }

        $this->dropColumnIfExists('vehicle_maintenance_records', 'mobile_request_reviewed_by_user_id');
        $this->dropColumnIfExists('vehicle_maintenance_records', 'mobile_request_reviewed_at');
        $this->dropColumnIfExists('vehicle_maintenance_records', 'mobile_request_status');
        $this->dropColumnIfExists('vehicle_maintenance_records', 'mobile_request_review_note');
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
