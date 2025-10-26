import { test, expect } from '@playwright/test';

test('simple server test', async ({ page }) => {
  // Test if server is accessible
  await page.goto('http://localhost:8000');

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Check if we get a response (even if it's an error page)
  const title = await page.title();
  console.log('Page title:', title);

  // The page should load (even if it redirects to login)
  expect(title).toBeTruthy();
});

test('login page test', async ({ page }) => {
  // Test login page specifically
  await page.goto('http://localhost:8000/login');

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Check if login form is present
  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');

  await expect(emailInput).toBeVisible();
  await expect(passwordInput).toBeVisible();

  console.log('Login page loaded successfully');
});


