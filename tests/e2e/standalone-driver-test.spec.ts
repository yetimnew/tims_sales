import { test, expect } from '@playwright/test';
import { AuthHelper } from './helpers/auth-helper';

type DriverInput = {
    driverId: string;
    name: string;
    sex: 'male' | 'female';
    status: 'active' | 'inactive';
    mobile?: string;
};

function randomSuffix(): string {
    return `${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
}

function buildDriverData(overrides: Partial<DriverInput> = {}): DriverInput {
    const suffix = randomSuffix();

    return {
        driverId: overrides.driverId ?? `DRV${suffix.slice(-6).toUpperCase()}`,
        name: overrides.name ?? `Test Driver ${suffix}`,
        sex: overrides.sex ?? 'male',
        status: overrides.status ?? 'active',
        mobile: overrides.mobile ?? `+2519${suffix.slice(0, 8)}`,
    };
}

test('STANDALONE: Create and verify driver', async ({ page }) => {
    test.setTimeout(180000);

    const auth = new AuthHelper(page);
    await auth.loginAsAdmin();

    const driver = buildDriverData();

    // Navigate to drivers
    await page.goto('/drivers', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForLoadState('networkidle').catch(() => undefined);

    // Open create form
    await page.getByRole('link', { name: /Add Driver/i }).click();
    await page.waitForURL(/\/drivers\/create$/, { timeout: 25000 });

    // Fill form
    await page.fill('#driverid', driver.driverId);
    await page.fill('#name', driver.name);

    // Select gender
    const genderCombobox = page.locator('label').filter({ hasText: /Gender/i }).locator('xpath=..').locator('[role="combobox"]').first();
    await genderCombobox.click();
    await page.getByRole('option', { name: /Male/i }).first().click();

    // Select status
    const statusCombobox = page.locator('label').filter({ hasText: /Status/i }).locator('xpath=..').locator('[role="combobox"]').first();
    await statusCombobox.click();
    await page.getByRole('option', { name: /Active/i }).first().click();

    // Submit
    await page.getByRole('button', { name: /Create Driver/i }).click();
    await page.waitForURL(/\/drivers(\?.*)?$/, { timeout: 60000 });
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await page.waitForTimeout(2000);

    // Search
    const searchInput = page.getByPlaceholder('Search drivers...');
    await searchInput.fill(driver.driverId);
    await page.waitForTimeout(2000);

    // Verify
    const row = page.locator('table tbody tr').filter({ hasText: driver.driverId }).first();
    await expect(row).toBeVisible({ timeout: 30000 });
    await expect(row).toContainText(driver.name);

    console.log('✅ Driver created and verified!');

    // Cleanup
    await row.locator('button[data-slot="button"]').last().click();
    await page.getByRole('dialog').getByRole('button', { name: /^Delete$/ }).click();
    await page.waitForTimeout(2000);

    console.log('✅ Driver deleted!');
});
