import { test, expect } from '@playwright/test';
import { TEST_CONFIG } from './test-config';

test('homepage loads correctly', async ({ page }) => {
  await page.goto('/');

  // Check if the page title contains expected text
  await expect(page).toHaveTitle(/TIMS|Transport/);

  // Check if the page loads without errors
  await expect(page.locator('body')).toBeVisible();
});

test('login page loads correctly', async ({ page }) => {
  await page.goto(TEST_CONFIG.LOGIN_URL);

  // Check if login form elements are present
  await expect(page.locator(TEST_CONFIG.SELECTORS.LOGIN.EMAIL_INPUT)).toBeVisible();
  await expect(page.locator(TEST_CONFIG.SELECTORS.LOGIN.PASSWORD_INPUT)).toBeVisible();
  await expect(page.locator(TEST_CONFIG.SELECTORS.LOGIN.SUBMIT_BUTTON)).toBeVisible();
});

test('user can navigate to dashboard after login', async ({ page }) => {
  // Navigate to login page
  await page.goto(TEST_CONFIG.LOGIN_URL);

  // Fill in login credentials
  await page.fill(TEST_CONFIG.SELECTORS.LOGIN.EMAIL_INPUT, TEST_CONFIG.CREDENTIALS.ADMIN.email);
  await page.fill(TEST_CONFIG.SELECTORS.LOGIN.PASSWORD_INPUT, TEST_CONFIG.CREDENTIALS.ADMIN.password);

  // Click login button
  await page.click(TEST_CONFIG.SELECTORS.LOGIN.SUBMIT_BUTTON);

  // Wait for navigation to dashboard
  await page.waitForURL(TEST_CONFIG.DASHBOARD_URL);

  // Verify we're on the dashboard
  await expect(page).toHaveURL(TEST_CONFIG.DASHBOARD_URL);
  await expect(page.locator('h1')).toContainText(/Dashboard|TIMS/);
});











