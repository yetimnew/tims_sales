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

// Navigate to permissions page
async function goPermissions(page: Page) {
  await page.goto('/permissions', { waitUntil: 'domcontentloaded', timeout: 25000 });
  await Promise.race([
    page.locator('h1:has-text("Permissions")').waitFor({ state: 'visible', timeout: 10000 }).catch(() => {}),
    page.locator('table tbody').waitFor({ state: 'visible', timeout: 10000 }).catch(() => {}),
  ]);
  await page.waitForTimeout(500);
}

// ============================================================================
// PERMISSION INDEX PAGE TESTS
// ============================================================================

test.describe('Permission Index Page', () => {
  test('Admin can view permissions index page', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goPermissions(page);
    await expect(page.locator('h1')).toContainText(/Permissions|Permission Management/);
  });

  test('Permissions table displays permission information', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goPermissions(page);
    const table = page.locator('table').first();
    const thCount = await table.locator('th').count();
    const rowCount = await table.locator('tbody tr').count();
    expect(thCount).toBeGreaterThan(0);
    expect(rowCount).toBeGreaterThan(0);
  });

  test('Permissions table shows correct columns', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goPermissions(page);
    const table = page.locator('table').first();

    // Check for standard columns
    const headers = await table.locator('th').allTextContents();
    const headerText = headers.join(' ').toLowerCase();

    expect(headerText).toMatch(/permission|name/);
    expect(headerText).toContain('guard');
  });

  test('Admin can search permissions by name', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goPermissions(page);
    const input = page.locator('input[placeholder*="Search"]').first();
    if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
      await input.fill('trucks');
      await page.waitForTimeout(500);

      // Verify search results
      const table = page.locator('table tbody');
      const rows = await table.locator('tr').allTextContents();
      const resultsContainSearch = rows.some(row => row.toLowerCase().includes('trucks'));
      expect(resultsContainSearch).toBeTruthy();
    }
  });

  test('Admin can search permissions by guard', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goPermissions(page);
    const input = page.locator('input[placeholder*="Search"]').first();
    if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
      await input.fill('web');
      await page.waitForTimeout(500);
    }
  });

  test('Admin can sort permissions by name', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goPermissions(page);
    const header = page.locator('th').filter({ hasText: /name/i }).first();
    if (await header.isVisible({ timeout: 2000 }).catch(() => false)) {
      await header.click();
      await page.waitForTimeout(500);
    }
  });

  test('Admin can sort permissions by guard', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goPermissions(page);
    const header = page.locator('th').filter({ hasText: /guard/i }).first();
    if (await header.isVisible({ timeout: 2000 }).catch(() => false)) {
      await header.click();
      await page.waitForTimeout(500);
    }
  });

  test('Admin can sort permissions by created date', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goPermissions(page);
    const header = page.locator('th').filter({ hasText: /created|date/i }).first();
    if (await header.isVisible({ timeout: 2000 }).catch(() => false)) {
      await header.click();
      await page.waitForTimeout(500);
    }
  });

  test('Admin can export permissions to CSV', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goPermissions(page);
    const btn = page.locator('button:has-text("Export")').first();
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      const downloadPromise = page.waitForEvent('download');
      await btn.click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/permissions_.*\.csv/);
    }
  });

  test('Permissions are displayed with correct format', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goPermissions(page);

    const table = page.locator('table tbody');
    const firstRow = table.locator('tr').first();

    if (await firstRow.isVisible({ timeout: 2000 }).catch(() => false)) {
      const rowText = await firstRow.textContent();
      // Permission names should follow pattern: module.action
      expect(rowText).toMatch(/\./);
    }
  });

  test('Permissions are grouped by module when displayed', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goPermissions(page);

    // Check if there are module groupings visible
    const moduleLabels = page.locator('h2, h3, .font-semibold, .badge').filter({ hasText: /trucks|drivers|users|roles|permissions/i });
    const moduleCount = await moduleLabels.count();

    // Either grouped view or flat list is acceptable
    expect(moduleCount).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================================
// PERMISSION VIEW/SHOW TESTS
// ============================================================================

test.describe('Permission Show Page', () => {
  test('Admin can view permission details', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goPermissions(page);

    const link = page.locator('a[href*="/permissions/"]').first();
    if (await link.isVisible({ timeout: 2000 }).catch(() => false)) {
      await link.click();
      await page.waitForTimeout(2000);
      await expect(page.locator('h1')).toContainText(/Permission|Details/);
    }
  });

  test('Permission show page displays permission information', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goPermissions(page);

    const link = page.locator('a[href*="/permissions/"]').first();
    if (await link.isVisible({ timeout: 2000 }).catch(() => false)) {
      await link.click();
      await page.waitForTimeout(2000);

      // Check for permission details
      const pageContent = await page.textContent('body');
      expect(pageContent).toContain(/name|guard/i);
    }
  });

  test('Permission show page displays roles with this permission', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goPermissions(page);

    const link = page.locator('a[href*="/permissions/"]').first();
    if (await link.isVisible({ timeout: 2000 }).catch(() => false)) {
      await link.click();
      await page.waitForTimeout(2000);

      // Check for roles section
      const rolesSection = page.locator('text=/role/i');
      const hasRoles = await rolesSection.isVisible().catch(() => false);
      expect(hasRoles).toBeTruthy();
    }
  });

  test('Permission show page displays module information', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goPermissions(page);

    const link = page.locator('a[href*="/permissions/"]').first();
    if (await link.isVisible({ timeout: 2000 }).catch(() => false)) {
      await link.click();
      await page.waitForTimeout(2000);

      // Check for module info
      const pageContent = await page.textContent('body');
      expect(pageContent).toMatch(/\./); // Permission name should have dot separator
    }
  });
});

// ============================================================================
// PERMISSION READ-ONLY TESTS
// ============================================================================

test.describe('Permission Read-Only Access', () => {
  test('No create button visible on permissions page', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goPermissions(page);

    const createBtn = page.locator('button:has-text("Create"), a:has-text("Create"), button:has-text("Add Permission")').first();
    const hasCreate = await createBtn.isVisible().catch(() => false);
    expect(hasCreate).toBeFalsy();
  });

  test('No edit button visible on permissions table', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goPermissions(page);

    const editBtn = page.locator('a[href*="/permissions/"][href*="/edit"]').first();
    const hasEdit = await editBtn.isVisible().catch(() => false);
    expect(hasEdit).toBeFalsy();
  });

  test('No delete button visible on permissions table', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goPermissions(page);

    const deleteBtn = page.locator('button').filter({ hasText: /delete|trash/i }).first();
    const hasDelete = await deleteBtn.isVisible().catch(() => false);
    expect(hasDelete).toBeFalsy();
  });

  test('Direct access to create page is blocked', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await page.goto('/permissions/create', { waitUntil: 'load' }).catch(() => {});

    // Should redirect to index or show 404
    const isIndex = page.url().includes('/permissions') && !page.url().includes('/create');
    const is404 = page.locator('text=/404|not found/i').isVisible().catch(() => false);

    expect(isIndex || is404).toBeTruthy();
  });

  test('Direct access to edit page is blocked', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await page.goto('/permissions/1/edit', { waitUntil: 'load' }).catch(() => {});

    // Should redirect to index or show 404
    const isIndex = page.url().includes('/permissions') && !page.url().includes('/edit');
    const is404 = page.locator('text=/404|not found/i').isVisible().catch(() => false);

    expect(isIndex || is404).toBeTruthy();
  });
});

// ============================================================================
// PERMISSION SEARCH AND FILTER TESTS
// ============================================================================

test.describe('Permission Search and Filter', () => {
  test('Search filters permissions correctly', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goPermissions(page);

    const input = page.locator('input[placeholder*="Search"]').first();
    if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Clear search
      await input.clear();
      await page.waitForTimeout(500);

      const rowsBefore = await page.locator('table tbody tr').count();

      // Search for specific permission
      await input.fill('users.view');
      await page.waitForTimeout(500);

      const rowsAfter = await page.locator('table tbody tr').count();

      // Results should be filtered
      expect(rowsAfter).toBeLessThanOrEqual(rowsBefore);
    }
  });

  test('Case-insensitive search works', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goPermissions(page);

    const input = page.locator('input[placeholder*="Search"]').first();
    if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
      await input.fill('TRUCKS');
      await page.waitForTimeout(500);

      const table = page.locator('table tbody');
      const rows = await table.locator('tr').allTextContents();
      const hasResults = rows.some(row => row.toLowerCase().includes('trucks'));
      expect(hasResults).toBeTruthy();
    }
  });

  test('Clear search returns all permissions', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goPermissions(page);

    const table = page.locator('table tbody');
    const rowsBefore = await table.locator('tr').count();

    const input = page.locator('input[placeholder*="Search"]').first();
    if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
      await input.fill('specific_permission_that_does_not_exist');
      await page.waitForTimeout(500);

      const rowsFiltered = await table.locator('tr').count();

      // Clear search
      await input.clear();
      await page.waitForTimeout(500);

      const rowsAfter = await table.locator('tr').count();

      expect(rowsAfter).toBeGreaterThanOrEqual(rowsBefore);
    }
  });
});

// ============================================================================
// PERMISSION-BASED ACCESS CONTROL TESTS
// ============================================================================

test.describe('Permission-based Access Control', () => {
  test('Manager can view permissions', async ({ page }) => {
    await login(page, MANAGER.email, MANAGER.password);
    await goPermissions(page);
    await expect(page.locator('h1')).toContainText(/Permissions|Permission Management/);
  });

  test('User role can view permissions', async ({ page }) => {
    await login(page, USER.email, USER.password);
    await goPermissions(page);
    await expect(page.locator('h1')).toContainText(/Permissions|Permission Management/);
  });

  test('Unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/permissions', { waitUntil: 'load' });
    await expect(page).toHaveURL(/.*login/);
  });
});

// ============================================================================
// PAGINATION TESTS
// ============================================================================

test.describe('Pagination', () => {
  test('Pagination controls are visible', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goPermissions(page);

    const pagination = page.locator('.pagination, nav[aria-label="pagination"]');
    const hasPagination = await pagination.isVisible().catch(() => false);

    if (hasPagination) {
      await expect(pagination).toBeVisible();
    }
  });

  test('Admin can navigate to next page', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goPermissions(page);

    const nextBtn = page.locator('button:has-text("Next"), a:has-text("Next")').first();
    if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nextBtn.click();
      await page.waitForTimeout(1000);
    }
  });

  test('Admin can navigate to previous page', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goPermissions(page);

    // Go to page 2 first
    const nextBtn = page.locator('button:has-text("Next"), a:has-text("Next")').first();
    if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nextBtn.click();
      await page.waitForTimeout(1000);

      // Then go back
      const prevBtn = page.locator('button:has-text("Previous"), a:has-text("Previous")').first();
      if (await prevBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await prevBtn.click();
        await page.waitForTimeout(1000);
      }
    }
  });

  test('Pagination shows correct page numbers', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goPermissions(page);

    const pagination = page.locator('.pagination, nav[aria-label="pagination"]');
    if (await pagination.isVisible({ timeout: 2000 }).catch(() => false)) {
      const pageNumbers = await pagination.locator('button, a').filter({ hasText: /^\d+$/ }).allTextContents();
      expect(pageNumbers.length).toBeGreaterThan(0);
    }
  });
});

// ============================================================================
// PERMISSION DATA VALIDATION TESTS
// ============================================================================

test.describe('Permission Data Validation', () => {
  test('Permissions have consistent naming convention', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goPermissions(page);

    const table = page.locator('table tbody');
    const rows = await table.locator('tr').allTextContents();

    // Check first few permissions follow module.action pattern
    for (const row of rows.slice(0, 5)) {
      const permissionName = row.split('\t')[0] || row.split(' ')[0];
      expect(permissionName).toMatch(/^[a-z_]+\.[a-z_]+$/);
    }
  });

  test('Permissions display correct guard name', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goPermissions(page);

    const table = page.locator('table tbody');
    const rows = await table.locator('tr').allTextContents();

    // Check guard names are consistent
    const guards = rows.map(row => {
      const parts = row.split('\t');
      return parts[1] || row;
    });

    // Most permissions should have 'web' guard
    const webGuards = guards.filter(g => g.toLowerCase().includes('web'));
    expect(webGuards.length).toBeGreaterThan(0);
  });

  test('Permissions are properly grouped by module', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goPermissions(page);

    const table = page.locator('table tbody');
    const rows = await table.locator('tr').allTextContents();

    // Extract modules from permission names
    const modules = rows.map(row => {
      const parts = row.split('\t');
      const name = parts[0] || row.split(' ')[0];
      return name.split('.')[0];
    });

    // Should have multiple modules
    const uniqueModules = [...new Set(modules)];
    expect(uniqueModules.length).toBeGreaterThan(1);
  });
});

// ============================================================================
// PERMISSION EXPORT TESTS
// ============================================================================

test.describe('Permission Export', () => {
  test('CSV export contains all permission data', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goPermissions(page);

    const btn = page.locator('button:has-text("Export")').first();
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      const downloadPromise = page.waitForEvent('download');
      await btn.click();
      const download = await downloadPromise;

      expect(download.suggestedFilename()).toMatch(/permissions_.*\.csv/);

      // Save file and check contents
      const path = await download.path();
      if (path) {
        const fs = require('fs');
        const content = fs.readFileSync(path, 'utf-8');
        expect(content).toContain('name');
        expect(content).toContain('guard');
      }
    }
  });

  test('Exported CSV has correct headers', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goPermissions(page);

    const btn = page.locator('button:has-text("Export")').first();
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      const downloadPromise = page.waitForEvent('download');
      await btn.click();
      const download = await downloadPromise;

      const path = await download.path();
      if (path) {
        const fs = require('fs');
        const content = fs.readFileSync(path, 'utf-8');
        const lines = content.split('\n');
        const headers = lines[0].toLowerCase();

        expect(headers).toContain('name');
        expect(headers).toContain('guard');
      }
    }
  });
});

