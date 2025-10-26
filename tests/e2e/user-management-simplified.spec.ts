import { test, expect } from '@playwright/test';
import { AuthHelper } from './helpers/auth-helper';
import { UserPageObject } from './helpers/user-page-object';

test.describe('User Management - Simplified E2E Tests', () => {
  let authHelper: AuthHelper;
  let userPage: UserPageObject;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    userPage = new UserPageObject(page);

    // Login as admin before each test
    await authHelper.loginAsAdmin();
  });

  test.describe('User CRUD Operations', () => {
    const testUser = {
      name: 'Test User',
      email: 'testuser@example.com',
      password: 'Password123!@#',
      passwordConfirmation: 'Password123!@#',
      role: 'user'
    };

    test('admin can create, read, update, and delete users', async ({ page }) => {
      // CREATE
      await userPage.createUser(testUser);
      await userPage.waitForSuccessMessage('User created successfully');

      // READ - Verify user appears in table
      const userRow = await userPage.getUserFromTable(testUser.email);
      await expect(userRow).toBeVisible();
      await expect(userRow).toContainText(testUser.name);
      await expect(userRow).toContainText(testUser.email);

      // UPDATE
      const updatedData = {
        name: 'Updated Test User',
        email: 'updated@example.com',
        role: 'manager'
      };

      await userPage.editUser(testUser.email, updatedData);
      await userPage.waitForSuccessMessage('User updated successfully');

      // Verify updated user appears in table
      const updatedRow = await userPage.getUserFromTable(updatedData.email);
      await expect(updatedRow).toBeVisible();
      await expect(updatedRow).toContainText(updatedData.name);

      // DELETE
      await userPage.deleteUser(updatedData.email);
      await userPage.waitForSuccessMessage('User deleted successfully');

      // Verify user no longer appears in table
      await expect(await userPage.getUserFromTable(updatedData.email)).not.toBeVisible();
    });

    test('admin can update user password', async ({ page }) => {
      // Create user first
      await userPage.createUser(testUser);
      await userPage.waitForSuccessMessage('User created successfully');

      // Update password
      const passwordUpdate = {
        password: 'NewPassword123!@#',
        passwordConfirmation: 'NewPassword123!@#'
      };

      await userPage.editUser(testUser.email, passwordUpdate);
      await userPage.waitForSuccessMessage('User updated successfully');
    });
  });

  test.describe('Form Validation', () => {
    test('validates required fields', async ({ page }) => {
      await userPage.navigateToCreateUser();

      // Try to submit empty form
      await userPage.submitForm();

      // Check for validation errors
      const errors = await userPage.getValidationErrors();
      expect(errors.length).toBeGreaterThan(0);
    });

    test('validates email format', async ({ page }) => {
      await userPage.navigateToCreateUser();

      await userPage.fillUserForm({
        name: 'Test User',
        email: 'invalid-email',
        password: 'Password123!@#',
        passwordConfirmation: 'Password123!@#',
        role: 'user'
      });

      await userPage.submitForm();

      // Check for email validation error
      const errors = await userPage.getValidationErrors();
      expect(errors.some(error => error.toLowerCase().includes('email'))).toBeTruthy();
    });

    test('validates password confirmation', async ({ page }) => {
      await userPage.navigateToCreateUser();

      await userPage.fillUserForm({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!@#',
        passwordConfirmation: 'DifferentPassword123!@#',
        role: 'user'
      });

      await userPage.submitForm();

      // Check for password confirmation error
      const errors = await userPage.getValidationErrors();
      expect(errors.some(error =>
        error.toLowerCase().includes('password') &&
        error.toLowerCase().includes('confirmation')
      )).toBeTruthy();
    });

    test('validates password strength', async ({ page }) => {
      await userPage.navigateToCreateUser();

      await userPage.fillUserForm({
        name: 'Test User',
        email: 'test@example.com',
        password: 'weak',
        passwordConfirmation: 'weak',
        role: 'user'
      });

      await userPage.submitForm();

      // Check for password strength error
      const errors = await userPage.getValidationErrors();
      expect(errors.some(error =>
        error.toLowerCase().includes('password') &&
        (error.toLowerCase().includes('strong') || error.toLowerCase().includes('requirements'))
      )).toBeTruthy();
    });
  });

  test.describe('Permission-based Access', () => {
    test('manager cannot delete users', async ({ page }) => {
      // Create a user first
      const testUser = {
        name: 'Test User',
        email: 'testuser@example.com',
        password: 'Password123!@#',
        passwordConfirmation: 'Password123!@#',
        role: 'user'
      };

      await userPage.createUser(testUser);
      await userPage.waitForSuccessMessage('User created successfully');

      // Logout admin and login as manager
      await authHelper.logout();
      await authHelper.loginAsManager();

      // Try to delete user
      await userPage.navigateToUsers();
      const userRow = await userPage.getUserFromTable(testUser.email);
      const deleteButton = userRow.locator('button:has-text("Delete"), a:has-text("Delete"), [data-testid="delete-user"]');

      if (await deleteButton.isVisible()) {
        await deleteButton.click();

        // Should show permission error or not allow deletion
        await expect(userPage.errorMessage).toBeVisible();
      }
    });

    test('regular user can view but not create users', async ({ page }) => {
      // Logout admin and login as regular user
      await authHelper.logout();
      await authHelper.loginAsUser();

      // Should be able to view users
      await userPage.navigateToUsers();
      await expect(userPage.usersTable).toBeVisible();

      // Should not be able to create users
      if (await userPage.createButton.isVisible()) {
        await userPage.createButton.click();

        // Should get permission error or redirect
        const hasError = await userPage.errorMessage.isVisible();
        const isRedirected = page.url().includes('/login') || page.url().includes('/dashboard');

        expect(hasError || isRedirected).toBeTruthy();
      }
    });
  });

  test.describe('Export Functionality', () => {
    test('admin can export users to CSV', async ({ page }) => {
      const download = await userPage.exportUsers();

      // Verify download
      expect(download.suggestedFilename()).toMatch(/users_export_.*\.csv/);
    });
  });

  test.describe('Navigation and UI', () => {
    test('user management page loads correctly', async ({ page }) => {
      await userPage.navigateToUsers();

      // Check page elements
      await expect(page.locator('h1')).toContainText(/Users|User Management/);
      await expect(userPage.usersTable).toBeVisible();
      await expect(userPage.createButton).toBeVisible();
      await expect(userPage.exportButton).toBeVisible();
    });

    test('create user page loads correctly', async ({ page }) => {
      await userPage.navigateToCreateUser();

      // Check form elements
      await expect(page.locator('h1')).toContainText(/Create.*User/);
      await expect(userPage.nameInput).toBeVisible();
      await expect(userPage.emailInput).toBeVisible();
      await expect(userPage.passwordInput).toBeVisible();
      await expect(userPage.passwordConfirmationInput).toBeVisible();
      await expect(userPage.roleSelect).toBeVisible();
      await expect(userPage.submitButton).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('handles duplicate email gracefully', async ({ page }) => {
      const testUser = {
        name: 'Test User',
        email: 'admin@test.com', // Use existing admin email
        password: 'Password123!@#',
        passwordConfirmation: 'Password123!@#',
        role: 'user'
      };

      await userPage.navigateToCreateUser();
      await userPage.fillUserForm(testUser);
      await userPage.submitForm();

      // Should show email uniqueness error
      await userPage.waitForErrorMessage();
      const errors = await userPage.getValidationErrors();
      expect(errors.some(error =>
        error.toLowerCase().includes('email') &&
        (error.toLowerCase().includes('taken') || error.toLowerCase().includes('unique'))
      )).toBeTruthy();
    });

    test('prevents admin from deleting themselves', async ({ page }) => {
      await userPage.navigateToUsers();

      // Try to find and delete admin user
      const adminRow = await userPage.getUserFromTable('admin@test.com');
      const deleteButton = adminRow.locator('button:has-text("Delete"), a:has-text("Delete"), [data-testid="delete-user"]');

      if (await deleteButton.isVisible()) {
        await deleteButton.click();

        // Should show error about not being able to delete yourself
        await userPage.waitForErrorMessage();
        const errors = await userPage.getValidationErrors();
        expect(errors.some(error =>
          error.toLowerCase().includes('delete') &&
          error.toLowerCase().includes('yourself')
        )).toBeTruthy();
      }
    });
  });
});


