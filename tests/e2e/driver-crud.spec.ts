import { test, expect, Page, Locator } from '@playwright/test';
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

function comboboxByFieldLabel(page: Page, labelText: RegExp | string): Locator {
  return page
    .locator('label')
    .filter({ hasText: labelText })
    .locator('xpath=..')
    .locator('[role="combobox"]').first();
}

async function selectComboboxOption(page: Page, label: RegExp | string, option: RegExp): Promise<void> {
  const trigger = comboboxByFieldLabel(page, label);
  await expect(trigger).toBeVisible();
  await trigger.click();
  const optionLocator = page.getByRole('option', { name: option }).first();
  await expect(optionLocator).toBeVisible();
  await optionLocator.click();
}

async function navigateToDrivers(page: Page): Promise<void> {
  await page.goto('/drivers', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await expect(page.getByRole('heading', { name: /Drivers/i })).toBeVisible();
}

async function locateDriverRow(page: Page, driverIdentifier: string): Promise<Locator> {
  const searchInput = page.getByPlaceholder('Search drivers...');
  await expect(searchInput).toBeVisible();
  await searchInput.fill('');
  await searchInput.fill(driverIdentifier);
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await page.waitForTimeout(300);
  const row = page.locator('table tbody tr').filter({ hasText: driverIdentifier }).first();
  await expect(row).toBeVisible({ timeout: 20000 });
  return row;
}

async function deleteDriver(page: Page, row: Locator, driverHref?: string): Promise<void> {
  const href = driverHref ?? (await row.locator('a').first().getAttribute('href')) ?? '';
  const idMatch = href.match(/\/drivers\/(\d+)/);
  const driverId = idMatch?.[1];

  await row.locator('button[data-slot="button"]').last().click();

  const dialog = page.getByRole('dialog', { name: /Delete Driver/i });
  await expect(dialog).toBeVisible();

  const deleteRequest = driverId
    ? page.waitForResponse((response) => response.request().method() === 'DELETE' && response.url().endsWith(`/drivers/${driverId}`))
    : page.waitForResponse((response) => response.request().method() === 'DELETE' && /\/drivers\/(\d+)$/.test(response.url()));

  const refreshRequest = page.waitForResponse((response) => response.url().includes('/drivers') && response.request().method() === 'GET');

  await dialog.getByRole('button', { name: /^Delete$/ }).click();
  await deleteRequest;
  await refreshRequest.catch(() => undefined);
  await expect(dialog).toBeHidden({ timeout: 20000 });
  await page.waitForLoadState('networkidle').catch(() => undefined);
}

function sexOptionLabel(sex: DriverInput['sex']): RegExp {
  return new RegExp(sex === 'male' ? 'Male' : 'Female', 'i');
}

function statusOptionLabel(status: DriverInput['status']): RegExp {
  return new RegExp(status.charAt(0).toUpperCase() + status.slice(1), 'i');
}

test.describe('Driver Management CRUD', () => {
  test('admin can complete the driver CRUD flow', async ({ page }) => {
    test.setTimeout(120000);

    const auth = new AuthHelper(page);
    const driver = buildDriverData();
    const updatedName = `${driver.name} Updated`;
    let driverDetailHref: string | undefined;

    await auth.loginAsAdmin();
    await navigateToDrivers(page);

    await test.step('Create driver', async () => {
      await Promise.all([
        page.waitForURL(/\/drivers\/create$/, { timeout: 20000 }),
        page.getByRole('link', { name: /Add Driver/i }).click(),
      ]);
      await expect(page).toHaveURL(/\/drivers\/create$/);

      await page.fill('#driverid', driver.driverId);
      await page.fill('#name', driver.name);
      await selectComboboxOption(page, /Gender/i, sexOptionLabel(driver.sex));
      await selectComboboxOption(page, /Status/i, statusOptionLabel(driver.status));
      await page.fill('#mobile', driver.mobile ?? '');

      await Promise.all([
        page.waitForURL(/\/drivers(\?.*)?$/, { timeout: 45000 }),
        page.getByRole('button', { name: /Create Driver/i }).click(),
      ]);
      await page.waitForLoadState('networkidle').catch(() => undefined);

      const createdRow = await locateDriverRow(page, driver.driverId);
      await expect(createdRow).toContainText(driver.name);
    });

    await test.step('View driver details', async () => {
      const row = await locateDriverRow(page, driver.driverId);
      driverDetailHref = await row.locator('a').first().getAttribute('href') ?? undefined;

      await Promise.all([
        page.waitForURL(/\/drivers\/\d+$/, { timeout: 20000 }),
        row.locator('a').first().click(),
      ]);
      await expect(page).toHaveURL(/\/drivers\/\d+$/);
      await expect(page.getByRole('heading', { name: new RegExp(driver.name, 'i') })).toBeVisible();

      await Promise.all([
        page.waitForURL(/\/drivers(\?.*)?$/, { timeout: 20000 }),
        page.getByRole('button', { name: /Back to Drivers/i }).click(),
      ]);
      await locateDriverRow(page, driver.driverId);
    });

    await test.step('Update driver', async () => {
      const row = await locateDriverRow(page, driver.driverId);
      await Promise.all([
        page.waitForURL(/\/drivers\/\d+\/edit$/, { timeout: 20000 }),
        row.locator('a[href*="/edit"]').first().click(),
      ]);
      await expect(page).toHaveURL(/\/drivers\/\d+\/edit$/);

      await page.fill('#name', updatedName);
      await selectComboboxOption(page, /Status/i, /Inactive/i);

      await Promise.all([
        page.waitForURL(/\/drivers(\?.*)?$/, { timeout: 45000 }),
        page.getByRole('button', { name: /Update Driver/i }).click(),
      ]);
      await page.waitForLoadState('networkidle').catch(() => undefined);

      const updatedRow = await locateDriverRow(page, driver.driverId);
      await expect(updatedRow).toContainText(updatedName);
      await expect(updatedRow).toContainText(/Inactive/i);
    });

    await test.step('Delete driver', async () => {
      const row = await locateDriverRow(page, driver.driverId);
      await deleteDriver(page, row, driverDetailHref);

      const searchInput = page.getByPlaceholder('Search drivers...');
      await searchInput.fill('');
      await searchInput.fill(driver.driverId);
      await page.waitForLoadState('networkidle').catch(() => undefined);
      await expect(page.locator('table tbody')).toContainText('No drivers found.', { timeout: 10000 });
    });
  });
});
