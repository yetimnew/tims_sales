<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Spatie\Permission\Models\Role;

$testRole = Role::where('name', 'Test Driver Role')->first();
if (! $testRole) {
    echo "ERROR: Test Driver Role not found!\n";
    exit(1);
}

echo "==================================================================\n";
echo "   OPERATIONS - INDIVIDUAL PERMISSION TESTING\n";
echo "   Testing each permission one by one\n";
echo "==================================================================\n\n";

// Step 1: Revoke all
echo "STEP 1: REVOKING ALL PERMISSIONS\n";
echo "------------------------------------------------------------\n";
$testRole->syncPermissions([]);
echo "SUCCESS: All permissions removed\n";
echo "Total permissions: 0\n\n";

// Define all 11 operations permissions
$allOperationsPerms = [
    'operations.view',
    'operations.show',
    'operations.create',
    'operations.store',
    'operations.edit',
    'operations.update',
    'operations.destroy',
    'operations.available',
    'operations.deactivate',
    'reports.operation-profitability.view',
    'reports.operation-profitability.export',
];

echo "INDIVIDUAL PERMISSION TESTING\n";
echo "==================================================================\n\n";

$stepNum = 2;
$currentPerms = [];

foreach ($allOperationsPerms as $perm) {
    echo "STEP $stepNum: ADD PERMISSION - $perm\n";
    echo "------------------------------------------------------------\n";

    $currentPerms[] = $perm;
    $testRole->syncPermissions($currentPerms);

    $totalAssigned = count($currentPerms);
    echo "✓ Permission assigned: $perm\n";
    echo "  Total permissions now: $totalAssigned\n";
    echo '  Cumulative perms: '.implode(', ', $currentPerms)."\n";
    echo "\n  ACTION: Refresh browser and test\n";

    if (strpos($perm, 'view') !== false || strpos($perm, 'show') !== false) {
        echo "  EXPECTED: Menu/list page should now be visible\n";
    } elseif (strpos($perm, 'create') !== false || strpos($perm, 'store') !== false) {
        echo "  EXPECTED: Create button should now appear\n";
    } elseif (strpos($perm, 'edit') !== false || strpos($perm, 'update') !== false) {
        echo "  EXPECTED: Edit buttons should now appear in action menu\n";
    } elseif (strpos($perm, 'destroy') !== false) {
        echo "  EXPECTED: Delete buttons should now appear in action menu\n";
    } elseif (strpos($perm, 'deactivate') !== false) {
        echo "  EXPECTED: Deactivate button should now appear\n";
    } elseif (strpos($perm, 'available') !== false) {
        echo "  EXPECTED: Availability controls should now appear\n";
    } elseif (strpos($perm, 'report') !== false) {
        echo "  EXPECTED: Report features should now be accessible\n";
    }

    echo "\n";
    $stepNum++;
}

echo "==================================================================\n";
echo "ALL 11 PERMISSIONS ASSIGNED\n";
echo "==================================================================\n\n";

echo "Final Status:\n";
echo 'Total Permissions: '.count($currentPerms)."/11\n";
echo "All Permissions Assigned:\n";
foreach ($currentPerms as $i => $perm) {
    echo '  '.($i + 1).". $perm\n";
}

echo "\n==================================================================\n";
echo "TESTING CHECKLIST FOR BROWSER\n";
echo "==================================================================\n\n";

echo "After refreshing browser, verify EACH permission working:\n\n";

echo "1. operations.view + operations.show\n";
echo "   ☐ Sidebar menu shows 'Operations'\n";
echo "   ☐ Can navigate to /operations\n";
echo "   ☐ Operations list loads with 1,983 records\n\n";

echo "2. operations.create + operations.store\n";
echo "   ☐ 'Add Operation' button visible\n";
echo "   ☐ Can click Create button\n";
echo "   ☐ Create form opens\n\n";

echo "3. operations.edit + operations.update\n";
echo "   ☐ Edit button appears in action menu\n";
echo "   ☐ Can click Edit button\n";
echo "   ☐ Edit form opens with pre-populated data\n\n";

echo "4. operations.destroy\n";
echo "   ☐ Delete button appears in action menu\n";
echo "   ☐ Can click Delete button\n";
echo "   ☐ Confirmation dialog appears\n\n";

echo "5. operations.available\n";
echo "   ☐ Availability controls visible\n";
echo "   ☐ Can mark as available/unavailable\n\n";

echo "6. operations.deactivate\n";
echo "   ☐ Deactivate option visible in action menu\n";
echo "   ☐ Can deactivate operations\n\n";

echo "7. reports.operation-profitability.view\n";
echo "   ☐ Report data accessible\n";
echo "   ☐ Profitability metrics displaying\n\n";

echo "8. reports.operation-profitability.export\n";
echo "   ☐ Export button visible\n";
echo "   ☐ Can export profitability data\n\n";

echo "==================================================================\n";
echo "REFRESH BROWSER NOW AND TEST EACH FEATURE\n";
echo "==================================================================\n";
