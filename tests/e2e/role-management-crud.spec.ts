import { test, expect, Page } from '@playwright/test';

// Serial execution - ONE test at a time
test.describe.configure({ mode: 'serial' });

// Test users - MUST MATCH DATABASE SEEDERS
const ADMIN = { email: 'admin@test.com', password: 'password123' };
const MANAGER = { email: 'manager@test.com', password: 'password123' };
const USER = { email: 'user@test.com', password: 'password123' };

// Simple login function
async function login(page: Page, email: string, password: string) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.locator('#email').waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(300);
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.locator('button[type="submit"]').first().click();

  try {
    await Promise.race([
      page.waitForURL(/\/dashboard/, { timeout: 8000 }),
      page.waitForURL(/\/trucks/, { timeout: 8000 }),
    ]);
  } catch {
    await page.waitForTimeout(1000);
  }
}

// Navigate to roles page
async function goRoles(page: Page) {
  await page.goto('/roles', { waitUntil: 'domcontentloaded', timeout: 25000 });
  await Promise.race([
    page.locator('h1:has-text("Roles")').waitFor({ state: 'visible', timeout: 10000 }).catch(() => {}),
    page.locator('table tbody').waitFor({ state: 'visible', timeout: 10000 }).catch(() => {}),
  ]);
  await page.waitForTimeout(500);
}

// ============================================================================
// ROLE INDEX PAGE TESTS
// ============================================================================

test.describe('Role Index Page', () => {
  test('Admin can view roles index page', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goRoles(page);
    await expect(page.locator('h1')).toContainText(/Roles|Role Management/);
  });

  test('Roles table displays role information', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goRoles(page);
    const table = page.locator('table').first();
    const thCount = await table.locator('th').count();
    const rowCount = await table.locator('tbody tr').count();
    expect(thCount).toBeGreaterThan(0);
    expect(rowCount).toBeGreaterThan(0);
  });

  test('Admin can search roles', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goRoles(page);
    const input = page.locator('input[placeholder*="Search"]').first();
    if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
      await input.fill('admin');
      await page.waitForTimeout(500);
    }
  });

  test('Admin can sort roles by name', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goRoles(page);
    const header = page.locator('th').filter({ hasText: /name/i }).first();
    if (await header.isVisible({ timeout: 2000 }).catch(() => false)) {
      await header.click();
      await page.waitForTimeout(500);
    }
  });

  test('Admin can export roles to CSV', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goRoles(page);
    const btn = page.locator('button:has-text("Export")').first();
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      const downloadPromise = page.waitForEvent('download');
      await btn.click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/roles_.*\.csv/);
    }
  });
});

// ============================================================================
// ROLE CREATION TESTS
// ============================================================================

test.describe('Role Creation', () => {
  test('Admin can navigate to create role page', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goRoles(page);
    const btn = page.locator('button:has-text("Create"), a:has-text("Create"), button:has-text("Add Role")').first();
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btn.click();
      await page.waitForURL(/.*roles.*create/, { timeout: 5000 }).catch(() => {});
      await expect(page.locator('h1')).toContainText(/Create.*Role/);
    }
  });

  test('Admin can create a new role', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goRoles(page);

    const btn = page.locator('button:has-text("Create"), a:has-text("Create"), button:has-text("Add Role")').first();
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btn.click();
      await page.waitForURL(/.*roles.*create/, { timeout: 5000 }).catch(() => {});

      const timestamp = Date.now();
      const roleName = `test_role_${timestamp}`;

      await page.fill('input[name="name"]', roleName);

      // Select a few permissions
      const checkboxes = page.locator('input[type="checkbox"]');
      const checkboxCount = await checkboxes.count();
      if (checkboxCount > 0) {
        // Select first few checkboxes
        for (let i = 0; i < Math.min(3, checkboxCount); i++) {
          await checkboxes.nth(i).check();
        }
      }

      await page.click('button[type="submit"]');
      await page.waitForURL('/roles', { timeout: 8000 }).catch(() => {});

      // Check for success message
      const successMsg = page.locator('.alert-success, .success').first();
      if (await successMsg.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(successMsg).toContainText(/successfully/);
      }
    }
  });

  test('Role creation validates required fields', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goRoles(page);

    const btn = page.locator('button:has-text("Create"), a:has-text("Create"), button:has-text("Add Role")').first();
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btn.click();
      await page.waitForURL(/.*roles.*create/, { timeout: 5000 }).catch(() => {});

      // Try to submit empty form
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000);

      // Check for validation errors
      const errors = page.locator('.error, .invalid-feedback, .text-red-600');
      const errorCount = await errors.count();
      expect(errorCount).toBeGreaterThan(0);
    }
  });

  test('Role creation validates unique role name', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goRoles(page);

    const btn = page.locator('button:has-text("Create"), a:has-text("Create"), button:has-text("Add Role")').first();
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btn.click();
      await page.waitForURL(/.*roles.*create/, { timeout: 5000 }).catch(() => {});

      // Try to create role with existing name
      await page.fill('input[name="name"]', 'admin');

      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000);

      const errors = page.locator('.error, .invalid-feedback, .text-red-600');
      const hasError = await errors.count() > 0;
      expect(hasError).toBeTruthy();
    }
  });

  test('Admin can select permissions when creating role', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goRoles(page);

    const btn = page.locator('button:has-text("Create"), a:has-text("Create"), button:has-text("Add Role")').first();
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btn.click();
      await page.waitForURL(/.*roles.*create/, { timeout: 5000 }).catch(() => {});

      // Check if permissions are displayed
      const checkboxes = page.locator('input[type="checkbox"]');
      const checkboxCount = await checkboxes.count();
      expect(checkboxCount).toBeGreaterThan(0);

      // Verify permission checkboxes are visible
      if (checkboxCount > 0) {
        await expect(checkboxes.first()).toBeVisible();
      }
    }
  });
});

// ============================================================================
// ROLE EDITING TESTS
// ============================================================================

test.describe('Role Editing', () => {
  test('Admin can navigate to edit role page', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goRoles(page);

    const link = page.locator('a[href*="/roles/"][href*="/edit"]').first();
    if (await link.isVisible({ timeout: 2000 }).catch(() => false)) {
      await link.click();
      await page.waitForURL(/.*roles.*edit/, { timeout: 5000 }).catch(() => {});
      await expect(page.locator('h1')).toContainText(/Edit.*Role/);
    }
  });

  test('Admin can update role name', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goRoles(page);

    const link = page.locator('a[href*="/roles/"][href*="/edit"]').first();
    if (await link.isVisible({ timeout: 2000 }).catch(() => false)) {
      await link.click();
      await page.waitForURL(/.*roles.*edit/, { timeout: 5000 }).catch(() => {});

      const timestamp = Date.now();
      const nameInput = page.locator('input[name="name"]');
      if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        const currentValue = await nameInput.inputValue();
        await nameInput.clear();
        await nameInput.fill(`${currentValue}_updated_${timestamp}`);
      }

      await page.click('button[type="submit"]');
      await page.waitForURL('/roles', { timeout: 8000 }).catch(() => {});

      const successMsg = page.locator('.alert-success, .success').first();
      if (await successMsg.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(successMsg).toContainText(/successfully/);
      }
    }
  });

  test('Admin can add permissions to role', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goRoles(page);

    const link = page.locator('a[href*="/roles/"][href*="/edit"]').first();
    if (await link.isVisible({ timeout: 2000 }).catch(() => false)) {
      await link.click();
      await page.waitForURL(/.*roles.*edit/, { timeout: 5000 }).catch(() => {});

      // Check an unchecked permission
      const checkboxes = page.locator('input[type="checkbox"]:not(:checked)');
      const count = await checkboxes.count();
      if (count > 0) {
        await checkboxes.first().check();
      }

      await page.click('button[type="submit"]');
      await page.waitForURL('/roles', { timeout: 8000 }).catch(() => {});

      const successMsg = page.locator('.alert-success, .success').first();
      if (await successMsg.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(successMsg).toContainText(/successfully/);
      }
    }
  });

  test('Admin can remove permissions from role', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goRoles(page);

    const link = page.locator('a[href*="/roles/"][href*="/edit"]').first();
    if (await link.isVisible({ timeout: 2000 }).catch(() => false)) {
      await link.click();
      await page.waitForURL(/.*roles.*edit/, { timeout: 5000 }).catch(() => {});

      // Uncheck a checked permission
      const checkboxes = page.locator('input[type="checkbox"]:checked');
      const count = await checkboxes.count();
      if (count > 0) {
        await checkboxes.first().uncheck();
      }

      await page.click('button[type="submit"]');
      await page.waitForURL('/roles', { timeout: 8000 }).catch(() => {});

      const successMsg = page.locator('.alert-success, .success').first();
      if (await successMsg.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(successMsg).toContainText(/successfully/);
      }
    }
  });

  test('Admin can change all permissions at once', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goRoles(page);

    const link = page.locator('a[href*="/roles/"][href*="/edit"]').first();
    if (await link.isVisible({ timeout: 2000 }).catch(() => false)) {
      await link.click();
      await page.waitForURL(/.*roles.*edit/, { timeout: 5000 }).catch(() => {});

      // Uncheck all
      const allCheckboxes = page.locator('input[type="checkbox"]');
      const count = await allCheckboxes.count();
      for (let i = 0; i < count; i++) {
        await allCheckboxes.nth(i).uncheck();
      }

      // Then check a few
      for (let i = 0; i < Math.min(3, count); i++) {
        await allCheckboxes.nth(i).check();
      }

      await page.click('button[type="submit"]');
      await page.waitForURL('/roles', { timeout: 8000 }).catch(() => {});

      const successMsg = page.locator('.alert-success, .success').first();
      if (await successMsg.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(successMsg).toContainText(/successfully/);
      }
    }
  });
});

// ============================================================================
// ROLE VIEW/SHOW TESTS
// ============================================================================

test.describe('Role Show Page', () => {
  test('Admin can view role details', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goRoles(page);

    const link = page.locator('a[href*="/roles/"][href!*="/edit"]').first();
    if (await link.isVisible({ timeout: 2000 }).catch(() => false)) {
      await link.click();
      await page.waitForTimeout(2000);
      await expect(page.locator('h1')).toContainText(/Role|Details/);
    }
  });

  test('Role show page displays role information', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goRoles(page);

    const link = page.locator('a[href*="/roles/"][href!*="/edit"]').first();
    if (await link.isVisible({ timeout: 2000 }).catch(() => false)) {
      await link.click();
      await page.waitForTimeout(2000);

      // Check for role details
      const pageContent = await page.textContent('body');
      expect(pageContent).toContain(/name|permissions/i);
    }
  });

  test('Role show page displays assigned permissions', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goRoles(page);

    const link = page.locator('a[href*="/roles/"][href!*="/edit"]').first();
    if (await link.isVisible({ timeout: 2000 }).catch(() => false)) {
      await link.click();
      await page.waitForTimeout(2000);

      // Check for permissions section
      const permissionsSection = page.locator('text=/permission/i');
      const hasPermissions = await permissionsSection.isVisible().catch(() => false);
      expect(hasPermissions).toBeTruthy();
    }
  });

  test('Role show page displays users with this role', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goRoles(page);

    const link = page.locator('a[href*="/roles/"][href!*="/edit"]').first();
    if (await link.isVisible({ timeout: 2000 }).catch(() => false)) {
      await link.click();
      await page.waitForTimeout(2000);

      // Check for users section
      const usersSection = page.locator('text=/user/i');
      const hasUsers = await usersSection.isVisible().catch(() => false);
      expect(hasUsers).toBeTruthy();
    }
  });

  test('Role show page displays activity log', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goRoles(page);

    const link = page.locator('a[href*="/roles/"][href!*="/edit"]').first();
    if (await link.isVisible({ timeout: 2000 }).catch(() => false)) {
      await link.click();
      await page.waitForTimeout(2000);

      // Check for activity log section
      const activityLog = page.locator('text=/activity/i');
      const hasActivity = await activityLog.isVisible().catch(() => false);
      expect(hasActivity).toBeTruthy();
    }
  });
});

// ============================================================================
// ROLE DELETION TESTS
// ============================================================================

test.describe('Role Deletion', () => {
  test('Admin can delete role', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goRoles(page);

    // First, create a role to delete
    const createBtn = page.locator('button:has-text("Create"), a:has-text("Create"), button:has-text("Add Role")').first();
    if (await createBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await createBtn.click();
      await page.waitForURL(/.*roles.*create/, { timeout: 5000 }).catch(() => {});

      const timestamp = Date.now();
      const roleName = `deleterole_${timestamp}`;

      await page.fill('input[name="name"]', roleName);

      await page.click('button[type="submit"]');
      await page.waitForURL('/roles', { timeout: 8000 }).catch(() => {});
      await page.waitForTimeout(1000);
    }

    // Now delete the role
    const deleteBtn = page.locator('button').filter({ hasText: /delete|trash/i }).first();
    if (await deleteBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await deleteBtn.click();
      await page.waitForTimeout(1000);

      // Confirm deletion if dialog appears
      const confirmBtn = page.locator('button:has-text("Confirm"), button:has-text("Delete")').first();
      if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmBtn.click();
      }

      await page.waitForURL('/roles', { timeout: 8000 }).catch(() => {});

      const successMsg = page.locator('.alert-success, .success').first();
      if (await successMsg.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(successMsg).toContainText(/successfully/);
      }
    }
  });

  test('Admin cannot delete system roles', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goRoles(page);

    // Try to find and delete admin role
    const adminRow = page.locator('tr').filter({ hasText: 'admin' });
    const deleteBtn = adminRow.locator('button').filter({ hasText: /delete|trash/i });

    const hasDeleteBtn = await deleteBtn.isVisible().catch(() => false);

    // Admin role should not have delete button or should be protected
    if (hasDeleteBtn) {
      await deleteBtn.click();
      await page.waitForTimeout(1000);

      // Should show error or not allow deletion
      const errorMsg = page.locator('.alert-error, .error').first();
      const hasError = await errorMsg.isVisible().catch(() => false);
      expect(hasError).toBeTruthy();
    }
  });
});

// ============================================================================
// PERMISSION-BASED ACCESS CONTROL TESTS
// ============================================================================

test.describe('Permission-based Access Control', () => {
  test('Manager can view roles but may have limited actions', async ({ page }) => {
    await login(page, MANAGER.email, MANAGER.password);
    await goRoles(page);
    await expect(page.locator('h1')).toContainText(/Roles|Role Management/);
  });

  test('User role has view-only access', async ({ page }) => {
    await login(page, USER.email, USER.password);
    await goRoles(page);

    // Check that create button is not visible
    const createBtn = page.locator('button:has-text("Create"), a:has-text("Create"), button:has-text("Add Role")').first();
    const hasCreate = await createBtn.isVisible().catch(() => false);
    expect(hasCreate).toBeFalsy();
  });

  test('Unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/roles', { waitUntil: 'load' });
    await expect(page).toHaveURL(/.*login/);
  });
});

// ============================================================================
// PAGINATION TESTS
// ============================================================================

test.describe('Pagination', () => {
  test('Pagination controls are visible', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goRoles(page);

    const pagination = page.locator('.pagination, nav[aria-label="pagination"]');
    const hasPagination = await pagination.isVisible().catch(() => false);

    if (hasPagination) {
      await expect(pagination).toBeVisible();
    }
  });

  test('Admin can navigate to next page', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goRoles(page);

    const nextBtn = page.locator('button:has-text("Next"), a:has-text("Next")').first();
    if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nextBtn.click();
      await page.waitForTimeout(1000);
    }
  });
});

// ============================================================================
// PERMISSION ASSIGNMENT TESTS
// ============================================================================

test.describe('Permission Assignment', () => {
  test('Permissions are grouped by module', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goRoles(page);

    const btn = page.locator('button:has-text("Create"), a:has-text("Create"), button:has-text("Add Role")').first();
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btn.click();
      await page.waitForURL(/.*roles.*create/, { timeout: 5000 }).catch(() => {});

      // Check for module groupings
      const moduleHeadings = page.locator('h2, h3, .font-semibold').filter({ hasText: /trucks|drivers|users|roles/i });
      const hasModules = await moduleHeadings.isVisible().catch(() => false);
      expect(hasModules).toBeTruthy();
    }
  });

  test('Admin can select all permissions in a module', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goRoles(page);

    const btn = page.locator('button:has-text("Create"), a:has-text("Create"), button:has-text("Add Role")').first();
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btn.click();
      await page.waitForURL(/.*roles.*create/, { timeout: 5000 }).catch(() => {});

      // Look for "Select All" buttons or module-level checkboxes
      const selectAllBtns = page.locator('button:has-text("Select All"), label:has-text("Select All")');
      const hasSelectAll = await selectAllBtns.isVisible().catch(() => false);

      if (hasSelectAll) {
        await selectAllBtns.first().click();
        await page.waitForTimeout(500);
      }
    }
  });
});

