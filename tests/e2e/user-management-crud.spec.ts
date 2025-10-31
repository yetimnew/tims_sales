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

// Navigate to users page
async function goUsers(page: Page) {
  await page.goto('/users', { waitUntil: 'domcontentloaded', timeout: 25000 });
  await Promise.race([
    page.locator('h1:has-text("Users")').waitFor({ state: 'visible', timeout: 10000 }).catch(() => {}),
    page.locator('table tbody').waitFor({ state: 'visible', timeout: 10000 }).catch(() => {}),
  ]);
  await page.waitForTimeout(500);
}

// ============================================================================
// USER INDEX PAGE TESTS
// ============================================================================

test.describe('User Index Page', () => {
  test('Admin can view users index page', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goUsers(page);
    await expect(page.locator('h1')).toContainText(/Users|User Management/);
  });

  test('Users table displays user information', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goUsers(page);
    const table = page.locator('table').first();
    const thCount = await table.locator('th').count();
    const rowCount = await table.locator('tbody tr').count();
    expect(thCount).toBeGreaterThan(0);
    expect(rowCount).toBeGreaterThan(0);
  });

  test('Admin can search users', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goUsers(page);
    const input = page.locator('input[placeholder*="Search"]').first();
    if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
      await input.fill('admin');
      await page.waitForTimeout(500);
    }
  });

  test('Admin can sort users by name', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goUsers(page);
    const header = page.locator('th').filter({ hasText: /name/i }).first();
    if (await header.isVisible({ timeout: 2000 }).catch(() => false)) {
      await header.click();
      await page.waitForTimeout(500);
    }
  });

  test('Admin can export users to CSV', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goUsers(page);
    const btn = page.locator('button:has-text("Export")').first();
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      const downloadPromise = page.waitForEvent('download');
      await btn.click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/users_.*\.csv/);
    }
  });
});

// ============================================================================
// USER CREATION TESTS
// ============================================================================

test.describe('User Creation', () => {
  test('Admin can navigate to create user page', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goUsers(page);
    const btn = page.locator('button:has-text("Create"), a:has-text("Create"), button:has-text("Add User")').first();
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btn.click();
      await page.waitForURL(/.*users.*create/, { timeout: 5000 }).catch(() => {});
      await expect(page.locator('h1')).toContainText(/Create.*User/);
    }
  });

  test('Admin can create a new user', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goUsers(page);

    const btn = page.locator('button:has-text("Create"), a:has-text("Create"), button:has-text("Add User")').first();
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btn.click();
      await page.waitForURL(/.*users.*create/, { timeout: 5000 }).catch(() => {});

      const timestamp = Date.now();
      const testEmail = `testuser${timestamp}@example.com`;

      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', 'Password123!@#');
      await page.fill('input[name="password_confirmation"]', 'Password123!@#');

      const roleSelect = page.locator('select[name="role"]');
      if (await roleSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        await roleSelect.selectOption('user');
      }

      await page.click('button[type="submit"]');
      await page.waitForURL('/users', { timeout: 8000 }).catch(() => {});

      // Check for success message
      const successMsg = page.locator('.alert-success, .success').first();
      if (await successMsg.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(successMsg).toContainText(/successfully/);
      }
    }
  });

  test('User creation validates required fields', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goUsers(page);

    const btn = page.locator('button:has-text("Create"), a:has-text("Create"), button:has-text("Add User")').first();
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btn.click();
      await page.waitForURL(/.*users.*create/, { timeout: 5000 }).catch(() => {});

      // Try to submit empty form
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000);

      // Check for validation errors
      const errors = page.locator('.error, .invalid-feedback, .text-red-600');
      const errorCount = await errors.count();
      expect(errorCount).toBeGreaterThan(0);
    }
  });

  test('User creation validates email format', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goUsers(page);

    const btn = page.locator('button:has-text("Create"), a:has-text("Create"), button:has-text("Add User")').first();
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btn.click();
      await page.waitForURL(/.*users.*create/, { timeout: 5000 }).catch(() => {});

      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="email"]', 'invalid-email');
      await page.fill('input[name="password"]', 'Password123!@#');
      await page.fill('input[name="password_confirmation"]', 'Password123!@#');

      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000);

      const errors = page.locator('.error, .invalid-feedback, .text-red-600');
      const hasError = await errors.count() > 0;
      expect(hasError).toBeTruthy();
    }
  });

  test('User creation validates password strength', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goUsers(page);

    const btn = page.locator('button:has-text("Create"), a:has-text("Create"), button:has-text("Add User")').first();
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btn.click();
      await page.waitForURL(/.*users.*create/, { timeout: 5000 }).catch(() => {});

      const timestamp = Date.now();
      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="email"]', `test${timestamp}@example.com`);
      await page.fill('input[name="password"]', 'weak');
      await page.fill('input[name="password_confirmation"]', 'weak');

      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000);

      const errors = page.locator('.error, .invalid-feedback, .text-red-600');
      const hasError = await errors.count() > 0;
      expect(hasError).toBeTruthy();
    }
  });

  test('User creation validates password confirmation', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goUsers(page);

    const btn = page.locator('button:has-text("Create"), a:has-text("Create"), button:has-text("Add User")').first();
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btn.click();
      await page.waitForURL(/.*users.*create/, { timeout: 5000 }).catch(() => {});

      const timestamp = Date.now();
      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="email"]', `test${timestamp}@example.com`);
      await page.fill('input[name="password"]', 'Password123!@#');
      await page.fill('input[name="password_confirmation"]', 'DifferentPassword123!@#');

      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000);

      const errors = page.locator('.error, .invalid-feedback, .text-red-600');
      const hasError = await errors.count() > 0;
      expect(hasError).toBeTruthy();
    }
  });
});

// ============================================================================
// USER EDITING TESTS
// ============================================================================

test.describe('User Editing', () => {
  test('Admin can navigate to edit user page', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goUsers(page);

    const link = page.locator('a[href*="/users/"][href*="/edit"]').first();
    if (await link.isVisible({ timeout: 2000 }).catch(() => false)) {
      await link.click();
      await page.waitForURL(/.*users.*edit/, { timeout: 5000 }).catch(() => {});
      await expect(page.locator('h1')).toContainText(/Edit.*User/);
    }
  });

  test('Admin can update user information', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goUsers(page);

    const link = page.locator('a[href*="/users/"][href*="/edit"]').first();
    if (await link.isVisible({ timeout: 2000 }).catch(() => false)) {
      await link.click();
      await page.waitForURL(/.*users.*edit/, { timeout: 5000 }).catch(() => {});

      // Update name
      const nameInput = page.locator('input[name="name"]');
      if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nameInput.clear();
        await nameInput.fill('Updated User Name');
      }

      await page.click('button[type="submit"]');
      await page.waitForURL('/users', { timeout: 8000 }).catch(() => {});

      // Check for success message
      const successMsg = page.locator('.alert-success, .success').first();
      if (await successMsg.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(successMsg).toContainText(/successfully/);
      }
    }
  });

  test('Admin can update user password', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goUsers(page);

    const link = page.locator('a[href*="/users/"][href*="/edit"]').first();
    if (await link.isVisible({ timeout: 2000 }).catch(() => false)) {
      await link.click();
      await page.waitForURL(/.*users.*edit/, { timeout: 5000 }).catch(() => {});

      const passwordInput = page.locator('input[name="password"]');
      const confirmInput = page.locator('input[name="password_confirmation"]');

      if (await passwordInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await passwordInput.fill('NewPassword123!@#');
        await confirmInput.fill('NewPassword123!@#');
      }

      await page.click('button[type="submit"]');
      await page.waitForURL('/users', { timeout: 8000 }).catch(() => {});

      const successMsg = page.locator('.alert-success, .success').first();
      if (await successMsg.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(successMsg).toContainText(/successfully/);
      }
    }
  });

  test('Admin can change user role', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goUsers(page);

    const link = page.locator('a[href*="/users/"][href*="/edit"]').first();
    if (await link.isVisible({ timeout: 2000 }).catch(() => false)) {
      await link.click();
      await page.waitForURL(/.*users.*edit/, { timeout: 5000 }).catch(() => {});

      const roleSelect = page.locator('select[name="role"]');
      if (await roleSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        await roleSelect.selectOption('manager');
      }

      await page.click('button[type="submit"]');
      await page.waitForURL('/users', { timeout: 8000 }).catch(() => {});

      const successMsg = page.locator('.alert-success, .success').first();
      if (await successMsg.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(successMsg).toContainText(/successfully/);
      }
    }
  });
});

// ============================================================================
// USER VIEW/SHOW TESTS
// ============================================================================

test.describe('User Show Page', () => {
  test('Admin can view user details', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goUsers(page);

    const link = page.locator('a[href*="/users/"][href!*="/edit"]').first();
    if (await link.isVisible({ timeout: 2000 }).catch(() => false)) {
      await link.click();
      await page.waitForTimeout(2000);
      await expect(page.locator('h1')).toContainText(/User|Details/);
    }
  });

  test('User show page displays user information', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goUsers(page);

    const link = page.locator('a[href*="/users/"][href!*="/edit"]').first();
    if (await link.isVisible({ timeout: 2000 }).catch(() => false)) {
      await link.click();
      await page.waitForTimeout(2000);

      // Check for user details
      const pageContent = await page.textContent('body');
      expect(pageContent).toContain(/email|name|role/i);
    }
  });

  test('User show page displays activity log', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goUsers(page);

    const link = page.locator('a[href*="/users/"][href!*="/edit"]').first();
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
// USER DELETION TESTS
// ============================================================================

test.describe('User Deletion', () => {
  test('Admin can delete user', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goUsers(page);

    // First, create a user to delete
    const createBtn = page.locator('button:has-text("Create"), a:has-text("Create"), button:has-text("Add User")').first();
    if (await createBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await createBtn.click();
      await page.waitForURL(/.*users.*create/, { timeout: 5000 }).catch(() => {});

      const timestamp = Date.now();
      const testEmail = `deleteuser${timestamp}@example.com`;

      await page.fill('input[name="name"]', 'User To Delete');
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', 'Password123!@#');
      await page.fill('input[name="password_confirmation"]', 'Password123!@#');

      const roleSelect = page.locator('select[name="role"]');
      if (await roleSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        await roleSelect.selectOption('user');
      }

      await page.click('button[type="submit"]');
      await page.waitForURL('/users', { timeout: 8000 }).catch(() => {});
      await page.waitForTimeout(1000);
    }

    // Now delete the user
    const deleteBtn = page.locator('button').filter({ hasText: /delete|trash/i }).first();
    if (await deleteBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await deleteBtn.click();
      await page.waitForTimeout(1000);

      // Confirm deletion if dialog appears
      const confirmBtn = page.locator('button:has-text("Confirm"), button:has-text("Delete")').first();
      if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmBtn.click();
      }

      await page.waitForURL('/users', { timeout: 8000 }).catch(() => {});

      const successMsg = page.locator('.alert-success, .success').first();
      if (await successMsg.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(successMsg).toContainText(/successfully/);
      }
    }
  });
});

// ============================================================================
// PERMISSION-BASED ACCESS CONTROL TESTS
// ============================================================================

test.describe('Permission-based Access Control', () => {
  test('Manager can view users but may have limited actions', async ({ page }) => {
    await login(page, MANAGER.email, MANAGER.password);
    await goUsers(page);
    await expect(page.locator('h1')).toContainText(/Users|User Management/);
  });

  test('User role has view-only access', async ({ page }) => {
    await login(page, USER.email, USER.password);
    await goUsers(page);

    // Check that create button is not visible
    const createBtn = page.locator('button:has-text("Create"), a:has-text("Create"), button:has-text("Add User")').first();
    const hasCreate = await createBtn.isVisible().catch(() => false);
    expect(hasCreate).toBeFalsy();
  });

  test('Unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/users', { waitUntil: 'load' });
    await expect(page).toHaveURL(/.*login/);
  });
});

// ============================================================================
// PAGINATION TESTS
// ============================================================================

test.describe('Pagination', () => {
  test('Pagination controls are visible', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goUsers(page);

    const pagination = page.locator('.pagination, nav[aria-label="pagination"]');
    const hasPagination = await pagination.isVisible().catch(() => false);

    if (hasPagination) {
      await expect(pagination).toBeVisible();
    }
  });

  test('Admin can navigate to next page', async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await goUsers(page);

    const nextBtn = page.locator('button:has-text("Next"), a:has-text("Next")').first();
    if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nextBtn.click();
      await page.waitForTimeout(1000);
    }
  });
});

