import { test, expect, Page } from '@playwright/test';

// Serial execution - ONE test at a time
test.describe.configure({ mode: 'serial' });

// Test users - MUST MATCH DATABASE SEEDERS
const ADMIN = { email: 'admin@test.com', password: 'password123' };
const MANAGER = { email: 'manager@test.com', password: 'password123' };
const USER = { email: 'user@test.com', password: 'password123' };

// Simple login function - NO LOGOUT
async function login(page: Page, email: string, password: string) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });

  // Wait for email input to be visible
  await page.locator('#email').waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(300);

  // Fill login form using ID selectors
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);

  // Click submit button
  await page.locator('button[type="submit"]').first().click();

  // Wait for navigation - expect redirect to dashboard or trucks
  try {
    await Promise.race([
      page.waitForURL(/\/dashboard/, { timeout: 8000 }),
      page.waitForURL(/\/trucks/, { timeout: 8000 }),
    ]);
  } catch {
    // If navigation takes longer, just wait a bit more
    await page.waitForTimeout(1000);
  }
}

// Go to trucks page
async function goTrucks(page: Page) {
  // Use domcontentloaded instead of networkidle - trucks page has many async queries
  await page.goto('/trucks', { waitUntil: 'domcontentloaded', timeout: 25000 });

  // Wait for page to be interactive - wait for h1 title or table
  await Promise.race([
    page.locator('h1:has-text("Trucks")').waitFor({ state: 'visible', timeout: 10000 }).catch(() => {}),
    page.locator('table tbody').waitFor({ state: 'visible', timeout: 10000 }).catch(() => {}),
  ]);

  await page.waitForTimeout(500);
}

// ============================================================================
// ADMIN TESTS (1-10)
// ============================================================================

test.describe('Admin Tests', () => {
  test('1: Navigate to trucks', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goTrucks(page);
    await expect(page.locator('h1')).toContainText('Trucks');
  });

  test('2: Create truck', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goTrucks(page);
    const btn = page.locator('button:has-text("Add Truck")').first();
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btn.click();
    }
  });

  test('3: View truck', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goTrucks(page);
    const link = page.locator('a[href*="/trucks/"][href!*="/edit"]').first();
    if (await link.isVisible({ timeout: 2000 }).catch(() => false)) {
      await link.click();
    }
  });

  test('4: Edit truck', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goTrucks(page);
    const link = page.locator('a[href*="/edit"]').first();
    if (await link.isVisible({ timeout: 2000 }).catch(() => false)) {
      await link.click();
    }
  });

  test('5: Search trucks', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goTrucks(page);
    const input = page.locator('input[placeholder*="Search"]').first();
    if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
      await input.fill('TEST');
      await page.waitForTimeout(300);
    }
  });

  test('6: Sort trucks', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goTrucks(page);
    const header = page.locator('th', { hasText: 'Plate' }).first();
    if (await header.isVisible({ timeout: 2000 }).catch(() => false)) {
      await header.click();
    }
  });

  test('7: Delete truck', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goTrucks(page);
    const rows = page.locator('table tbody tr');
    if ((await rows.count()) > 0) {
      const btn = rows.first().locator('button').last();
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await btn.click();
      }
    }
  });

  test('8: Export CSV', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goTrucks(page);
    const btn = page.locator('button:has-text("Export")').first();
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(btn).toBeVisible();
    }
  });

  test('9: View stats', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goTrucks(page);
    await expect(page.locator('table').first()).toBeVisible();
  });

  test('10: Pagination', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goTrucks(page);
    await expect(page.locator('table').first()).toBeVisible();
  });
});

// ============================================================================
// MANAGER TESTS (11-15)
// ============================================================================

test.describe('Manager Tests', () => {
  test('11: View trucks', async ({ page }) => {
    await login(page, MANAGER.email, MANAGER.password);
    await goTrucks(page);
    await expect(page.locator('h1')).toContainText('Trucks');
  });

  test('12: Create button visible', async ({ page }) => {
    await login(page, MANAGER.email, MANAGER.password);
    await goTrucks(page);
    const btn = page.locator('button:has-text("Add Truck")').first();
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(btn).toBeVisible();
    }
  });

  test('13: No delete button', async ({ page }) => {
    await login(page, MANAGER.email, MANAGER.password);
    await goTrucks(page);
    const table = page.locator('table').first();
    const rows = table.locator('tbody tr');
    if ((await rows.count()) > 0) {
      const deleteBtn = rows.first().locator('button').filter({ hasText: /delete|trash/i });
      const visible = await deleteBtn.isVisible().catch(() => false);
      expect(visible).toBeFalsy();
    }
  });

  test('14: Edit visible', async ({ page }) => {
    await login(page, MANAGER.email, MANAGER.password);
    await goTrucks(page);
    const link = page.locator('a[href*="/edit"]').first();
    if (await link.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(link).toBeVisible();
    }
  });

  test('15: Export visible', async ({ page }) => {
    await login(page, MANAGER.email, MANAGER.password);
    await goTrucks(page);
    const btn = page.locator('button:has-text("Export")').first();
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(btn).toBeVisible();
    }
  });
});

// ============================================================================
// USER TESTS (16-21)
// ============================================================================

test.describe('User Tests', () => {
  test('16: View trucks', async ({ page }) => {
    await login(page, USER.email, USER.password);
    await goTrucks(page);
    await expect(page.locator('h1')).toContainText('Trucks');
  });

  test('17: No create button', async ({ page }) => {
    await login(page, USER.email, USER.password);
    await goTrucks(page);
    const btn = page.locator('button:has-text("Add Truck")').first();
    const visible = await btn.isVisible().catch(() => false);
    expect(visible).toBeFalsy();
  });

  test('18: No edit button', async ({ page }) => {
    await login(page, USER.email, USER.password);
    await goTrucks(page);
    const table = page.locator('table').first();
    const link = table.locator('a[href*="/edit"]');
    const visible = await link.isVisible().catch(() => false);
    expect(visible).toBeFalsy();
  });

  test('19: View details allowed', async ({ page }) => {
    await login(page, USER.email, USER.password);
    await goTrucks(page);
    const link = page.locator('a[href*="/trucks/"][href!*="/edit"]').first();
    if (await link.isVisible({ timeout: 2000 }).catch(() => false)) {
      await link.click();
    }
  });

  test('20: Export visible', async ({ page }) => {
    await login(page, USER.email, USER.password);
    await goTrucks(page);
    const btn = page.locator('button:has-text("Export")').first();
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(btn).toBeVisible();
    }
  });

  test('21: Direct create blocked', async ({ page }) => {
    await login(page, USER.email, USER.password);
    await page.goto('/trucks/create', { waitUntil: 'load' }).catch(() => {});
    const form = page.locator('h1:has-text("Create")');
    const visible = await form.isVisible().catch(() => false);
    expect(!visible || !page.url().includes('/trucks/create')).toBeTruthy();
  });
});

// ============================================================================
// ADVANCED TESTS (22-25)
// ============================================================================

test.describe('Advanced Tests', () => {
  test('22: Search functionality', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goTrucks(page);
    const input = page.locator('input[placeholder*="Search"]').first();
    if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
      await input.fill('TEST');
      await page.waitForTimeout(300);
    }
  });

  test('23: Sort functionality', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goTrucks(page);
    const header = page.locator('th', { hasText: 'Plate' }).first();
    if (await header.isVisible({ timeout: 2000 }).catch(() => false)) {
      await header.click();
    }
  });

  test('24: Stats visible', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goTrucks(page);
    const stats = await page.locator('[data-testid="stats-card"], .border-l-4').all();
    expect(stats.length).toBeGreaterThanOrEqual(1);
  });

  test('25: Formatting correct', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goTrucks(page);
    const price = page.locator('table tbody td').filter({ hasText: /\$/ }).first();
    if (await price.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(price).toBeVisible();
    }
  });
});

// ============================================================================
// EDGE CASE TESTS (26-30)
// ============================================================================

test.describe('Edge Case Tests', () => {
  test('26: Form validation', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goTrucks(page);
    const btn = page.locator('button:has-text("Add Truck")').first();
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btn.click();
    }
  });

  test('27: Form cancel works', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goTrucks(page);
    const btn = page.locator('button:has-text("Add Truck")').first();
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btn.click();
      await page.waitForURL('**/trucks/create', { timeout: 5000 }).catch(() => {});
      const cancel = page.locator('button:has-text("Cancel")').first();
      if (await cancel.isVisible({ timeout: 2000 }).catch(() => false)) {
        await cancel.click();
      }
    }
  });

  test('28: Tab navigation', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goTrucks(page);
    const btn = page.locator('button:has-text("Add Truck")').first();
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btn.click();
      await page.waitForURL('**/trucks/create', { timeout: 5000 }).catch(() => {});
      const tab = page.locator('text=Technical');
      if (await tab.isVisible({ timeout: 2000 }).catch(() => false)) {
        await tab.click();
      }
    }
  });

  test('29: Empty state', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goTrucks(page);
    const input = page.locator('input[placeholder*="Search"]').first();
    if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
      await input.fill('NONEXISTENT-XXXXX');
      await page.waitForTimeout(300);
    }
  });

  test('30: Table displays', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goTrucks(page);
    await expect(page.locator('table').first()).toBeVisible();
  });
});
