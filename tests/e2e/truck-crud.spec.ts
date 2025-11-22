import { test, expect, Page, Locator } from '@playwright/test';
import { AuthHelper } from './helpers/auth-helper';

test.describe('Truck Management CRUD', () => {
  function comboboxByFieldLabel(page: Page, labelText: RegExp | string): Locator {
    return page
      .locator('label')
      .filter({ hasText: labelText })
      .locator('xpath=..')
      .locator('[role="combobox"]').first();
  }

  async function navigateToTrucks(page: Page): Promise<void> {
    await page.goto('/trucks', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await expect(page.getByRole('heading', { name: /Trucks/i })).toBeVisible();
  }

  async function selectFirstVehicleType(page: Page): Promise<void> {
    const trigger = comboboxByFieldLabel(page, /Vehicle Type/i);
    await expect(trigger).toBeVisible();
    await trigger.click();
    const firstOption = page.locator('[role="option"]').first();
    await expect(firstOption).toBeVisible();
    await firstOption.click();
  }

  async function locateTruckRow(page: Page, plate: string) {
    const searchInput = page.getByPlaceholder('Search trucks...');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('');
    await searchInput.fill(plate);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);
    const row = page.locator('table tbody tr').filter({ hasText: plate }).first();
    await expect(row).toBeVisible();
    return row;
  }

  test('admin can complete the truck CRUD flow', async ({ page }) => {
    test.setTimeout(120000);

    const auth = new AuthHelper(page);
    const uniqueSuffix = Date.now().toString().slice(-4);
    const plate = `AB-${uniqueSuffix.padStart(4, '0')}`;
    const updatedServiceInterval = '15000';

    await auth.loginAsAdmin();
    await navigateToTrucks(page);

    await test.step('Create truck', async () => {
      await Promise.all([
        page.waitForURL('**/trucks/create', { timeout: 15000 }),
        page.getByRole('link', { name: /Add Truck/i }).click(),
      ]);
      await expect(page).toHaveURL(/\/trucks\/create$/);

      await page.fill('#plate', plate);
      await selectFirstVehicleType(page);
      await page.getByRole('button', { name: /Create Truck/i }).click();
      await expect(page).toHaveURL(/\/trucks$/, { timeout: 20000 });

      const createdRow = await locateTruckRow(page, plate);
      await expect(createdRow).toContainText(plate);
    });

    await test.step('View truck details', async () => {
      const row = await locateTruckRow(page, plate);
      await Promise.all([
        page.waitForURL(/\/trucks\/[0-9]+$/, { timeout: 15000 }),
        row.locator('a').first().click(),
      ]);
      await expect(page).toHaveURL(/\/trucks\/[0-9]+$/);
      await expect(page.getByRole('heading', { name: plate })).toBeVisible();
      await page.goBack();
      await page.waitForURL(/\/trucks$/, { timeout: 20000 });
      await locateTruckRow(page, plate);
    });

    await test.step('Update truck', async () => {
      const row = await locateTruckRow(page, plate);
      await Promise.all([
        page.waitForURL(/\/trucks\/.+\/edit$/, { timeout: 30000 }),
        row.locator('a[href*="/edit"]').first().click(),
      ]);
      await expect(page).toHaveURL(/\/trucks\/.+\/edit$/);

      // Ensure we are on the General tab for status
      await page.getByRole('tab', { name: /General/i }).click();

      const statusTrigger = comboboxByFieldLabel(page, /Status/i);
      await expect(statusTrigger).toBeVisible();
      await statusTrigger.click();
      await page.getByRole('option', { name: /^Inactive$/i }).click();

      await page.getByRole('tab', { name: /Technical/i }).click();

      const serviceIntervalInput = page.locator('#serviceIntervalKM');
      await expect(serviceIntervalInput).toBeVisible();
      await serviceIntervalInput.fill('');
      await serviceIntervalInput.fill(updatedServiceInterval);

      await page.getByRole('button', { name: /Update Truck/i }).click();
      await expect(page).toHaveURL(/\/trucks$/, { timeout: 30000 });
      await page.waitForLoadState('networkidle');

      const updatedRow = await locateTruckRow(page, plate);
      await expect(updatedRow.locator('td').nth(6)).toContainText(/Inactive/i);
    });

    await test.step('Delete truck', async () => {
      const row = await locateTruckRow(page, plate);
      const detailHref = await row.locator('a').first().getAttribute('href');
      const truckIdMatch = detailHref?.match(/\/(\d+)(?:\/)?$/);
      const truckId = truckIdMatch?.[1];
      await row.locator('button[data-slot="button"]').last().click();

      const dialog = page.getByRole('dialog', { name: /Delete Truck/i });
      await expect(dialog).toBeVisible();
      const deleteRequest = truckId
        ? page.waitForResponse((response) =>
          response.url().endsWith(`/trucks/${truckId}`) && response.request().method() === 'DELETE',
        )
        : page.waitForResponse((response) =>
          /\/trucks\/(\d+)$/.test(response.url()) && response.request().method() === 'DELETE',
        );

      const refreshRequest = page.waitForResponse((response) =>
        response.url().includes('/trucks') && response.request().method() === 'GET',
      );

      await dialog.getByRole('button', { name: /^Delete$/ }).click();
      await deleteRequest;
      await refreshRequest.catch(() => undefined);
      await expect(dialog).toBeHidden({ timeout: 20000 });
      await page.waitForLoadState('networkidle').catch(() => undefined);

      const searchInput = page.getByPlaceholder('Search trucks...');
      await searchInput.fill('');
      await searchInput.fill(plate);
      await page.waitForLoadState('networkidle').catch(() => undefined);

      const remaining = page.locator('table tbody tr').filter({ hasText: plate });
      await expect(remaining).toHaveCount(0, { timeout: 10000 });
      await expect(page.locator('table tbody')).toContainText('No trucks found', { timeout: 10000 });
    });
  });
});
