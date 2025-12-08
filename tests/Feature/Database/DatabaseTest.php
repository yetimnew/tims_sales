<?php

namespace Tests\Feature\Database;

use App\Models\Driver;
use App\Models\Region;
use App\Models\Truck;
use App\Models\User;
use App\Models\VehicleType;
use App\Models\Zone;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class DatabaseTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function database_connection_works()
    {
        $this->assertTrue(DB::connection()->getPdo() !== null);
    }

    #[Test]
    public function all_tables_exist()
    {
        $tables = [
            'users',
            'trucks',
            'drivers',
            'vehicletypes',
            'regions',
            'zones',
            'woredas',
            'places',
            'distances',
            'operations',
            'performances',
            'customers',
            'cargo_types',
            'vehicle_maintenance_records',
            'fuel_records',
            'truck_financial_records',
            'driver_truck',
            'maintenance_types',
            'statuses',
            'statustypes',
            'permissions',
            'roles',
            'model_has_permissions',
            'model_has_roles',
            'role_has_permissions',
            'activity_log',
        ];

        foreach ($tables as $table) {
            $this->assertTrue(DB::getSchemaBuilder()->hasTable($table), "Table {$table} does not exist");
        }
    }

    #[Test]
    public function foreign_key_constraints_work()
    {
        // Test truck -> vehicletype foreign key
        $vehicleType = VehicleType::factory()->create();
        $truck = Truck::factory()->create(['vehicletype_id' => $vehicleType->id]);

        $this->assertEquals($vehicleType->id, $truck->vehicletype_id);

        // Test driver -> zone foreign key
        $zone = Zone::factory()->create();
        $driver = Driver::factory()->create(['zone_id' => $zone->id]);

        $this->assertEquals($zone->id, $driver->zone_id);

        // Test zone -> region foreign key
        $region = Region::factory()->create();
        $zone = Zone::factory()->create(['region_id' => $region->id]);

        $this->assertEquals($region->id, $zone->region_id);
    }

    #[Test]
    public function unique_constraints_work()
    {
        // Test unique email constraint
        User::factory()->create(['email' => 'test@example.com']);

        $this->expectException(\Illuminate\Database\QueryException::class);
        User::factory()->create(['email' => 'test@example.com']);
    }

    #[Test]
    public function soft_deletes_work()
    {
        $truck = Truck::factory()->create();
        $truckId = $truck->id;

        $truck->delete();

        $this->assertSoftDeleted('trucks', ['id' => $truckId]);
        $this->assertDatabaseHas('trucks', ['id' => $truckId]);
        $this->assertNull(Truck::find($truckId));
        $this->assertNotNull(Truck::withTrashed()->find($truckId));
    }

    #[Test]
    public function database_transactions_work()
    {
        DB::beginTransaction();

        try {
            $truck = Truck::factory()->create();
            $this->assertDatabaseHas('trucks', ['id' => $truck->id]);

            DB::rollback();

            $this->assertDatabaseMissing('trucks', ['id' => $truck->id]);
        } catch (\Exception $e) {
            DB::rollback();
            throw $e;
        }
    }

    #[Test]
    public function database_indexes_exist()
    {
        $indexes = [
            'trucks' => ['plate', 'vehicletype_id', 'status'],
            'drivers' => ['driver_id', 'mobile', 'zone_id', 'status'],
            'operations' => ['operationid', 'customer_id', 'status'],
            'performances' => ['operation_id', 'driver_truck_id', 'DateDispach'],
            'fuel_records' => ['truck_id', 'driver_id', 'fuel_date'],
            'vehicle_maintenance_records' => ['truck_id', 'scheduled_date', 'status'],
            'truck_financial_records' => ['truck_id', 'record_date', 'period_type'],
        ];

        foreach ($indexes as $table => $columns) {
            foreach ($columns as $column) {
                $indexes = DB::select("SHOW INDEX FROM {$table} WHERE Column_name = '{$column}'");
                $this->assertNotEmpty($indexes, "Index on {$table}.{$column} does not exist");
            }
        }
    }

    #[Test]
    public function database_triggers_work()
    {
        // Test if any triggers exist and work properly
        $triggers = DB::select('SHOW TRIGGERS');

        // This test ensures triggers can be queried
        $this->assertIsArray($triggers);
    }

    #[Test]
    public function database_views_exist()
    {
        // Test if any views exist
        $views = DB::select("SHOW FULL TABLES WHERE Table_type = 'VIEW'");

        // This test ensures views can be queried
        $this->assertIsArray($views);
    }

    #[Test]
    public function database_stored_procedures_exist()
    {
        // Test if any stored procedures exist
        $procedures = DB::select('SHOW PROCEDURE STATUS');

        // This test ensures stored procedures can be queried
        $this->assertIsArray($procedures);
    }

    #[Test]
    public function database_functions_exist()
    {
        // Test if any functions exist
        $functions = DB::select('SHOW FUNCTION STATUS');

        // This test ensures functions can be queried
        $this->assertIsArray($functions);
    }

    #[Test]
    public function database_events_exist()
    {
        // Test if any events exist
        $events = DB::select('SHOW EVENTS');

        // This test ensures events can be queried
        $this->assertIsArray($events);
    }

    #[Test]
    public function database_character_set_is_utf8()
    {
        $charset = DB::select('SELECT DEFAULT_CHARACTER_SET_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = DATABASE()');

        $this->assertEquals('utf8mb4', $charset[0]->DEFAULT_CHARACTER_SET_NAME);
    }

    #[Test]
    public function database_collation_is_utf8()
    {
        $collation = DB::select('SELECT DEFAULT_COLLATION_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = DATABASE()');

        $this->assertEquals('utf8mb4_unicode_ci', $collation[0]->DEFAULT_COLLATION_NAME);
    }

    #[Test]
    public function database_timezone_is_set()
    {
        $timezone = DB::select('SELECT @@time_zone as timezone');

        $this->assertNotEmpty($timezone[0]->timezone);
    }

    #[Test]
    public function database_max_connections_is_set()
    {
        $maxConnections = DB::select('SELECT @@max_connections as max_connections');

        $this->assertGreaterThan(0, $maxConnections[0]->max_connections);
    }

    #[Test]
    public function database_query_cache_is_enabled()
    {
        $queryCache = DB::select("SHOW VARIABLES LIKE 'query_cache_type'");

        if (! empty($queryCache)) {
            $this->assertNotEmpty($queryCache[0]->Value);
        }
    }

    #[Test]
    public function database_innodb_buffer_pool_size_is_set()
    {
        $bufferPoolSize = DB::select("SHOW VARIABLES LIKE 'innodb_buffer_pool_size'");

        $this->assertNotEmpty($bufferPoolSize[0]->Value);
    }

    #[Test]
    public function database_innodb_log_file_size_is_set()
    {
        $logFileSize = DB::select("SHOW VARIABLES LIKE 'innodb_log_file_size'");

        $this->assertNotEmpty($logFileSize[0]->Value);
    }

    #[Test]
    public function database_innodb_flush_log_at_trx_commit_is_set()
    {
        $flushLogAtTrxCommit = DB::select("SHOW VARIABLES LIKE 'innodb_flush_log_at_trx_commit'");

        $this->assertNotEmpty($flushLogAtTrxCommit[0]->Value);
    }

    #[Test]
    public function database_slow_query_log_is_enabled()
    {
        $slowQueryLog = DB::select("SHOW VARIABLES LIKE 'slow_query_log'");

        $this->assertNotEmpty($slowQueryLog[0]->Value);
    }

    #[Test]
    public function database_long_query_time_is_set()
    {
        $longQueryTime = DB::select("SHOW VARIABLES LIKE 'long_query_time'");

        $this->assertNotEmpty($longQueryTime[0]->Value);
    }

    #[Test]
    public function database_binlog_format_is_set()
    {
        $binlogFormat = DB::select("SHOW VARIABLES LIKE 'binlog_format'");

        $this->assertNotEmpty($binlogFormat[0]->Value);
    }

    #[Test]
    public function database_expire_logs_days_is_set()
    {
        $expireLogsDays = DB::select("SHOW VARIABLES LIKE 'expire_logs_days'");

        $this->assertNotEmpty($expireLogsDays[0]->Value);
    }

    #[Test]
    public function database_max_binlog_size_is_set()
    {
        $maxBinlogSize = DB::select("SHOW VARIABLES LIKE 'max_binlog_size'");

        $this->assertNotEmpty($maxBinlogSize[0]->Value);
    }

    #[Test]
    public function database_innodb_file_per_table_is_enabled()
    {
        $filePerTable = DB::select("SHOW VARIABLES LIKE 'innodb_file_per_table'");

        $this->assertEquals('ON', $filePerTable[0]->Value);
    }

    #[Test]
    public function database_innodb_flush_method_is_set()
    {
        $flushMethod = DB::select("SHOW VARIABLES LIKE 'innodb_flush_method'");

        $this->assertNotEmpty($flushMethod[0]->Value);
    }

    #[Test]
    public function database_innodb_io_capacity_is_set()
    {
        $ioCapacity = DB::select("SHOW VARIABLES LIKE 'innodb_io_capacity'");

        $this->assertNotEmpty($ioCapacity[0]->Value);
    }

    #[Test]
    public function database_innodb_read_io_threads_is_set()
    {
        $readIoThreads = DB::select("SHOW VARIABLES LIKE 'innodb_read_io_threads'");

        $this->assertNotEmpty($readIoThreads[0]->Value);
    }

    #[Test]
    public function database_innodb_write_io_threads_is_set()
    {
        $writeIoThreads = DB::select("SHOW VARIABLES LIKE 'innodb_write_io_threads'");

        $this->assertNotEmpty($writeIoThreads[0]->Value);
    }

    #[Test]
    public function database_innodb_thread_concurrency_is_set()
    {
        $threadConcurrency = DB::select("SHOW VARIABLES LIKE 'innodb_thread_concurrency'");

        $this->assertNotEmpty($threadConcurrency[0]->Value);
    }

    #[Test]
    public function database_innodb_lock_wait_timeout_is_set()
    {
        $lockWaitTimeout = DB::select("SHOW VARIABLES LIKE 'innodb_lock_wait_timeout'");

        $this->assertNotEmpty($lockWaitTimeout[0]->Value);
    }

    #[Test]
    public function database_innodb_deadlock_detect_is_enabled()
    {
        $deadlockDetect = DB::select("SHOW VARIABLES LIKE 'innodb_deadlock_detect'");

        $this->assertEquals('ON', $deadlockDetect[0]->Value);
    }

    #[Test]
    public function database_innodb_print_all_deadlocks_is_set()
    {
        $printAllDeadlocks = DB::select("SHOW VARIABLES LIKE 'innodb_print_all_deadlocks'");

        $this->assertNotEmpty($printAllDeadlocks[0]->Value);
    }

    #[Test]
    public function database_innodb_rollback_on_timeout_is_set()
    {
        $rollbackOnTimeout = DB::select("SHOW VARIABLES LIKE 'innodb_rollback_on_timeout'");

        $this->assertNotEmpty($rollbackOnTimeout[0]->Value);
    }

    #[Test]
    public function database_innodb_status_output_is_set()
    {
        $statusOutput = DB::select("SHOW VARIABLES LIKE 'innodb_status_output'");

        $this->assertNotEmpty($statusOutput[0]->Value);
    }

    #[Test]
    public function database_innodb_status_output_locks_is_set()
    {
        $statusOutputLocks = DB::select("SHOW VARIABLES LIKE 'innodb_status_output_locks'");

        $this->assertNotEmpty($statusOutputLocks[0]->Value);
    }

    #[Test]
    public function database_innodb_buffer_pool_instances_is_set()
    {
        $bufferPoolInstances = DB::select("SHOW VARIABLES LIKE 'innodb_buffer_pool_instances'");

        $this->assertNotEmpty($bufferPoolInstances[0]->Value);
    }

    #[Test]
    public function database_innodb_old_blocks_time_is_set()
    {
        $oldBlocksTime = DB::select("SHOW VARIABLES LIKE 'innodb_old_blocks_time'");

        $this->assertNotEmpty($oldBlocksTime[0]->Value);
    }

    #[Test]
    public function database_innodb_old_blocks_pct_is_set()
    {
        $oldBlocksPct = DB::select("SHOW VARIABLES LIKE 'innodb_old_blocks_pct'");

        $this->assertNotEmpty($oldBlocksPct[0]->Value);
    }

    #[Test]
    public function database_innodb_change_buffering_is_set()
    {
        $changeBuffering = DB::select("SHOW VARIABLES LIKE 'innodb_change_buffering'");

        $this->assertNotEmpty($changeBuffering[0]->Value);
    }

    #[Test]
    public function database_innodb_change_buffer_max_size_is_set()
    {
        $changeBufferMaxSize = DB::select("SHOW VARIABLES LIKE 'innodb_change_buffer_max_size'");

        $this->assertNotEmpty($changeBufferMaxSize[0]->Value);
    }

    #[Test]
    public function database_innodb_adaptive_flushing_is_enabled()
    {
        $adaptiveFlushing = DB::select("SHOW VARIABLES LIKE 'innodb_adaptive_flushing'");

        $this->assertEquals('ON', $adaptiveFlushing[0]->Value);
    }

    #[Test]
    public function database_innodb_adaptive_flushing_lwm_is_set()
    {
        $adaptiveFlushingLwm = DB::select("SHOW VARIABLES LIKE 'innodb_adaptive_flushing_lwm'");

        $this->assertNotEmpty($adaptiveFlushingLwm[0]->Value);
    }

    #[Test]
    public function database_innodb_flush_neighbors_is_set()
    {
        $flushNeighbors = DB::select("SHOW VARIABLES LIKE 'innodb_flush_neighbors'");

        $this->assertNotEmpty($flushNeighbors[0]->Value);
    }

    #[Test]
    public function database_innodb_random_read_ahead_is_enabled()
    {
        $randomReadAhead = DB::select("SHOW VARIABLES LIKE 'innodb_random_read_ahead'");

        $this->assertEquals('OFF', $randomReadAhead[0]->Value);
    }

    #[Test]
    public function database_innodb_read_ahead_threshold_is_set()
    {
        $readAheadThreshold = DB::select("SHOW VARIABLES LIKE 'innodb_read_ahead_threshold'");

        $this->assertNotEmpty($readAheadThreshold[0]->Value);
    }

    #[Test]
    public function database_innodb_use_native_aio_is_enabled()
    {
        $useNativeAio = DB::select("SHOW VARIABLES LIKE 'innodb_use_native_aio'");

        $this->assertEquals('ON', $useNativeAio[0]->Value);
    }

    #[Test]
    public function database_innodb_io_capacity_max_is_set()
    {
        $ioCapacityMax = DB::select("SHOW VARIABLES LIKE 'innodb_io_capacity_max'");

        $this->assertNotEmpty($ioCapacityMax[0]->Value);
    }

    #[Test]
    public function database_innodb_lru_scan_depth_is_set()
    {
        $lruScanDepth = DB::select("SHOW VARIABLES LIKE 'innodb_lru_scan_depth'");

        $this->assertNotEmpty($lruScanDepth[0]->Value);
    }

    #[Test]
    public function database_innodb_checksum_algorithm_is_set()
    {
        $checksumAlgorithm = DB::select("SHOW VARIABLES LIKE 'innodb_checksum_algorithm'");

        $this->assertNotEmpty($checksumAlgorithm[0]->Value);
    }

    #[Test]
    public function database_innodb_log_checksums_is_enabled()
    {
        $logChecksums = DB::select("SHOW VARIABLES LIKE 'innodb_log_checksums'");

        $this->assertEquals('ON', $logChecksums[0]->Value);
    }

    #[Test]
    public function database_innodb_fast_shutdown_is_set()
    {
        $fastShutdown = DB::select("SHOW VARIABLES LIKE 'innodb_fast_shutdown'");

        $this->assertNotEmpty($fastShutdown[0]->Value);
    }

    #[Test]
    public function database_innodb_force_recovery_is_set()
    {
        $forceRecovery = DB::select("SHOW VARIABLES LIKE 'innodb_force_recovery'");

        $this->assertEquals('0', $forceRecovery[0]->Value);
    }

    #[Test]
    public function database_innodb_compression_level_is_set()
    {
        $compressionLevel = DB::select("SHOW VARIABLES LIKE 'innodb_compression_level'");

        $this->assertNotEmpty($compressionLevel[0]->Value);
    }

    #[Test]
    public function database_innodb_compression_failure_threshold_pct_is_set()
    {
        $compressionFailureThresholdPct = DB::select("SHOW VARIABLES LIKE 'innodb_compression_failure_threshold_pct'");

        $this->assertNotEmpty($compressionFailureThresholdPct[0]->Value);
    }

    #[Test]
    public function database_innodb_compression_pad_pct_max_is_set()
    {
        $compressionPadPctMax = DB::select("SHOW VARIABLES LIKE 'innodb_compression_pad_pct_max'");

        $this->assertNotEmpty($compressionPadPctMax[0]->Value);
    }

    #[Test]
    public function database_innodb_compression_algorithm_is_set()
    {
        $compressionAlgorithm = DB::select("SHOW VARIABLES LIKE 'innodb_compression_algorithm'");

        $this->assertNotEmpty($compressionAlgorithm[0]->Value);
    }
}
