<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Spatie\Permission\Models\Role;

$testRole = Role::where('name', 'Test Driver Role')->first();
if (! $testRole) {
    echo "Role not found!\n";
    exit(1);
}

echo "ASSIGNING ALL 11 OPERATIONS PERMISSIONS\n";
echo "==================================================================\n\n";

$allPerms = [
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

$testRole->syncPermissions($allPerms);

echo "SUCCESS: All 11 permissions assigned!\n\n";

echo "Permissions now assigned:\n";
foreach ($allPerms as $i => $perm) {
    echo '  '.($i + 1).". $perm\n";
}

echo "\nTotal: ".$testRole->permissions->count()."/11\n";
echo "\nRefresh browser to test all Operations features!\n";
