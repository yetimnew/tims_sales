import { test, expect } from '@playwright/test';

test('homepage loads correctly', async ({ page }) => {
  await page.goto('/');

  // Check if the page title contains expected text
  await expect(page).toHaveTitle(/TIMS|Transport/);

  // Check if the page loads without errors
  await expect(page.locator('body')).toBeVisible();
});

test('login page loads correctly', async ({ page }) => {
  await page.goto('/login');

  // Check if login form elements are present
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
  await expect(page.locator('button[type="submit"]')).toBeVisible();
});

test('user can navigate to dashboard after login', async ({ page }) => {
  // Navigate to login page
  await page.goto('/login');

  // Fill in login credentials (you'll need to adjust these based on your test data)
  await page.fill('input[type="email"]', 'admin@example.com');
  await page.fill('input[type="password"]', 'password');

  // Click login button
  await page.click('button[type="submit"]');

  // Wait for navigation to dashboard
  await page.waitForURL('/dashboard');

  // Verify we're on the dashboard
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('h1')).toContainText(/Dashboard|TIMS/);
});










