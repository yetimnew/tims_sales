import { test, expect, Page, Locator } from '@playwright/test';
import { AuthHelper } from './helpers/auth-helper';

type TestUserInput = {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  role: string;
};

function uniqueSuffix(): string {
  return `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
}

function strongPassword(): string {
  return `Aa1!${uniqueSuffix()}`;
}

function roleLabel(role: string): string {
  return `${role.charAt(0).toUpperCase()}${role.slice(1)}`;
}

function currentPageOrigin(page: Page): string {
  try {
    const url = new URL(page.url());
    return url.origin === 'null' ? 'http://localhost:8000' : url.origin;
  } catch {
    return 'http://localhost:8000';
  }
}

function buildTestUser(overrides: Partial<TestUserInput> = {}): TestUserInput {
  const suffix = uniqueSuffix();
  const password = overrides.password ?? strongPassword();

  return {
    name: overrides.name ?? `Test User ${suffix}`,
    email: overrides.email ?? `testuser-${suffix}@example.com`,
    password,
    passwordConfirmation: overrides.passwordConfirmation ?? password,
    role: overrides.role ?? 'user',
  };
}

async function navigateToUsers(page: Page): Promise<void> {
  await page.goto('/users', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await expect(page.getByRole('heading', { name: /User Management/i })).toBeVisible({ timeout: 40000 });
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await expect(page).toHaveURL(/\/users(\?.*)?$/, { timeout: 30000 });
}

async function openAddUserForm(page: Page): Promise<void> {
  await navigateToUsers(page);
  const addButton = page.getByRole('link', { name: /Add User/i });
  await expect(addButton).toBeVisible();
  await Promise.all([
    page.waitForURL(/\/users\/create$/, { timeout: 30000, waitUntil: 'commit' }),
    addButton.click(),
  ]);
  await expect(page.getByRole('heading', { name: /Create (New )?User/i })).toBeVisible();
}

async function selectRole(page: Page, role: string): Promise<void> {
  const trigger = page.locator('[data-slot="select-trigger"]').first();
  await expect(trigger).toBeVisible();
  await trigger.click();
  await page.getByRole('option', { name: new RegExp(`^${roleLabel(role)}$`, 'i') }).click();
}

async function fillUserForm(page: Page, user: TestUserInput, options: { skipRole?: boolean } = {}): Promise<void> {
  await page.fill('#name', user.name);
  await page.fill('#email', user.email);
  await page.fill('#password', user.password);
  await page.fill('#password_confirmation', user.passwordConfirmation);

  if (!options.skipRole) {
    await selectRole(page, user.role);
  }
}

async function findUserRow(page: Page, email: string): Promise<Locator | null> {
  const locateRow = () => page.locator('table tbody tr').filter({ hasText: email }).first();
  const pageOrigin = currentPageOrigin(page);

  const initialRow = locateRow();
  if (await initialRow.count()) {
    await initialRow.scrollIntoViewIfNeeded();
    return initialRow;
  }

  const secondPageLink = page.getByRole('link', { name: /^2$/ });
  if (await secondPageLink.count()) {
    const isActive = await secondPageLink.getAttribute('aria-current');
    if (isActive !== 'page') {
      const href = await secondPageLink.getAttribute('href');
      const paginationResponse = page.waitForResponse((response) => {
        if (response.request().method() !== 'GET') {
          return false;
        }

        try {
          const url = new URL(response.url());
          if (url.pathname !== '/users') {
            return false;
          }

          const isSuccessful = response.status() >= 200 && response.status() < 400;
          if (!isSuccessful) {
            return false;
          }

          if (!href) {
            return true;
          }

          const targetUrl = new URL(href, pageOrigin);
          return url.search === targetUrl.search;
        } catch {
          return false;
        }
      });
      await secondPageLink.click();
      await paginationResponse;
      await page.waitForLoadState('networkidle').catch(() => undefined);
    }

    const secondRow = locateRow();
    if (await secondRow.count()) {
      await secondRow.scrollIntoViewIfNeeded();
      return secondRow;
    }
  }

  return null;
}

async function locateUserRow(page: Page, email: string): Promise<Locator> {
  const row = await findUserRow(page, email);
  expect(row, `Expected to find a table row for ${email}`).not.toBeNull();
  const resolvedRow = row as Locator;
  await expect(resolvedRow).toBeVisible();
  return resolvedRow;
}

async function deleteUserIfExists(page: Page, email: string): Promise<boolean> {
  try {
    const currentUrl = new URL(page.url());
    if (!currentUrl.pathname.startsWith('/users')) {
      await navigateToUsers(page);
    }
  } catch {
    await navigateToUsers(page);
  }
  const pageOrigin = currentPageOrigin(page);
  const row = await findUserRow(page, email);

  if (!row) {
    return false;
  }

  const deleteButton = row.locator('button').last();
  await deleteButton.waitFor({ state: 'visible', timeout: 10000 });

  const deleteRequest = page.waitForResponse((response) => {
    return response.request().method() === 'DELETE'
      && response.url().includes('/users/')
      && response.status() >= 200
      && response.status() < 400;
  });

  await deleteButton.click();

  const dialog = page.getByRole('dialog', { name: /Delete User/i });
  await expect(dialog).toBeVisible();

  const confirmButton = dialog.getByRole('button', { name: /^Delete/i });
  const response = await Promise.all([
    deleteRequest,
    confirmButton.click(),
  ]).then(([resp]) => resp);

  const status = response?.status() ?? 0;
  const responseUrl = response?.url() ?? 'unknown-url';
  if (status >= 400) {
    throw new Error(`Failed to delete user ${email}: ${responseUrl} returned status ${status}`);
  }
  console.log(`Deleted user ${email} via ${responseUrl} (status ${status})`);

  await page.waitForLoadState('networkidle').catch(() => undefined);
  await expect.poll(async () => {
    return await page.locator('table').innerText();
  }, { timeout: 30000, intervals: [500] }).not.toContain(email);

  if (await dialog.isVisible()) {
    const closeButton = dialog.getByRole('button', { name: /^Close$/i }).first();
    const cancelButton = dialog.getByRole('button', { name: /^Cancel$/i }).first();

    if (await closeButton.count() && await closeButton.isVisible()) {
      await closeButton.click();
    } else if (await cancelButton.count() && await cancelButton.isVisible()) {
      await cancelButton.click();
    }

    await expect(dialog).toBeHidden({ timeout: 10000 });
  }

  const secondPageLink = page.getByRole('link', { name: /^2$/ });
  if (await secondPageLink.count()) {
    const isActive = await secondPageLink.getAttribute('aria-current');
    if (isActive === 'page') {
      const firstPageLink = page.getByRole('link', { name: /^1$/ });
      if (await firstPageLink.count()) {
        const href = await firstPageLink.getAttribute('href');
        const paginationResponse = page.waitForResponse((response) => {
          if (response.request().method() !== 'GET') {
            return false;
          }

          try {
            const url = new URL(response.url());
            if (url.pathname !== '/users') {
              return false;
            }

            const isSuccessful = response.status() >= 200 && response.status() < 400;
            if (!isSuccessful) {
              return false;
            }

            if (!href) {
              return true;
            }

            const targetUrl = new URL(href, pageOrigin);
            return url.search === targetUrl.search;
          } catch {
            return false;
          }
        });
        await firstPageLink.click();
        await paginationResponse;
        await page.waitForLoadState('networkidle').catch(() => undefined);
        await expect(page.locator('table')).not.toContainText(email);
      }
    }
  }

  return true;
}

async function createUserViaUI(page: Page, overrides: Partial<TestUserInput> = {}): Promise<TestUserInput> {
  const user = buildTestUser(overrides);
  await openAddUserForm(page);
  await fillUserForm(page, user);
  const redirectRequest = page.waitForResponse((response) => {
    if (response.request().method() !== 'GET') {
      return false;
    }

    try {
      const url = new URL(response.url());
      const isUsersPath = url.pathname === '/users';
      const isSuccessful = response.status() >= 200 && response.status() < 400;
      return isUsersPath && isSuccessful;
    } catch {
      return false;
    }
  });
  await page.click('button[type="submit"]');
  await redirectRequest;
  await expect(page).toHaveURL(/\/users(\?.*)?$/, { timeout: 45000 });
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await locateUserRow(page, user.email);
  return user;
}

async function openEditFormForUser(page: Page, email: string): Promise<void> {
  const row = await locateUserRow(page, email);
  const editLink = row.locator('a[href*="/edit"]').first();
  await expect(editLink).toBeVisible();
  await editLink.click();
  await page.waitForURL(/\/users\/\d+\/edit$/, { timeout: 30000 });
  await page.waitForLoadState('networkidle').catch(() => undefined);
}

const PWNED_PASSWORD_API = '**/api.pwnedpasswords.com/**';

test.describe('User Management End-to-End Tests', () => {
  const adminCredentials = {
    email: 'admin@test.com',
    password: 'password123',
  };

  test.beforeEach(async ({ page }) => {
    await page.route(PWNED_PASSWORD_API, async (route) => {
      await route.fulfill({ status: 200, contentType: 'text/plain', body: '' });
    });
    const auth = new AuthHelper(page);
    await auth.loginAsAdmin();
  });

  test.describe('User Index Page', () => {
    test('admin can view users index page', async ({ page }) => {
      await navigateToUsers(page);
      await expect(page.locator('table')).toBeVisible();
      await expect(page.getByRole('link', { name: /Add User/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Export CSV/i })).toBeVisible();
    });

    test('users table displays user information', async ({ page }) => {
      await navigateToUsers(page);
      const table = page.locator('table').first();
      const headerCount = await table.locator('th').count();
      expect(headerCount).toBeGreaterThan(0);
      const rowCount = await table.locator('tbody tr').count();
      expect(rowCount).toBeGreaterThan(0);
      await expect(table.locator('tbody')).toContainText('@');
    });

    test('admin can export users to CSV', async ({ page }) => {
      await navigateToUsers(page);
      const downloadPromise = page.waitForEvent('download');
      await page.getByRole('button', { name: /Export CSV/i }).click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/users_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.csv/);
    });
  });

  test.describe('User Creation', () => {
    test('admin can create a new user', async ({ page }) => {
      const user = await createUserViaUI(page);
      const row = await locateUserRow(page, user.email);
      await expect(row).toContainText(roleLabel(user.role));
      await deleteUserIfExists(page, user.email);
    });

    test('user creation validates required fields', async ({ page }) => {
      await openAddUserForm(page);
      await page.click('button[type="submit"]');
      await expect(page.getByText('Please fix all errors in the form below')).toBeVisible();
      await expect(page.getByText('Name is required')).toBeVisible();
      await expect(page.getByText('Email is required')).toBeVisible();
    });

    test('user creation validates email uniqueness', async ({ page }) => {
      await openAddUserForm(page);
      const password = strongPassword();
      await page.fill('#name', 'Another User');
      await page.fill('#email', adminCredentials.email);
      await page.fill('#password', password);
      await page.fill('#password_confirmation', password);
      await selectRole(page, 'user');
      await page.click('button[type="submit"]');
      await expect(page.getByText('The email has already been taken.')).toBeVisible({ timeout: 15000 });
    });

    test('user creation validates password confirmation', async ({ page }) => {
      const user = buildTestUser({ passwordConfirmation: 'Different123!@#' });
      await openAddUserForm(page);
      await fillUserForm(page, user);
      await page.click('button[type="submit"]');
      await expect(page.getByText('Passwords do not match')).toBeVisible();
    });

    test('user creation validates password strength', async ({ page }) => {
      const user = buildTestUser({
        password: 'weak',
        passwordConfirmation: 'weak',
        email: `weak-${uniqueSuffix()}@example.com`,
      });
      await openAddUserForm(page);
      await fillUserForm(page, user);
      await page.click('button[type="submit"]');
      await expect(page.getByText('Password must be at least 8 characters')).toBeVisible();
    });

    test('user creation validates role selection', async ({ page }) => {
      const user = buildTestUser();
      await openAddUserForm(page);
      await page.fill('#name', user.name);
      await page.fill('#email', user.email);
      await page.fill('#password', user.password);
      await page.fill('#password_confirmation', user.passwordConfirmation);
      await page.click('button[type="submit"]');
      await expect(page.getByText('The role field is required.')).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('User Editing', () => {
    test('admin can edit user information', async ({ page }) => {
      const user = await createUserViaUI(page);
      await openEditFormForUser(page, user.email);
      await expect(page.getByRole('heading', { name: /Edit User/i })).toBeVisible();

      const updatedEmail = `updated-${uniqueSuffix()}@example.com`;
      await page.fill('#name', 'Updated User Name');
      await page.fill('#email', updatedEmail);
      await selectRole(page, 'manager');
      const editRedirect = page.waitForResponse((response) => {
        if (response.request().method() !== 'GET') {
          return false;
        }

        try {
          const url = new URL(response.url());
          const isUsersPath = url.pathname === '/users';
          const isSuccessful = response.status() >= 200 && response.status() < 400;
          return isUsersPath && isSuccessful;
        } catch {
          return false;
        }
      });
      await page.click('button[type="submit"]');
      await editRedirect;
      await expect(page).toHaveURL(/\/users(\?.*)?$/, { timeout: 45000 });
      await page.waitForLoadState('networkidle').catch(() => undefined);

      const updatedRow = await locateUserRow(page, updatedEmail);
      await expect(updatedRow).toContainText('Updated User Name');
      await deleteUserIfExists(page, updatedEmail);
    });

    test('admin can update user password', async ({ page }) => {
      const user = await createUserViaUI(page);
      await openEditFormForUser(page, user.email);
      await page.fill('#password', 'NewPassword123!@#');
      await page.fill('#password_confirmation', 'NewPassword123!@#');
      const passwordRedirect = page.waitForResponse((response) => {
        if (response.request().method() !== 'GET') {
          return false;
        }

        try {
          const url = new URL(response.url());
          const isUsersPath = url.pathname === '/users';
          const isSuccessful = response.status() >= 200 && response.status() < 400;
          return isUsersPath && isSuccessful;
        } catch {
          return false;
        }
      });
      await page.click('button[type="submit"]');
      await passwordRedirect;
      await expect(page).toHaveURL(/\/users(\?.*)?$/, { timeout: 45000 });
      await deleteUserIfExists(page, user.email);
    });
  });

  test.describe('User Deletion', () => {
    test('admin can delete user', async ({ page }) => {
      const user = await createUserViaUI(page);
      const deleted = await deleteUserIfExists(page, user.email);
      expect(deleted).toBe(true);
    });

    test('admin cannot delete themselves', async ({ page }) => {
      await navigateToUsers(page);
      const adminRow = page.locator('table tbody tr').filter({ hasText: adminCredentials.email });

      if ((await adminRow.count()) === 0) {
        return;
      }

      const deleteButton = adminRow.first().getByRole('button');
      if (!(await deleteButton.isVisible())) {
        return;
      }

      await deleteButton.click();
      const dialog = page.getByRole('dialog', { name: /Delete User/i });
      await expect(dialog).toBeVisible();

      const deleteAttempt = page.waitForResponse((response) => {
        return response.request().method() === 'DELETE'
          && response.url().includes('/users/')
          && response.status() >= 200
          && response.status() < 400;
      });

      await Promise.all([
        deleteAttempt,
        dialog.getByRole('button', { name: /^Delete/i }).click(),
      ]);
      await expect(dialog).toBeVisible();
      await expect(page.locator('table tbody tr').filter({ hasText: adminCredentials.email })).toHaveCount(1);

      const cancelButton = dialog.getByRole('button', { name: /^Cancel$/i });
      await cancelButton.click();
      await expect(dialog).toBeHidden();
    });
  });

  test.describe('Permission-based Access Control', () => {
    test('regular user can view users but cannot create', async ({ page }) => {
      const auth = new AuthHelper(page);
      await auth.logout();
      await auth.loginAsUser();

      await navigateToUsers(page);
      await expect(page.locator('table')).toBeVisible();
      await expect(page.getByRole('link', { name: /Add User/i })).toHaveCount(0);
    });

    test('unauthenticated user is redirected to login', async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto('/users');
      await expect(page).toHaveURL(/\/login/);
      await context.close();
    });
  });

  test.describe('Form Validation', () => {
    test('form shows validation errors for invalid data', async ({ page }) => {
      await openAddUserForm(page);
      await page.fill('#name', 'Invalid User');
      await page.fill('#email', 'invalid-email');
      await page.fill('#password', '123');
      await page.fill('#password_confirmation', '456');
      await selectRole(page, 'user');
      await page.click('button[type="submit"]');

      await expect(page.getByText('Please enter a valid email address')).toBeVisible();
      await expect(page.getByText('Passwords do not match')).toBeVisible();
      await expect(page.getByText('Password must be at least 8 characters')).toBeVisible();
    });
  });

  test.describe('Navigation and UI', () => {
    test('user management navigation works correctly', async ({ page }) => {
      await page.goto('/dashboard');
      const usersLink = page.getByRole('link', { name: /^Users$/i }).first();

      if (await usersLink.isVisible()) {
        await usersLink.click();
      } else {
        await page.goto('/users');
      }

      await expect(page).toHaveURL('/users');
      await expect(page.getByRole('heading', { name: /User Management/i })).toBeVisible();
    });

    test('breadcrumb navigation works', async ({ page }) => {
      await navigateToUsers(page);
      const breadcrumb = page.getByRole('navigation', { name: /breadcrumb/i });

      if (await breadcrumb.isVisible()) {
        await expect(breadcrumb).toContainText(/Users|User Management/);
      }
    });

    test('pagination works if implemented', async ({ page }) => {
      await navigateToUsers(page);
      const paginationNav = page.getByRole('navigation', { name: /Pagination/i });

      if (await paginationNav.isVisible()) {
        await expect(paginationNav).toContainText(/Previous|Next/);
        const nextLink = paginationNav.getByRole('link', { name: /^Next$/i }).first();
        if (await nextLink.count() && await nextLink.isVisible()) {
          const href = await nextLink.getAttribute('href');
          await Promise.all([
            page.waitForURL(href ?? /\/users\?page=2/, { waitUntil: 'commit' }),
            nextLink.click(),
          ]);
          await page.waitForLoadState('networkidle').catch(() => undefined);
        } else {
          const pageTwoLink = paginationNav.getByRole('link', { name: /^2$/ }).first();
          if (await pageTwoLink.count() && await pageTwoLink.isVisible()) {
            const href = await pageTwoLink.getAttribute('href');
            await Promise.all([
              page.waitForURL(href ?? /\/users\?page=2/, { waitUntil: 'commit' }),
              pageTwoLink.click(),
            ]);
            await page.waitForLoadState('networkidle').catch(() => undefined);
          }
        }
      }
    });
  });
});











