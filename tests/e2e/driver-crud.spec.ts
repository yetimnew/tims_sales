import { test, expect, Page, Locator } from '@playwright/test';
import { AuthHelper } from './helpers/auth-helper';

type DriverInput = {
  driverId: string;
  name: string;
  sex: 'male' | 'female';
  status: 'active' | 'inactive';
  mobile?: string;
};

type CreateDriverOptions = Partial<DriverInput>;

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

async function openCreateDriverForm(page: Page): Promise<void> {
  await navigateToDrivers(page);
  const addButton = page.getByRole('link', { name: /Add Driver/i });
  await expect(addButton).toBeVisible();
  await addButton.click();
  await page.waitForURL(/\/drivers\/create$/, { timeout: 25000 });
  await expect(page.getByText(/Create New Driver/i)).toBeVisible({ timeout: 20000 });
}

async function fillDriverForm(page: Page, driver: DriverInput): Promise<void> {
  await page.fill('#driverid', driver.driverId);
  await page.fill('#name', driver.name);
  await selectComboboxOption(page, /Gender/i, new RegExp(driver.sex === 'male' ? 'Male' : 'Female', 'i'));
  await selectComboboxOption(page, /Status/i, new RegExp(driver.status.charAt(0).toUpperCase() + driver.status.slice(1), 'i'));

  if (driver.mobile) {
    await page.fill('#mobile', driver.mobile);
  }
}

async function searchDrivers(page: Page, query: string): Promise<void> {
  const searchInput = page.getByPlaceholder('Search drivers...');
  await expect(searchInput).toBeVisible();
  await searchInput.fill('');
  if (query !== '') {
    await searchInput.fill(query);
  }
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await page.waitForTimeout(300);
}

async function findDriverRow(page: Page, identifier: string): Promise<Locator | null> {
  await searchDrivers(page, identifier);
  const row = page.locator('table tbody tr').filter({ hasText: identifier }).first();
  if (await row.count() === 0) {
    return null;
  }
  await row.scrollIntoViewIfNeeded().catch(() => undefined);
  return row;
}

async function locateDriverRow(page: Page, identifier: string): Promise<Locator> {
  const row = await findDriverRow(page, identifier);
  expect(row, `Expected to locate driver row containing ${identifier}`).not.toBeNull();
  return row as Locator;
}

async function openDriverShow(page: Page, identifier: string): Promise<void> {
  const row = await locateDriverRow(page, identifier);
  const detailLink = row.locator('a').first();
  await expect(detailLink).toBeVisible();
  await detailLink.click();
  await page.waitForURL(/\/drivers\/\d+$/, { timeout: 25000 });
  await page.waitForLoadState('networkidle').catch(() => undefined);
}

async function openEditFormForDriver(page: Page, identifier: string): Promise<void> {
  const row = await locateDriverRow(page, identifier);
  const editLink = row.locator('a[href*="/edit"]').first();
  await expect(editLink).toBeVisible();
  await editLink.click();
  await page.waitForURL(/\/drivers\/\d+\/edit$/, { timeout: 25000 });
  await page.waitForLoadState('networkidle').catch(() => undefined);
}

async function deleteDriverFromRow(page: Page, row: Locator, identifier: string, cachedHref?: string): Promise<void> {
  const href = cachedHref ?? (await row.locator('a').first().getAttribute('href')) ?? '';
  const idMatch = href.match(/\/drivers\/(\d+)/);
  const driverId = idMatch?.[1];

  const deleteButton = row.locator('button[data-slot="button"]').last();
  await expect(deleteButton).toBeVisible();
  await deleteButton.click();

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

  await searchDrivers(page, identifier);
  await expect(page.locator('table tbody tr').filter({ hasText: identifier })).toHaveCount(0, { timeout: 10000 });
}

async function deleteDriverIfExists(page: Page, identifier: string): Promise<boolean> {
  await navigateToDrivers(page);
  const row = await findDriverRow(page, identifier);
  if (!row) {
    return false;
  }
  await deleteDriverFromRow(page, row, identifier);
  return true;
}

async function createDriverViaUI(page: Page, overrides: CreateDriverOptions = {}): Promise<DriverInput> {
  const driver = buildDriverData(overrides);
  await openCreateDriverForm(page);
  await fillDriverForm(page, driver);

  // Click submit and wait for redirect
  await page.getByRole('button', { name: /Create Driver/i }).click();
  await page.waitForURL(/\/drivers(\?.*)?$/, { timeout: 60000 });

  // Wait for the page to be in a stable state
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle').catch(() => undefined);

  // Explicitly search for the driver and wait for it to appear in the table
  const searchInput = page.getByPlaceholder('Search drivers...');
  await expect(searchInput).toBeVisible({ timeout: 10000 });
  await searchInput.fill('');
  await searchInput.fill(driver.driverId);

  // Wait for network to settle after search
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await page.waitForTimeout(500);

  // Verify the driver appears in the table
  const row = page.locator('table tbody tr').filter({ hasText: driver.driverId }).first();
  await expect(row).toBeVisible({ timeout: 20000 });

  return driver;
}

function statusFilterTrigger(page: Page): Locator {
  return page.locator('button[role="combobox"]').filter({ hasText: /statuses/i }).first();
}

function genderFilterTrigger(page: Page): Locator {
  return page.locator('button[role="combobox"]').filter({ hasText: /genders/i }).first();
}

test.describe('Driver Management End-to-End Tests', () => {
  test.beforeEach(async ({ page }) => {
    const auth = new AuthHelper(page);
    await auth.loginAsAdmin();
  });

  test('admin can view drivers index page', async ({ page }) => {
    await navigateToDrivers(page);
    await expect(page.getByRole('button', { name: /Export CSV/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Add Driver/i })).toBeVisible();
    await expect(page.getByPlaceholder('Search drivers...')).toBeVisible();
    await expect(statusFilterTrigger(page)).toBeVisible();
    await expect(genderFilterTrigger(page)).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
  });

  test('admin can search for drivers by driver ID', async ({ page }) => {
    const driver = await createDriverViaUI(page);
    try {
      await searchDrivers(page, driver.driverId);
      const row = await locateDriverRow(page, driver.driverId);
      await expect(row).toContainText(driver.name);
    } finally {
      await deleteDriverIfExists(page, driver.driverId);
    }
  });

  test('admin can filter drivers by status', async ({ page }) => {
    const driver = await createDriverViaUI(page, { status: 'inactive' });
    try {
      await searchDrivers(page, '');
      const statusFilter = statusFilterTrigger(page);
      await statusFilter.click();
      await page.getByRole('option', { name: /Inactive/i }).click();
      await expect(page.locator('table tbody tr').filter({ hasText: driver.driverId })).toBeVisible({ timeout: 20000 });

      await statusFilter.click();
      await page.getByRole('option', { name: /Active/i }).click();
      await expect(page.locator('table tbody tr').filter({ hasText: driver.driverId })).toHaveCount(0, { timeout: 20000 });
    } finally {
      await deleteDriverIfExists(page, driver.driverId);
    }
  });

  test('admin can create a new driver', async ({ page }) => {
    const driver = await createDriverViaUI(page);
    try {
      const row = await locateDriverRow(page, driver.driverId);
      await expect(row).toContainText(driver.name);
      await expect(row).toContainText(/Active/i);
    } finally {
      await deleteDriverIfExists(page, driver.driverId);
    }
  });

  test('driver creation validates required fields', async ({ page }) => {
    await openCreateDriverForm(page);
    await page.getByRole('button', { name: /Create Driver/i }).click();
    await expect(page.getByText('Driver ID is required')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Driver name is required')).toBeVisible();
    await expect(page.getByText('Gender is required')).toBeVisible();
  });

  test('admin can edit driver information', async ({ page }) => {
    const driver = await createDriverViaUI(page);
    const updatedName = `${driver.name} Updated`;
    try {
      await openEditFormForDriver(page, driver.driverId);
      await page.fill('#name', updatedName);
      await selectComboboxOption(page, /Status/i, /Inactive/i);
      await page.getByRole('button', { name: /Update Driver/i }).click();
      await page.waitForURL(/\/drivers(\?.*)?$/, { timeout: 45000 });
      await page.waitForLoadState('networkidle').catch(() => undefined);

      const row = await locateDriverRow(page, driver.driverId);
      await expect(row).toContainText(updatedName);
      await expect(row).toContainText(/Inactive/i);
    } finally {
      await deleteDriverIfExists(page, driver.driverId);
    }
  });

  test('admin can view driver details page', async ({ page }) => {
    const driver = await createDriverViaUI(page);
    try {
      await openDriverShow(page, driver.driverId);
      await expect(page.getByRole('heading', { name: new RegExp(driver.name, 'i') })).toBeVisible();
      await expect(page.getByText(driver.driverId)).toBeVisible();
      await expect(page.getByRole('button', { name: /Back to Drivers/i })).toBeVisible();
    } finally {
      await deleteDriverIfExists(page, driver.driverId);
    }
  });

  test('admin can delete driver', async ({ page }) => {
    const driver = await createDriverViaUI(page);
    await deleteDriverIfExists(page, driver.driverId);
  });

  test('admin can export drivers to CSV', async ({ page }) => {
    await navigateToDrivers(page);
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Export CSV/i }).click();
    const download = await downloadPromise;
    await expect(download.suggestedFilename()).toMatch(/drivers_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.csv/);
  });
});
