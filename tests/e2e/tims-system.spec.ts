import { test, expect } from '@playwright/test';
import { AuthHelper } from './helpers/auth-helper';

test.describe('TIMS System End-to-End Tests', () => {
  test.beforeEach(async ({ page }) => {
    const authHelper = new AuthHelper(page);
    await authHelper.loginAsAdmin();
  });

  test('dashboard displays key metrics', async ({ page }) => {
    await page.goto('/dashboard');

    // Check for dashboard elements
    await expect(page.locator('h1')).toContainText(/Dashboard|TIMS/);

    // Look for key metrics cards
    const metrics = page.locator('[data-slot="card"]');
    await expect(metrics.first()).toBeVisible();
  });

  test('user management page loads correctly', async ({ page }) => {
    await page.goto('/users');

    // Check if users page loads
    await expect(page.locator('h1')).toContainText(/Users|User Management/);

    // Check for user table or list
    await expect(page.locator('table, [data-testid="users-table"]')).toBeVisible();
  });

  test('truck management page loads correctly', async ({ page }) => {
    await page.goto('/trucks');

    // Check if trucks page loads
    await expect(page.locator('h1')).toContainText(/Trucks|Truck Management/);

    // Check for truck table or list
    await expect(page.locator('table, [data-testid="trucks-table"]')).toBeVisible();
  });

  test('driver management page loads correctly', async ({ page }) => {
    await page.goto('/drivers');

    // Check if drivers page loads
    await expect(page.locator('h1')).toContainText(/Drivers|Driver Management/);

    // Check for driver table or list
    await expect(page.locator('table, [data-testid="drivers-table"]')).toBeVisible();
  });

  test('performance tracking page loads correctly', async ({ page }) => {
    await page.goto('/performances');

    // Check if performances page loads
    await expect(page.locator('h1')).toContainText(/Performance|Performances/);

    // Check for performance table or list
    await expect(page.locator('table, [data-testid="performances-table"]')).toBeVisible();
  });

  test('user can create a new user', async ({ page }) => {
    await page.goto('/users');

    // Look for create user button
    const createButton = page
      .locator('a[href="/users/create"], button:has-text("Add User"), a:has-text("Add User"), [data-testid="create-user"]')
      .first();
    await expect(createButton).toBeVisible();

    // Click create button
    await Promise.all([
      page.waitForURL('**/users/create', { timeout: 15000 }),
      createButton.click()
    ]);

    // Check if we're on the create user page
    await expect(page).toHaveURL(/.*users.*create/, { timeout: 15000 });
    await expect(page.locator('h1')).toContainText(/Create.*User/);
  });

  test('user can create a new truck', async ({ page }) => {
    await page.goto('/trucks');

    // Look for create truck button
    const createButton = page
      .locator('a[href="/trucks/create"], button:has-text("Add Truck"), a:has-text("Add Truck"), [data-testid="create-truck"]')
      .first();
    await expect(createButton).toBeVisible();

    // Click create button and wait for navigation to complete
    await createButton.click();
    await page.waitForLoadState('networkidle');

    // Check if we're on the create truck page
    await expect(page).toHaveURL(/.*trucks.*create/, { timeout: 20000 });
    await expect(page.locator('[data-slot="card-title"]').first()).toContainText(/Create.*Truck/);
  });

  test('navigation menu works correctly', async ({ page }) => {
    // Check if navigation menu is present
    const navMenu = page.locator('nav, [data-testid="navigation"], .navigation').first();
    await expect(navMenu).toBeVisible();

    // Test navigation to different sections
    const menuItems = [
      { text: 'Dashboard', url: '/dashboard' },
      { text: 'Users', url: '/users' },
      { text: 'Trucks', url: '/trucks' },
      { text: 'Drivers', url: '/drivers' },
      { text: 'Performances', url: '/performances' }
    ];

    for (const item of menuItems) {
      const menuItem = page.locator(`a:has-text("${item.text}"), button:has-text("${item.text}")`).first();
      if (await menuItem.isVisible()) {
        await menuItem.click();
        await expect(page).toHaveURL(item.url);
      }
    }
  });
});











