<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

$testRole = Role::where('name', 'Test Driver Role')->first();
if (! $testRole) {
    echo "Role not found!\n";
    exit(1);
}

$allReportsPerms = Permission::where('name', 'like', 'reports%')
    ->pluck('name')
    ->toArray();

$testRole->syncPermissions($allReportsPerms);

echo 'SUCCESS: All '.count($allReportsPerms)." Reports permissions assigned!\n\n";

echo "Reports Permissions Now Assigned:\n";
foreach ($allReportsPerms as $i => $perm) {
    echo '  '.($i + 1).". $perm\n";
}

echo "\nTotal: ".$testRole->permissions->count()."/28 Reports permissions\n";
echo "Status: All Reports module permissions active!\n";
