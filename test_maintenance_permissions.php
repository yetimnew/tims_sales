<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

$testRole = Role::where('name', 'Test Driver Role')->first();
if (! $testRole) {
    echo "❌ Test Driver Role not found!\n";
    exit(1);
}

echo "╔════════════════════════════════════════════════════════════╗\n";
echo "║     MAINTENANCE PERMISSIONS - STEP BY STEP TESTING        ║\n";
echo "╚════════════════════════════════════════════════════════════╝\n\n";

// STEP 1: REVOKE ALL PERMISSIONS
echo "STEP 1: REVOKING ALL PERMISSIONS\n";
echo "────────────────────────────────────\n";
$testRole->syncPermissions([]);
echo "✅ All permissions revoked from '{$testRole->name}'\n";
echo "   Current permissions: 0\n\n";

// Get all Maintenance-related permissions
$maintenancePermissions = Permission::where('name', 'like', 'maintenance%')->pluck('name')->toArray();
echo "Available Maintenance Permissions:\n";
foreach ($maintenancePermissions as $i => $perm) {
    echo '  '.($i + 1).'. '.$perm."\n";
}
echo "\n";

// STEP 2-5: Add permissions one by one
$steps = [
    'maintenance' => 'Maintenance',
    'maintenance_types' => 'Maintenance Types',
    'maintenance_schedules' => 'Maintenance Schedules',
    'maintenance_records' => 'Maintenance Records',
];

$stepNum = 2;
foreach ($steps as $prefix => $name) {
    // Find permissions starting with this prefix
    $perms = Permission::where('name', 'like', $prefix.'%')->pluck('name')->toArray();

    if (empty($perms)) {
        echo "STEP $stepNum: TESTING $name\n";
        echo "────────────────────────────────────\n";
        echo "⚠️  No permissions found for '$prefix'\n";
        echo "   This module may not exist or has different permission naming\n\n";
        $stepNum++;

        continue;
    }

    echo "STEP $stepNum: ASSIGNING ".strtoupper($name)." PERMISSIONS\n";
    echo "────────────────────────────────────\n";

    // Get current permissions
    $currentPerms = $testRole->permissions->pluck('name')->toArray();

    // Add these permissions
    $newPerms = array_merge($currentPerms, $perms);
    $testRole->syncPermissions($newPerms);

    echo '✅ Assigned '.count($perms)." permission(s):\n";
    foreach ($perms as $perm) {
        echo '   • '.$perm."\n";
    }

    $totalPerms = $testRole->permissions->count();
    echo "\n   Total permissions now: $totalPerms\n";
    echo "   ACTION: Refresh browser and verify UI changes\n\n";

    $stepNum++;
}

echo "╔════════════════════════════════════════════════════════════╗\n";
echo "║           TESTING COMPLETE - PERMISSIONS SET               ║\n";
echo "║                                                            ║\n";
echo "║  Refresh your browser to see the changes in real-time     ║\n";
echo "╚════════════════════════════════════════════════════════════╝\n";
