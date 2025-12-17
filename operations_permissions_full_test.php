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
echo "   OPERATIONS MODULE - COMPREHENSIVE PERMISSION TESTING\n";
echo "==================================================================\n\n";

// STEP 1: REVOKE ALL PERMISSIONS
echo "STEP 1: REVOKING ALL PERMISSIONS\n";
echo "------------------------------------------------------------\n";
$testRole->syncPermissions([]);
echo "SUCCESS: All permissions revoked\n";
echo "Current permissions: 0\n";
echo "Browser state: Only Dashboard visible\n\n";

// Get all Operations-related permissions
$allPerms = Permission::where('name', 'like', '%operations%')
    ->orWhere('name', 'like', '%operation%')
    ->pluck('name')
    ->toArray();

echo "Available OPERATIONS Permissions:\n";
foreach ($allPerms as $i => $perm) {
    echo '  '.($i + 1).'. '.$perm."\n";
}
echo "\nTotal available: ".count($allPerms)." permissions\n\n";

// Now assign each permission individually and guide through testing
$steps = [];

// Organize by module
echo "==================================================================\n";
echo "ORGANIZING PERMISSIONS BY MODULE/ACTION\n";
echo "==================================================================\n\n";

$operationsPerms = [];
$performancesPerms = [];
$customersPerms = [];
$geographicPerms = [];

foreach ($allPerms as $perm) {
    if (strpos($perm, 'operation') !== false && strpos($perm, 'operations') === false) {
        $operationsPerms[] = $perm;
    } elseif (strpos($perm, 'operations') !== false) {
        $operationsPerms[] = $perm;
    } elseif (strpos($perm, 'performance') !== false) {
        $performancesPerms[] = $perm;
    } elseif (strpos($perm, 'customer') !== false) {
        $customersPerms[] = $perm;
    } elseif (strpos($perm, 'geographic') !== false || strpos($perm, 'region') !== false) {
        $geographicPerms[] = $perm;
    }
}

echo 'OPERATIONS Permissions: '.count($operationsPerms)."\n";
foreach ($operationsPerms as $perm) {
    echo '  • '.$perm."\n";
}

echo "\nPERFORMANCES Permissions: ".count($performancesPerms)."\n";
foreach ($performancesPerms as $perm) {
    echo '  • '.$perm."\n";
}

echo "\nCUSTOMERS Permissions: ".count($customersPerms)."\n";
foreach ($customersPerms as $perm) {
    echo '  • '.$perm."\n";
}

echo "\n==================================================================\n";
echo "STEP-BY-STEP PERMISSION ASSIGNMENT\n";
echo "==================================================================\n\n";

$stepNum = 2;
$currentPerms = [];

// STEP 2: Add OPERATIONS.VIEW only
echo "STEP $stepNum: OPERATIONS - VIEW ONLY\n";
echo "------------------------------------------------------------\n";
$viewPerms = array_filter($operationsPerms, function ($p) {
    return strpos($p, '.view') !== false || strpos($p, '.show') !== false;
});
echo "Permissions to add:\n";
foreach ($viewPerms as $p) {
    echo "  • $p\n";
}
$currentPerms = array_merge($currentPerms, array_values($viewPerms));
$testRole->syncPermissions($currentPerms);
echo "\nSUCCESS: View permissions assigned\n";
echo 'Total permissions: '.count($currentPerms)."\n";
echo "Browser action: Refresh and check if Operations menu appears\n";
echo "Expected: Operations link visible, page loads, NO Create/Edit/Delete buttons\n\n";
$stepNum++;

// STEP 3: Add CREATE permissions
echo "STEP $stepNum: OPERATIONS - ADD CREATE\n";
echo "------------------------------------------------------------\n";
$createPerms = array_filter($operationsPerms, function ($p) {
    return strpos($p, '.create') !== false || strpos($p, '.store') !== false;
});
echo "Permissions to add:\n";
foreach ($createPerms as $p) {
    echo "  • $p\n";
}
$currentPerms = array_merge($currentPerms, array_values($createPerms));
$testRole->syncPermissions($currentPerms);
echo "\nSUCCESS: Create permissions assigned\n";
echo 'Total permissions: '.count($currentPerms)."\n";
echo "Browser action: Refresh and check if 'Create Operation' or 'New Operation' button appears\n";
echo "Expected: Create button visible and clickable\n\n";
$stepNum++;

// STEP 4: Add EDIT permissions
echo "STEP $stepNum: OPERATIONS - ADD EDIT/UPDATE\n";
echo "------------------------------------------------------------\n";
$editPerms = array_filter($operationsPerms, function ($p) {
    return strpos($p, '.edit') !== false || strpos($p, '.update') !== false;
});
echo "Permissions to add:\n";
foreach ($editPerms as $p) {
    echo "  • $p\n";
}
$currentPerms = array_merge($currentPerms, array_values($editPerms));
$testRole->syncPermissions($currentPerms);
echo "\nSUCCESS: Edit permissions assigned\n";
echo 'Total permissions: '.count($currentPerms)."\n";
echo "Browser action: Refresh and check if Edit button appears in action menu\n";
echo "Expected: Edit button visible, form can be edited\n\n";
$stepNum++;

// STEP 5: Add DELETE permissions
echo "STEP $stepNum: OPERATIONS - ADD DELETE\n";
echo "------------------------------------------------------------\n";
$deletePerms = array_filter($operationsPerms, function ($p) {
    return strpos($p, '.destroy') !== false;
});
echo "Permissions to add:\n";
foreach ($deletePerms as $p) {
    echo "  • $p\n";
}
$currentPerms = array_merge($currentPerms, array_values($deletePerms));
$testRole->syncPermissions($currentPerms);
echo "\nSUCCESS: Delete permissions assigned\n";
echo 'Total permissions: '.count($currentPerms)."\n";
echo "Browser action: Refresh and check if Delete button appears\n";
echo "Expected: Delete button visible, confirmation dialog appears\n\n";
$stepNum++;

// STEP 6: Add PERFORMANCES permissions
if (! empty($performancesPerms)) {
    echo "STEP $stepNum: PERFORMANCES - FULL CRUD\n";
    echo "------------------------------------------------------------\n";
    echo "Permissions to add:\n";
    foreach ($performancesPerms as $p) {
        echo "  • $p\n";
    }
    $currentPerms = array_merge($currentPerms, $performancesPerms);
    $testRole->syncPermissions($currentPerms);
    echo "\nSUCCESS: Performances permissions assigned\n";
    echo 'Total permissions: '.count($currentPerms)."\n";
    echo "Browser action: Check if Performances submenu appears under Operations\n";
    echo "Expected: Performances page accessible with all CRUD buttons\n\n";
    $stepNum++;
}

// STEP 7: Add CUSTOMERS permissions
if (! empty($customersPerms)) {
    echo "STEP $stepNum: CUSTOMERS - FULL CRUD\n";
    echo "------------------------------------------------------------\n";
    echo "Permissions to add:\n";
    foreach ($customersPerms as $p) {
        echo "  • $p\n";
    }
    $currentPerms = array_merge($currentPerms, $customersPerms);
    $testRole->syncPermissions($currentPerms);
    echo "\nSUCCESS: Customers permissions assigned\n";
    echo 'Total permissions: '.count($currentPerms)."\n";
    echo "Browser action: Check if Customers submenu appears under Operations\n";
    echo "Expected: Customers page accessible with all CRUD buttons\n\n";
    $stepNum++;
}

echo "==================================================================\n";
echo "TESTING COMPLETE\n";
echo "==================================================================\n";
echo "\nFinal Status:\n";
echo 'Total Permissions Assigned: '.count($currentPerms)."\n";
echo "User: Test Driver (testdriver69412e558891f@gmail.com)\n";
echo "Role: Test Driver Role\n";
echo "\nAll permissions assigned. Now test in browser:\n";
echo "1. Refresh the page\n";
echo "2. Check sidebar for Operations menu\n";
echo "3. Navigate through each submenu\n";
echo "4. Verify all CRUD buttons appear\n";
echo "5. Check console for errors\n\n";

echo "LIST OF ALL ASSIGNED PERMISSIONS:\n";
echo "------------------------------------------------------------\n";
sort($currentPerms);
foreach ($currentPerms as $perm) {
    echo "✓ $perm\n";
}

echo "\n==================================================================\n";
echo "REFRESH BROWSER TO SEE CHANGES\n";
echo "==================================================================\n";
