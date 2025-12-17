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

echo "==================================================================\n";
echo "     MAINTENANCE MODULES - STEP BY STEP TESTING\n";
echo "==================================================================\n";
echo "This script will help you test Maintenance permissions\n";
echo "by assigning view permissions first, then CRUD permissions\n\n";

// STEP 1: REVOKE ALL PERMISSIONS
echo "🔄 STEP 1: REVOKING ALL PERMISSIONS\n";
echo "════════════════════════════════════════════════════════════════════\n";
$testRole->syncPermissions([]);
echo "✅ SUCCESS: All permissions revoked\n";
echo "   Current permissions count: 0\n";
echo "   Browser should show EMPTY sidebar with only Dashboard\n\n";

// STEP 2: Assign ONLY maintenance.view (VIEW-ONLY)
echo "🔄 STEP 2: ASSIGNING MAINTENANCE - VIEW ONLY\n";
echo "════════════════════════════════════════════════════════════════════\n";
echo "📝 Permissions to assign:\n";
echo "   • maintenance.view\n";
echo "   • maintenance.show\n\n";

$viewPerms = ['maintenance.view', 'maintenance.show'];
$testRole->syncPermissions($viewPerms);
echo "✅ SUCCESS: View permissions assigned\n";
echo '   Current permissions count: '.$testRole->permissions->count()."\n";
echo "   Browser changes:\n";
echo "   ✓ Maintenance menu should appear in sidebar\n";
echo "   ✓ Maintenance list page should load\n";
echo "   ✓ NO Create/Edit/Delete buttons should appear\n";
echo "   ✓ Action menu should be hidden or disabled\n";
echo "   ⏸️  PAUSE HERE: Refresh browser and verify above\n\n";

// STEP 3: Add maintenance.create permission
echo "🔄 STEP 3: ADDING CREATE PERMISSION\n";
echo "════════════════════════════════════════════════════════════════════\n";
echo "📝 Permission to add:\n";
echo "   • maintenance.create\n";
echo "   • maintenance.store\n\n";

$currentPerms = $testRole->permissions->pluck('name')->toArray();
$newPerms = array_merge($currentPerms, ['maintenance.create', 'maintenance.store']);
$testRole->syncPermissions($newPerms);
echo "✅ SUCCESS: Create permission added\n";
echo '   Current permissions count: '.$testRole->permissions->count()."\n";
echo "   Browser changes:\n";
echo "   ✓ 'Add Maintenance' or 'New Maintenance' button should appear\n";
echo "   ✓ Button should be clickable and functional\n";
echo "   ✓ Create form should load when clicked\n";
echo "   ⏸️  PAUSE HERE: Refresh browser and verify above\n\n";

// STEP 4: Add maintenance.edit and maintenance.update
echo "🔄 STEP 4: ADDING EDIT/UPDATE PERMISSIONS\n";
echo "════════════════════════════════════════════════════════════════════\n";
echo "📝 Permissions to add:\n";
echo "   • maintenance.edit\n";
echo "   • maintenance.update\n\n";

$currentPerms = $testRole->permissions->pluck('name')->toArray();
$newPerms = array_merge($currentPerms, ['maintenance.edit', 'maintenance.update']);
$testRole->syncPermissions($newPerms);
echo "✅ SUCCESS: Edit/Update permissions added\n";
echo '   Current permissions count: '.$testRole->permissions->count()."\n";
echo "   Browser changes:\n";
echo "   ✓ Edit button should appear in action menu\n";
echo "   ✓ Edit form should open and pre-populate data\n";
echo "   ✓ Form submission should work\n";
echo "   ⏸️  PAUSE HERE: Refresh browser and verify above\n\n";

// STEP 5: Add maintenance.destroy
echo "🔄 STEP 5: ADDING DELETE PERMISSION\n";
echo "════════════════════════════════════════════════════════════════════\n";
echo "📝 Permission to add:\n";
echo "   • maintenance.destroy\n\n";

$currentPerms = $testRole->permissions->pluck('name')->toArray();
$newPerms = array_merge($currentPerms, ['maintenance.destroy']);
$testRole->syncPermissions($newPerms);
echo "✅ SUCCESS: Delete permission added\n";
echo '   Current permissions count: '.$testRole->permissions->count()."\n";
echo "   Browser changes:\n";
echo "   ✓ Delete button should appear in action menu\n";
echo "   ✓ Confirmation dialog should appear when clicked\n";
echo "   ✓ Delete should complete successfully\n";
echo "   ⏸️  PAUSE HERE: Refresh browser and verify above\n\n";

// STEP 6: Add maintenance.complete (if it exists - for completing maintenance tasks)
echo "🔄 STEP 6: ADDING COMPLETE PERMISSION\n";
echo "════════════════════════════════════════════════════════════════════\n";
echo "📝 Permission to add:\n";
echo "   • maintenance.complete\n\n";

$currentPerms = $testRole->permissions->pluck('name')->toArray();
$newPerms = array_merge($currentPerms, ['maintenance.complete']);
$testRole->syncPermissions($newPerms);
echo "✅ SUCCESS: Complete permission added\n";
echo '   Current permissions count: '.$testRole->permissions->count()."\n";
echo "   Browser changes:\n";
echo "   ✓ Mark as Complete button may appear\n";
echo "   ✓ Status change functionality enabled\n";
echo "   ⏸️  PAUSE HERE: Refresh browser and verify above\n\n";

// STEP 7: Now test Maintenance Types module
echo "🔄 STEP 7: ASSIGNING MAINTENANCE-TYPES - VIEW ONLY\n";
echo "════════════════════════════════════════════════════════════════════\n";
echo "📝 Permissions to add:\n";
echo "   • maintenance-types.view\n";
echo "   • maintenance-types.show\n\n";

$currentPerms = $testRole->permissions->pluck('name')->toArray();
$newPerms = array_merge($currentPerms, ['maintenance-types.view', 'maintenance-types.show']);
$testRole->syncPermissions($newPerms);
echo "✅ SUCCESS: Maintenance Types view permissions added\n";
echo '   Current permissions count: '.$testRole->permissions->count()."\n";
echo "   Browser changes:\n";
echo "   ✓ Maintenance Types submenu should appear under Maintenance\n";
echo "   ✓ Maintenance Types list page should load\n";
echo "   ✓ NO Create/Edit/Delete buttons should appear\n";
echo "   ⏸️  PAUSE HERE: Refresh browser and verify above\n\n";

// STEP 8: Add Maintenance Types CRUD
echo "🔄 STEP 8: ASSIGNING MAINTENANCE-TYPES - FULL CRUD\n";
echo "════════════════════════════════════════════════════════════════════\n";
echo "📝 Permissions to add:\n";
echo "   • maintenance-types.create\n";
echo "   • maintenance-types.store\n";
echo "   • maintenance-types.edit\n";
echo "   • maintenance-types.update\n";
echo "   • maintenance-types.destroy\n\n";

$currentPerms = $testRole->permissions->pluck('name')->toArray();
$crudPerms = ['maintenance-types.create', 'maintenance-types.store', 'maintenance-types.edit', 'maintenance-types.update', 'maintenance-types.destroy'];
$newPerms = array_merge($currentPerms, $crudPerms);
$testRole->syncPermissions($newPerms);
echo "✅ SUCCESS: Maintenance Types full CRUD permissions added\n";
echo '   Current permissions count: '.$testRole->permissions->count()."\n";
echo "   Browser changes:\n";
echo "   ✓ Add Maintenance Type button should appear\n";
echo "   ✓ Edit buttons should appear in action menu\n";
echo "   ✓ Delete buttons should appear in action menu\n";
echo "   ✓ All CRUD forms should be functional\n";
echo "   ⏸️  PAUSE HERE: Refresh browser and verify above\n\n";

echo "==================================================================\n";
echo "                 ALL STEPS COMPLETE\n";
echo "==================================================================\n";
echo "\nFinal Permissions Assigned: ".$testRole->permissions->count()."\n";
echo "- maintenance.view, .show, .create, .store, .edit,\n";
echo "  .update, .destroy, .complete\n";
echo "- maintenance-types.view, .show, .create, .store, .edit,\n";
echo "  .update, .destroy\n";
echo "\nRefresh browser to see final state with all permissions\n";
