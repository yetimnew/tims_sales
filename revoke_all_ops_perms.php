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

$testRole->syncPermissions([]);
echo "All permissions revoked.\n";
echo 'Current permissions: '.$testRole->permissions->count()."\n";
echo "Refresh browser to see baseline (no Operations menu)\n";
