import { test, expect, Page, Locator } from '@playwright/test';
import { AuthHelper } from './helpers/auth-helper';

test.describe('Truck creation with detailed show view', () => {
  function comboboxByFieldLabel(page: Page, labelText: RegExp | string): Locator {
    return page
      .locator('label')
      .filter({ hasText: labelText })
      .locator('xpath=..')
      .locator('[role="combobox"]').first();
  }

  async function locateTruckRow(page: Page, plate: string) {
    const searchInput = page.getByPlaceholder('Search trucks...');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('');
    await searchInput.fill(plate);
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await page.waitForTimeout(300);
    const row = page.locator('table tbody tr').filter({ hasText: plate }).first();
    await expect(row).toBeVisible();
    return row;
  }

  test('admin can create a truck and view all submitted data on the show page', async ({ page }) => {
    test.setTimeout(120000);

    const auth = new AuthHelper(page);
    const uniqueId = Date.now().toString();
    const plate = `TS-${uniqueId.slice(-4)}`;
    const chassisNumber = `CHS-${uniqueId}`;
    const engineNumber = `ENG-${uniqueId}`;
    const tyreSize = '315/80R22.5';
    const serviceIntervalKm = 12345;
    const purchasePrice = 345678;
    const productionDate = '2024-01-15';
    const serviceStartDate = '2024-02-20';

    const formattedServiceInterval = `${serviceIntervalKm.toLocaleString('en-US')} KM`;
    const formattedPurchasePrice = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(purchasePrice);
    const formattedProductionDate = new Date(productionDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedServiceStartDate = new Date(serviceStartDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    await auth.loginAsAdmin();
    await page.goto('/trucks/create', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await expect(page).toHaveURL(/\/trucks\/create$/);

    const vehicleTypeTrigger = comboboxByFieldLabel(page, /Vehicle Type/i);
    await expect(vehicleTypeTrigger).toBeVisible();
    await vehicleTypeTrigger.click();
    const firstVehicleOption = page.locator('[role="option"]').first();
    await expect(firstVehicleOption).toBeVisible();
    await firstVehicleOption.click();

    await page.fill('#plate', plate);
    await page.fill('#chasisNumber', chassisNumber);
    await page.fill('#engineNumber', engineNumber);
    await page.fill('#tyreSyze', tyreSize);
    await page.fill('#serviceIntervalKM', serviceIntervalKm.toString());
    await page.fill('#purchasePrice', purchasePrice.toString());
    await page.fill('#productionDate', productionDate);
    await page.fill('#serviceStartDate', serviceStartDate);

    const createButton = page.getByRole('button', { name: /Create Truck/i });
    await expect(createButton).toBeEnabled();

    await Promise.all([
      page.waitForURL(/\/trucks$/, { timeout: 30000 }),
      createButton.click(),
    ]);
    await page.waitForLoadState('networkidle').catch(() => undefined);

    const createdRow = await locateTruckRow(page, plate);
    await expect(createdRow).toContainText(plate);

    await Promise.all([
      page.waitForURL(/\/trucks\/[0-9]+$/, { timeout: 30000 }),
      createdRow.locator('a').first().click(),
    ]);
    await page.waitForLoadState('networkidle').catch(() => undefined);

    const pageBody = page.locator('body');
    await expect(page.getByRole('heading', { name: plate })).toBeVisible();
    await expect(pageBody).toContainText('Active');
    await expect(pageBody).toContainText('Vehicle Type');
    await expect(pageBody).toContainText(chassisNumber);
    await expect(pageBody).toContainText(engineNumber);
    await expect(pageBody).toContainText(tyreSize);
    await expect(pageBody).toContainText(formattedServiceInterval);
    await expect(pageBody).toContainText(formattedPurchasePrice);
    await expect(pageBody).toContainText(formattedProductionDate);
    await expect(pageBody).toContainText(formattedServiceStartDate);
  });
});
