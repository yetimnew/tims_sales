<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

$testRole = Role::where('name', 'Test Driver Role')->first();
if (! $testRole) {
    echo "ERROR: Test Driver Role not found!\n";
    exit(1);
}

echo "==================================================================\n";
echo "   DRIVERS MODULE - COMPREHENSIVE PERMISSION TESTING\n";
echo "==================================================================\n\n";

// Step 1: Revoke all
echo "STEP 1: REVOKING ALL PERMISSIONS\n";
echo "------------------------------------------------------------\n";
$testRole->syncPermissions([]);
echo "SUCCESS: All permissions removed\n";
echo "Total permissions: 0\n";
echo "Browser state: Only Dashboard visible\n\n";

// Find all Drivers permissions
$allDriversPerms = Permission::where('name', 'like', 'drivers.%')
    ->pluck('name')
    ->toArray();

echo "DRIVERS PERMISSIONS IDENTIFIED\n";
echo "==================================================================\n";
echo 'Total permissions found: '.count($allDriversPerms)."\n\n";

echo "Available Drivers Permissions:\n";
foreach ($allDriversPerms as $i => $perm) {
    echo '  '.($i + 1).'. '.$perm."\n";
}

echo "\n==================================================================\n";
echo "STEP-BY-STEP PERMISSION ASSIGNMENT\n";
echo "==================================================================\n\n";

$stepNum = 2;
$currentPerms = [];

foreach ($allDriversPerms as $perm) {
    echo "STEP $stepNum: ADD PERMISSION - $perm\n";
    echo "------------------------------------------------------------\n";

    $currentPerms[] = $perm;
    $testRole->syncPermissions($currentPerms);

    $totalAssigned = count($currentPerms);
    echo "✓ Permission assigned: $perm\n";
    echo "  Total permissions now: $totalAssigned\n";

    if (strpos($perm, 'view') !== false) {
        echo "  EXPECTED: Drivers list should be viewable\n";
    } elseif (strpos($perm, 'create') !== false) {
        echo "  EXPECTED: 'Add Driver' or 'New Driver' button should appear\n";
    } elseif (strpos($perm, 'store') !== false) {
        echo "  EXPECTED: Driver creation form should be submittable\n";
    } elseif (strpos($perm, 'show') !== false) {
        echo "  EXPECTED: Individual driver details should be viewable\n";
    } elseif (strpos($perm, 'edit') !== false) {
        echo "  EXPECTED: Edit button should appear in action menu\n";
    } elseif (strpos($perm, 'update') !== false) {
        echo "  EXPECTED: Driver edit form should be submittable\n";
    } elseif (strpos($perm, 'destroy') !== false) {
        echo "  EXPECTED: Delete button should appear in action menu\n";
    } elseif (strpos($perm, 'activate') !== false) {
        echo "  EXPECTED: Activate button should appear in action menu\n";
    } elseif (strpos($perm, 'deactivate') !== false) {
        echo "  EXPECTED: Deactivate button should appear in action menu\n";
    } elseif (strpos($perm, 'export') !== false) {
        echo "  EXPECTED: Export button should appear on list page\n";
    }

    echo "  ⏸️  PAUSE HERE: Refresh browser and verify above\n\n";

    $stepNum++;
}

echo "==================================================================\n";
echo "ALL DRIVERS PERMISSIONS ASSIGNED\n";
echo "==================================================================\n\n";

echo "Final Status:\n";
echo 'Total Permissions: '.count($currentPerms).'/'.count($allDriversPerms)."\n\n";

echo "All Drivers Permissions Assigned:\n";
foreach ($currentPerms as $i => $perm) {
    echo '  '.($i + 1).". $perm\n";
}

echo "\n==================================================================\n";
echo "TESTING CHECKLIST FOR BROWSER\n";
echo "==================================================================\n\n";

echo "After refreshing browser, verify EACH action:\n\n";

echo "Navigation & Visibility:\n";
echo "  ☐ Sidebar shows 'Drivers' menu\n";
echo "  ☐ Can navigate to /drivers\n";
echo "  ☐ Drivers list loads (should show ~5000+ records)\n\n";

echo "CRUD Operations:\n";
echo "  ☐ 'Add Driver' button visible\n";
echo "  ☐ Can create new driver\n";
echo "  ☐ Edit button visible in action menu\n";
echo "  ☐ Can edit driver details\n";
echo "  ☐ Delete button visible in action menu\n";
echo "  ☐ Can delete driver (confirmation dialog)\n\n";

echo "Advanced Controls:\n";
echo "  ☐ Activate button visible/functional\n";
echo "  ☐ Deactivate button visible/functional\n";
echo "  ☐ Export button visible on list page\n";
echo "  ☐ Can export drivers to CSV\n";
echo "  ☐ Status changes reflected in list\n\n";

echo "Data Display:\n";
echo "  ☐ All driver fields displayed\n";
echo "  ☐ Driver name visible\n";
echo "  ☐ Driver ID visible\n";
echo "  ☐ Status shown correctly\n";
echo "  ☐ Assignment history visible\n\n";

echo "==================================================================\n";
echo "REFRESH BROWSER NOW AND TEST EACH FEATURE\n";
echo "==================================================================\n";

