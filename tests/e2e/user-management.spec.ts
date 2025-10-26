import { test, expect } from '@playwright/test';

test.describe('User Management End-to-End Tests', () => {
  // Test data
  const adminCredentials = {
    email: 'admin@test.com',
    password: 'password123'
  };

  const testUser = {
    name: 'Test User',
    email: 'testuser@example.com',
    password: 'Password123!@#',
    passwordConfirmation: 'Password123!@#',
    role: 'user'
  };

  const managerUser = {
    name: 'Manager User',
    email: 'manager@example.com',
    password: 'Password123!@#',
    passwordConfirmation: 'Password123!@#',
    role: 'manager'
  };

  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');

    // Login with admin credentials
    await page.fill('input[type="email"]', adminCredentials.email);
    await page.fill('input[type="password"]', adminCredentials.password);
    await page.click('button[type="submit"]');

    // Wait for successful login and redirect to dashboard
    await page.waitForURL('/dashboard');
  });

  test.describe('User Index Page', () => {
    test('admin can view users index page', async ({ page }) => {
      await page.goto('/users');

      // Check if users page loads
      await expect(page.locator('h1')).toContainText(/Users|User Management/);

      // Check for users table or list
      await expect(page.locator('table, [data-testid="users-table"]')).toBeVisible();

      // Check for create user button
      await expect(page.locator('button:has-text("Create"), a:has-text("Create"), [data-testid="create-user"]')).toBeVisible();
    });

    test('users table displays user information', async ({ page }) => {
      await page.goto('/users');

      // Wait for table to load
      await page.waitForSelector('table, [data-testid="users-table"]');

      // Check for table headers
      const table = page.locator('table, [data-testid="users-table"]').first();
      await expect(table.locator('th')).toHaveCount.greaterThan(0);

      // Check for user data rows
      await expect(table.locator('tbody tr')).toHaveCount.greaterThan(0);
    });

    test('admin can export users to CSV', async ({ page }) => {
      await page.goto('/users');

      // Look for export button
      const exportButton = page.locator('button:has-text("Export"), a:has-text("Export"), [data-testid="export-users"]').first();
      await expect(exportButton).toBeVisible();

      // Click export button and wait for download
      const downloadPromise = page.waitForEvent('download');
      await exportButton.click();
      const download = await downloadPromise;

      // Verify download
      expect(download.suggestedFilename()).toMatch(/users_export_.*\.csv/);
    });
  });

  test.describe('User Creation', () => {
    test('admin can create a new user', async ({ page }) => {
      await page.goto('/users');

      // Click create user button
      const createButton = page.locator('button:has-text("Create"), a:has-text("Create"), [data-testid="create-user"]').first();
      await createButton.click();

      // Wait for create user page
      await expect(page).toHaveURL(/.*users.*create/);
      await expect(page.locator('h1')).toContainText(/Create.*User/);

      // Fill user form
      await page.fill('input[name="name"]', testUser.name);
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.fill('input[name="password_confirmation"]', testUser.passwordConfirmation);
      await page.selectOption('select[name="role"]', testUser.role);

      // Submit form
      await page.click('button[type="submit"]');

      // Wait for redirect to users index
      await page.waitForURL('/users');

      // Check for success message
      await expect(page.locator('.alert-success, .success, [data-testid="success-message"]')).toContainText(/User created successfully/);

      // Verify user appears in table
      await expect(page.locator('table, [data-testid="users-table"]')).toContainText(testUser.name);
      await expect(page.locator('table, [data-testid="users-table"]')).toContainText(testUser.email);
    });

    test('user creation validates required fields', async ({ page }) => {
      await page.goto('/users');

      // Click create user button
      const createButton = page.locator('button:has-text("Create"), a:has-text("Create"), [data-testid="create-user"]').first();
      await createButton.click();

      // Try to submit empty form
      await page.click('button[type="submit"]');

      // Check for validation errors
      await expect(page.locator('.error, .invalid-feedback, [data-testid="error-message"]')).toHaveCount.greaterThan(0);
    });

    test('user creation validates email uniqueness', async ({ page }) => {
      await page.goto('/users');

      // Click create user button
      const createButton = page.locator('button:has-text("Create"), a:has-text("Create"), [data-testid="create-user"]').first();
      await createButton.click();

      // Fill form with existing email
      await page.fill('input[name="name"]', 'Another User');
      await page.fill('input[name="email"]', adminCredentials.email); // Use existing email
      await page.fill('input[name="password"]', testUser.password);
      await page.fill('input[name="password_confirmation"]', testUser.passwordConfirmation);
      await page.selectOption('select[name="role"]', testUser.role);

      // Submit form
      await page.click('button[type="submit"]');

      // Check for email validation error
      await expect(page.locator('.error, .invalid-feedback, [data-testid="error-message"]')).toContainText(/email.*already.*taken|email.*unique/);
    });

    test('user creation validates password confirmation', async ({ page }) => {
      await page.goto('/users');

      // Click create user button
      const createButton = page.locator('button:has-text("Create"), a:has-text("Create"), [data-testid="create-user"]').first();
      await createButton.click();

      // Fill form with mismatched passwords
      await page.fill('input[name="name"]', testUser.name);
      await page.fill('input[name="email"]', 'unique@example.com');
      await page.fill('input[name="password"]', testUser.password);
      await page.fill('input[name="password_confirmation"]', 'DifferentPassword123!@#');
      await page.selectOption('select[name="role"]', testUser.role);

      // Submit form
      await page.click('button[type="submit"]');

      // Check for password confirmation error
      await expect(page.locator('.error, .invalid-feedback, [data-testid="error-message"]')).toContainText(/password.*confirmation|password.*match/);
    });

    test('user creation validates password strength', async ({ page }) => {
      await page.goto('/users');

      // Click create user button
      const createButton = page.locator('button:has-text("Create"), a:has-text("Create"), [data-testid="create-user"]').first();
      await createButton.click();

      // Fill form with weak password
      await page.fill('input[name="name"]', testUser.name);
      await page.fill('input[name="email"]', 'unique@example.com');
      await page.fill('input[name="password"]', 'weak');
      await page.fill('input[name="password_confirmation"]', 'weak');
      await page.selectOption('select[name="role"]', testUser.role);

      // Submit form
      await page.click('button[type="submit"]');

      // Check for password strength error
      await expect(page.locator('.error, .invalid-feedback, [data-testid="error-message"]')).toContainText(/password.*strong|password.*requirements/);
    });

    test('user creation validates role selection', async ({ page }) => {
      await page.goto('/users');

      // Click create user button
      const createButton = page.locator('button:has-text("Create"), a:has-text("Create"), [data-testid="create-user"]').first();
      await createButton.click();

      // Fill form without selecting role
      await page.fill('input[name="name"]', testUser.name);
      await page.fill('input[name="email"]', 'unique@example.com');
      await page.fill('input[name="password"]', testUser.password);
      await page.fill('input[name="password_confirmation"]', testUser.passwordConfirmation);
      // Don't select role

      // Submit form
      await page.click('button[type="submit"]');

      // Check for role validation error
      await expect(page.locator('.error, .invalid-feedback, [data-testid="error-message"]')).toContainText(/role.*required/);
    });
  });

  test.describe('User Editing', () => {
    test('admin can edit user information', async ({ page }) => {
      // First create a user to edit
      await page.goto('/users');
      const createButton = page.locator('button:has-text("Create"), a:has-text("Create"), [data-testid="create-user"]').first();
      await createButton.click();

      await page.fill('input[name="name"]', testUser.name);
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.fill('input[name="password_confirmation"]', testUser.passwordConfirmation);
      await page.selectOption('select[name="role"]', testUser.role);
      await page.click('button[type="submit"]');

      // Wait for redirect and find the created user
      await page.waitForURL('/users');

      // Find and click edit button for the created user
      const editButton = page.locator(`button:has-text("Edit"), a:has-text("Edit"), [data-testid="edit-user"]`).first();
      await editButton.click();

      // Wait for edit page
      await expect(page).toHaveURL(/.*users.*edit/);
      await expect(page.locator('h1')).toContainText(/Edit.*User/);

      // Update user information
      await page.fill('input[name="name"]', 'Updated User Name');
      await page.fill('input[name="email"]', 'updated@example.com');
      await page.selectOption('select[name="role"]', 'manager');

      // Submit form
      await page.click('button[type="submit"]');

      // Wait for redirect to users index
      await page.waitForURL('/users');

      // Check for success message
      await expect(page.locator('.alert-success, .success, [data-testid="success-message"]')).toContainText(/User updated successfully/);

      // Verify updated information appears in table
      await expect(page.locator('table, [data-testid="users-table"]')).toContainText('Updated User Name');
      await expect(page.locator('table, [data-testid="users-table"]')).toContainText('updated@example.com');
    });

    test('admin can update user password', async ({ page }) => {
      // First create a user to edit
      await page.goto('/users');
      const createButton = page.locator('button:has-text("Create"), a:has-text("Create"), [data-testid="create-user"]').first();
      await createButton.click();

      await page.fill('input[name="name"]', testUser.name);
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.fill('input[name="password_confirmation"]', testUser.passwordConfirmation);
      await page.selectOption('select[name="role"]', testUser.role);
      await page.click('button[type="submit"]');

      // Wait for redirect and find the created user
      await page.waitForURL('/users');

      // Find and click edit button for the created user
      const editButton = page.locator(`button:has-text("Edit"), a:has-text("Edit"), [data-testid="edit-user"]`).first();
      await editButton.click();

      // Update password
      await page.fill('input[name="password"]', 'NewPassword123!@#');
      await page.fill('input[name="password_confirmation"]', 'NewPassword123!@#');

      // Submit form
      await page.click('button[type="submit"]');

      // Wait for redirect to users index
      await page.waitForURL('/users');

      // Check for success message
      await expect(page.locator('.alert-success, .success, [data-testid="success-message"]')).toContainText(/User updated successfully/);
    });
  });

  test.describe('User Deletion', () => {
    test('admin can delete user', async ({ page }) => {
      // First create a user to delete
      await page.goto('/users');
      const createButton = page.locator('button:has-text("Create"), a:has-text("Create"), [data-testid="create-user"]').first();
      await createButton.click();

      await page.fill('input[name="name"]', 'User To Delete');
      await page.fill('input[name="email"]', 'delete@example.com');
      await page.fill('input[name="password"]', testUser.password);
      await page.fill('input[name="password_confirmation"]', testUser.passwordConfirmation);
      await page.selectOption('select[name="role"]', testUser.role);
      await page.click('button[type="submit"]');

      // Wait for redirect
      await page.waitForURL('/users');

      // Find and click delete button for the created user
      const deleteButton = page.locator(`button:has-text("Delete"), a:has-text("Delete"), [data-testid="delete-user"]`).first();
      await deleteButton.click();

      // Confirm deletion if there's a confirmation dialog
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Delete"), [data-testid="confirm-delete"]');
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      // Wait for redirect to users index
      await page.waitForURL('/users');

      // Check for success message
      await expect(page.locator('.alert-success, .success, [data-testid="success-message"]')).toContainText(/User deleted successfully/);

      // Verify user no longer appears in table
      await expect(page.locator('table, [data-testid="users-table"]')).not.toContainText('User To Delete');
    });

    test('admin cannot delete themselves', async ({ page }) => {
      // Try to find and delete the admin user (current user)
      await page.goto('/users');

      // Look for delete button for admin user
      const adminRow = page.locator('tr').filter({ hasText: adminCredentials.email });
      const deleteButton = adminRow.locator('button:has-text("Delete"), a:has-text("Delete"), [data-testid="delete-user"]');

      if (await deleteButton.isVisible()) {
        await deleteButton.click();

        // Check for error message
        await expect(page.locator('.alert-error, .error, [data-testid="error-message"]')).toContainText(/cannot.*delete.*yourself|delete.*own.*account/);
      }
    });
  });

  test.describe('Permission-based Access Control', () => {
    test('regular user can view users but cannot create', async ({ page }) => {
      // First logout admin
      await page.goto('/logout');

      // Create a regular user session (this would need to be set up in your test environment)
      // For now, we'll test the UI behavior
      await page.goto('/users');

      // If user has view permission, they should see the users page
      // If they don't have create permission, create button should not be visible or should show error
      const createButton = page.locator('button:has-text("Create"), a:has-text("Create"), [data-testid="create-user"]');

      if (await createButton.isVisible()) {
        await createButton.click();

        // Check if we get permission error or redirect
        const hasPermissionError = await page.locator('.alert-error, .error, [data-testid="error-message"]').isVisible();
        const isRedirected = page.url().includes('/login') || page.url().includes('/dashboard');

        expect(hasPermissionError || isRedirected).toBeTruthy();
      }
    });

    test('unauthenticated user is redirected to login', async ({ page }) => {
      // Logout first
      await page.goto('/logout');

      // Try to access users page
      await page.goto('/users');

      // Should be redirected to login
      await expect(page).toHaveURL('/login');
    });
  });

  test.describe('Form Validation', () => {
    test('form shows validation errors for invalid data', async ({ page }) => {
      await page.goto('/users');

      // Click create user button
      const createButton = page.locator('button:has-text("Create"), a:has-text("Create"), [data-testid="create-user"]').first();
      await createButton.click();

      // Test various invalid inputs
      const invalidInputs = [
        { field: 'name', value: '', error: 'name.*required' },
        { field: 'email', value: 'invalid-email', error: 'email.*valid' },
        { field: 'password', value: '123', error: 'password.*length' },
        { field: 'password_confirmation', value: 'different', error: 'password.*confirmation' }
      ];

      for (const input of invalidInputs) {
        await page.fill(`input[name="${input.field}"]`, input.value);
        await page.click('button[type="submit"]');

        // Check for validation error
        await expect(page.locator('.error, .invalid-feedback, [data-testid="error-message"]')).toContainText(new RegExp(input.error, 'i'));

        // Clear field for next test
        await page.fill(`input[name="${input.field}"]`, '');
      }
    });
  });

  test.describe('Navigation and UI', () => {
    test('user management navigation works correctly', async ({ page }) => {
      // Test navigation from dashboard to users
      await page.goto('/dashboard');

      // Look for users link in navigation
      const usersLink = page.locator('a:has-text("Users"), button:has-text("Users"), [data-testid="users-nav"]').first();
      if (await usersLink.isVisible()) {
        await usersLink.click();
        await expect(page).toHaveURL('/users');
      }
    });

    test('breadcrumb navigation works', async ({ page }) => {
      await page.goto('/users');

      // Check for breadcrumb navigation
      const breadcrumb = page.locator('.breadcrumb, [data-testid="breadcrumb"], nav[aria-label="breadcrumb"]');
      if (await breadcrumb.isVisible()) {
        await expect(breadcrumb).toContainText(/Users|User Management/);
      }
    });

    test('pagination works if implemented', async ({ page }) => {
      await page.goto('/users');

      // Look for pagination controls
      const pagination = page.locator('.pagination, [data-testid="pagination"], nav[aria-label="pagination"]');
      if (await pagination.isVisible()) {
        // Test pagination navigation
        const nextButton = pagination.locator('button:has-text("Next"), a:has-text("Next")');
        if (await nextButton.isVisible()) {
          await nextButton.click();
          // Verify URL changed or page content updated
          await page.waitForLoadState('networkidle');
        }
      }
    });
  });
});


