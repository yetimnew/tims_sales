<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('vehicle_maintenance_records', 'driver_acknowledged_at')) {
            Schema::table('vehicle_maintenance_records', function (Blueprint $table) {
                $table->timestamp('driver_acknowledged_at')->nullable()->after('status');
            });
        }

        if (! Schema::hasColumn('vehicle_maintenance_records', 'driver_acknowledged_by_user_id')) {
            Schema::table('vehicle_maintenance_records', function (Blueprint $table) {
                $table->foreignId('driver_acknowledged_by_user_id')->nullable()->after('driver_acknowledged_at');
            });
        }

        if (! $this->foreignKeyExists('vehicle_maintenance_records', 'vmr_drv_ack_user_fk')) {
            Schema::table('vehicle_maintenance_records', function (Blueprint $table) {
                $table->foreign('driver_acknowledged_by_user_id', 'vmr_drv_ack_user_fk')->references('id')->on('users');
            });
        }

        if (! Schema::hasColumn('vehicle_maintenance_records', 'driver_issue_reported_at')) {
            Schema::table('vehicle_maintenance_records', function (Blueprint $table) {
                $table->timestamp('driver_issue_reported_at')->nullable()->after('driver_acknowledged_by_user_id');
            });
        }

        if (! Schema::hasColumn('vehicle_maintenance_records', 'driver_issue_reported_by_user_id')) {
            Schema::table('vehicle_maintenance_records', function (Blueprint $table) {
                $table->foreignId('driver_issue_reported_by_user_id')->nullable()->after('driver_issue_reported_at');
            });
        }

        if (! $this->foreignKeyExists('vehicle_maintenance_records', 'vmr_drv_issue_user_fk')) {
            Schema::table('vehicle_maintenance_records', function (Blueprint $table) {
                $table->foreign('driver_issue_reported_by_user_id', 'vmr_drv_issue_user_fk')->references('id')->on('users');
            });
        }

        if (! Schema::hasColumn('vehicle_maintenance_records', 'driver_issue_report')) {
            Schema::table('vehicle_maintenance_records', function (Blueprint $table) {
                $table->text('driver_issue_report')->nullable()->after('driver_issue_reported_by_user_id');
            });
        }

        if (! Schema::hasColumn('vehicle_maintenance_records', 'driver_service_requested_at')) {
            Schema::table('vehicle_maintenance_records', function (Blueprint $table) {
                $table->timestamp('driver_service_requested_at')->nullable()->after('driver_issue_report');
            });
        }

        if (! Schema::hasColumn('vehicle_maintenance_records', 'driver_service_requested_by_user_id')) {
            Schema::table('vehicle_maintenance_records', function (Blueprint $table) {
                $table->foreignId('driver_service_requested_by_user_id')->nullable()->after('driver_service_requested_at');
            });
        }

        if (! $this->foreignKeyExists('vehicle_maintenance_records', 'vmr_drv_service_user_fk')) {
            Schema::table('vehicle_maintenance_records', function (Blueprint $table) {
                $table->foreign('driver_service_requested_by_user_id', 'vmr_drv_service_user_fk')->references('id')->on('users');
            });
        }

        if (! Schema::hasColumn('vehicle_maintenance_records', 'driver_service_request_notes')) {
            Schema::table('vehicle_maintenance_records', function (Blueprint $table) {
                $table->text('driver_service_request_notes')->nullable()->after('driver_service_requested_by_user_id');
            });
        }
    }

    public function down(): void
    {
        if ($this->foreignKeyExists('vehicle_maintenance_records', 'vmr_drv_service_user_fk')) {
            Schema::table('vehicle_maintenance_records', function (Blueprint $table) {
                $table->dropForeign('vmr_drv_service_user_fk');
            });
        }
        $this->dropColumnIfExists('vehicle_maintenance_records', 'driver_service_requested_by_user_id');
        $this->dropColumnIfExists('vehicle_maintenance_records', 'driver_service_request_notes');
        $this->dropColumnIfExists('vehicle_maintenance_records', 'driver_service_requested_at');

        if ($this->foreignKeyExists('vehicle_maintenance_records', 'vmr_drv_issue_user_fk')) {
            Schema::table('vehicle_maintenance_records', function (Blueprint $table) {
                $table->dropForeign('vmr_drv_issue_user_fk');
            });
        }
        $this->dropColumnIfExists('vehicle_maintenance_records', 'driver_issue_reported_by_user_id');
        $this->dropColumnIfExists('vehicle_maintenance_records', 'driver_issue_report');
        $this->dropColumnIfExists('vehicle_maintenance_records', 'driver_issue_reported_at');

        if ($this->foreignKeyExists('vehicle_maintenance_records', 'vmr_drv_ack_user_fk')) {
            Schema::table('vehicle_maintenance_records', function (Blueprint $table) {
                $table->dropForeign('vmr_drv_ack_user_fk');
            });
        }
        $this->dropColumnIfExists('vehicle_maintenance_records', 'driver_acknowledged_by_user_id');
        $this->dropColumnIfExists('vehicle_maintenance_records', 'driver_acknowledged_at');
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
