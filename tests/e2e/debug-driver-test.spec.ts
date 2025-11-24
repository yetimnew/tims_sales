import { test, expect } from '@playwright/test';
import { AuthHelper } from './helpers/auth-helper';

test('DEBUG: Simple driver creation test', async ({ page }) => {
    test.setTimeout(180000); // 3 minutes

    const auth = new AuthHelper(page);
    await auth.loginAsAdmin();

    // Navigate to drivers page
    console.log('Step 1: Navigating to drivers page...');
    await page.goto('/drivers', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await expect(page.getByRole('heading', { name: /Drivers/i })).toBeVisible();
    console.log('✓ Drivers page loaded');

    // Click Add Driver
    console.log('Step 2: Clicking Add Driver...');
    const addButton = page.getByRole('link', { name: /Add Driver/i });
    await expect(addButton).toBeVisible();
    await addButton.click();
    await page.waitForURL(/\/drivers\/create$/, { timeout: 25000 });
    await expect(page.getByText(/Create New Driver/i)).toBeVisible({ timeout: 20000 });
    console.log('✓ Create form opened');

    // Fill form
    console.log('Step 3: Filling form...');
    const driverId = `TEST${Date.now().toString().slice(-6)}`;
    const name = `Test Driver ${Date.now()}`;

    await page.fill('#driverid', driverId);
    await page.fill('#name', name);
    console.log(`✓ Filled ID: ${driverId}, Name: ${name}`);

    // Select gender
    console.log('Step 4: Selecting gender...');
    const genderCombobox = page.locator('label')
        .filter({ hasText: /Gender/i })
        .locator('xpath=..')
        .locator('[role="combobox"]').first();
    await expect(genderCombobox).toBeVisible();
    await genderCombobox.click();
    await page.waitForTimeout(500);
    const maleOption = page.getByRole('option', { name: /Male/i }).first();
    await expect(maleOption).toBeVisible();
    await maleOption.click();
    console.log('✓ Selected gender');

    // Select status
    console.log('Step 5: Selecting status...');
    const statusCombobox = page.locator('label')
        .filter({ hasText: /Status/i })
        .locator('xpath=..')
        .locator('[role="combobox"]').first();
    await expect(statusCombobox).toBeVisible();
    await statusCombobox.click();
    await page.waitForTimeout(500);
    const activeOption = page.getByRole('option', { name: /Active/i }).first();
    await expect(activeOption).toBeVisible();
    await activeOption.click();
    console.log('✓ Selected status');

    // Submit form
    console.log('Step 6: Submitting form...');
    const submitButton = page.getByRole('button', { name: /Create Driver/i });
    await expect(submitButton).toBeVisible();
    await submitButton.click();
    console.log('✓ Clicked submit button');

    // Wait for redirect
    console.log('Step 7: Waiting for redirect...');
    await page.waitForURL(/\/drivers(\?.*)?$/, { timeout: 60000 });
    console.log('✓ Redirected to drivers page');

    // Wait for stable state
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await page.waitForTimeout(2000);
    console.log('✓ Page stabilized');

    // Search for the driver
    console.log('Step 8: Searching for driver...');
    const searchInput = page.getByPlaceholder('Search drivers...');
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    await searchInput.fill('');
    await searchInput.fill(driverId);
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await page.waitForTimeout(1000);
    console.log(`✓ Searched for: ${driverId}`);

    // Verify driver appears
    console.log('Step 9: Verifying driver in table...');
    const row = page.locator('table tbody tr').filter({ hasText: driverId }).first();
    const rowCount = await row.count();
    console.log(`Found ${rowCount} row(s) with driver ID`);

    if (rowCount === 0) {
        // Debug: take screenshot and log table contents
        await page.screenshot({ path: 'debug-driver-not-found.png', fullPage: true });
        const tableText = await page.locator('table tbody').textContent();
        console.log('Table contents:', tableText);
        throw new Error(`Driver ${driverId} not found in table`);
    }

    await expect(row).toBeVisible({ timeout: 20000 });
    console.log('✓ Driver found in table!');

    // Cleanup
    console.log('Step 10: Cleaning up...');
    const deleteButton = row.locator('button[data-slot="button"]').last();
    await deleteButton.click();
    const dialog = page.getByRole('dialog', { name: /Delete Driver/i });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: /^Delete$/ }).click();
    await expect(dialog).toBeHidden({ timeout: 20000 });
    console.log('✓ Driver deleted');

    console.log('✅ TEST COMPLETED SUCCESSFULLY!');
});
