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
echo "   REPORTS MODULE - COMPREHENSIVE PERMISSION TESTING\n";
echo "==================================================================\n\n";

// Step 1: Revoke all
echo "STEP 1: REVOKING ALL PERMISSIONS\n";
echo "------------------------------------------------------------\n";
$testRole->syncPermissions([]);
echo "SUCCESS: All permissions removed\n";
echo "Total permissions: 0\n\n";

// Find all Reports permissions
$allReportsPerms = Permission::where('name', 'like', 'reports%')
    ->pluck('name')
    ->toArray();

echo "REPORTS PERMISSIONS IDENTIFIED\n";
echo "==================================================================\n";
echo 'Total permissions found: '.count($allReportsPerms)."\n\n";

echo "Available Reports Permissions:\n";
foreach ($allReportsPerms as $i => $perm) {
    echo '  '.($i + 1).'. '.$perm."\n";
}

echo "\n==================================================================\n";
echo "STEP-BY-STEP PERMISSION ASSIGNMENT\n";
echo "==================================================================\n\n";

$stepNum = 2;
$currentPerms = [];

foreach ($allReportsPerms as $perm) {
    echo "STEP $stepNum: ADD PERMISSION - $perm\n";
    echo "------------------------------------------------------------\n";

    $currentPerms[] = $perm;
    $testRole->syncPermissions($currentPerms);

    $totalAssigned = count($currentPerms);
    echo "✓ Permission assigned: $perm\n";
    echo "  Total permissions now: $totalAssigned\n";
    echo '  Cumulative: '.implode(', ', $currentPerms)."\n";

    if (strpos($perm, 'view') !== false) {
        echo "  EXPECTED: Report should be viewable\n";
    } elseif (strpos($perm, 'export') !== false) {
        echo "  EXPECTED: Export functionality should be available\n";
    } elseif (strpos($perm, 'create') !== false) {
        echo "  EXPECTED: Can create custom reports\n";
    } elseif (strpos($perm, 'edit') !== false) {
        echo "  EXPECTED: Can edit reports\n";
    } elseif (strpos($perm, 'delete') !== false) {
        echo "  EXPECTED: Can delete reports\n";
    }

    echo "\n";
    $stepNum++;
}

echo "==================================================================\n";
echo "ALL REPORTS PERMISSIONS ASSIGNED\n";
echo "==================================================================\n\n";

echo "Final Status:\n";
echo 'Total Permissions: '.count($currentPerms).'/'.count($allReportsPerms)."\n\n";

echo "All Reports Permissions Assigned:\n";
foreach ($currentPerms as $i => $perm) {
    echo '  '.($i + 1).". $perm\n";
}

echo "\n==================================================================\n";
echo "TESTING CHECKLIST FOR BROWSER\n";
echo "==================================================================\n\n";

echo "After refreshing browser, verify EACH report accessible:\n\n";

echo "Navigation:\n";
echo "  ☐ Sidebar shows 'Reports' menu\n";
echo "  ☐ Can expand Reports submenu\n";
echo "  ☐ See all available reports\n\n";

echo "Report Access:\n";
foreach ($allReportsPerms as $perm) {
    if (strpos($perm, 'view') !== false || strpos($perm, 'export') !== false) {
        $reportName = str_replace('reports.', '', $perm);
        $reportName = str_replace('.view', '', $reportName);
        $reportName = str_replace('.export', '', $reportName);
        echo "  ☐ $perm - Accessible\n";
    }
}

echo "\n==================================================================\n";
echo "REFRESH BROWSER NOW AND TEST EACH REPORT\n";
echo "==================================================================\n";
