<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('emergency_alerts')) {
            Schema::create('emergency_alerts', function (Blueprint $table) {
                $table->id();
                $table->foreignId('driver_id');
                $table->foreignId('user_id');
                $table->foreignId('truck_id')->nullable();
                $table->foreignId('driver_truck_id')->nullable();
                $table->string('alert_code', 64)->unique();
                $table->decimal('latitude', 10, 8)->nullable();
                $table->decimal('longitude', 11, 8)->nullable();
                $table->boolean('location_missing')->default(false);
                $table->text('message')->nullable();
                $table->string('status', 32)->default('pending');
                $table->timestamp('acknowledged_at')->nullable();
                $table->foreignId('acknowledged_by_user_id')->nullable();
                $table->timestamp('resolved_at')->nullable();
                $table->foreignId('resolved_by_user_id')->nullable();
                $table->timestamp('false_alarm_at')->nullable();
                $table->foreignId('false_alarm_by_user_id')->nullable();
                $table->text('resolution_notes')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasColumn('emergency_alerts', 'location_missing')) {
            Schema::table('emergency_alerts', function (Blueprint $table) {
                $table->boolean('location_missing')->default(false)->after('longitude');
            });
        }

        $this->addForeignKeyIfMissing('emergency_alerts', 'ea_driver_fk', 'driver_id', 'drivers', false);
        $this->addForeignKeyIfMissing('emergency_alerts', 'ea_user_fk', 'user_id', 'users', false);
        $this->addForeignKeyIfMissing('emergency_alerts', 'ea_truck_fk', 'truck_id', 'trucks', true);
        $this->addForeignKeyIfMissing('emergency_alerts', 'ea_driver_truck_fk', 'driver_truck_id', 'driver_truck', true);
        $this->addForeignKeyIfMissing('emergency_alerts', 'ea_ack_user_fk', 'acknowledged_by_user_id', 'users', true);
        $this->addForeignKeyIfMissing('emergency_alerts', 'ea_resolve_user_fk', 'resolved_by_user_id', 'users', true);
        $this->addForeignKeyIfMissing('emergency_alerts', 'ea_false_alarm_user_fk', 'false_alarm_by_user_id', 'users', true);
    }

    public function down(): void
    {
        foreach ([
            'ea_false_alarm_user_fk',
            'ea_resolve_user_fk',
            'ea_ack_user_fk',
            'ea_driver_truck_fk',
            'ea_truck_fk',
            'ea_user_fk',
            'ea_driver_fk',
        ] as $constraint) {
            if ($this->foreignKeyExists('emergency_alerts', $constraint)) {
                Schema::table('emergency_alerts', function (Blueprint $table) use ($constraint) {
                    $table->dropForeign($constraint);
                });
            }
        }

        Schema::dropIfExists('emergency_alerts');
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

    private function addForeignKeyIfMissing(string $tableName, string $constraint, string $column, string $references, bool $nullableOnDelete): void
    {
        if (! Schema::hasColumn($tableName, $column) || $this->foreignKeyExists($tableName, $constraint)) {
            return;
        }

        Schema::table($tableName, function (Blueprint $table) use ($column, $constraint, $references, $nullableOnDelete) {
            $foreign = $table->foreign($column, $constraint)->references('id')->on($references);

            if ($nullableOnDelete) {
                $foreign->nullOnDelete();
            }
        });
    }
};
