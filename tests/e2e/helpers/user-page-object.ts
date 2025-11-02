import { Page, Locator } from '@playwright/test';

export class UserPageObject {
  private page: Page;

  // Locators
  readonly usersTable: Locator;
  readonly createButton: Locator;
  readonly exportButton: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly passwordConfirmationInput: Locator;
  readonly roleSelect: Locator;
  readonly submitButton: Locator;
  readonly successMessage: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize locators
    this.usersTable = page.locator('table, [data-testid="users-table"]');
    this.createButton = page.locator('button:has-text("Create"), a:has-text("Create"), [data-testid="create-user"]').first();
    this.exportButton = page.locator('button:has-text("Export"), a:has-text("Export"), [data-testid="export-users"]').first();
    this.nameInput = page.locator('input[name="name"]');
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.passwordConfirmationInput = page.locator('input[name="password_confirmation"]');
    this.roleSelect = page.locator('select[name="role"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.successMessage = page.locator('.alert-success, .success, [data-testid="success-message"]');
    this.errorMessage = page.locator('.error, .invalid-feedback, [data-testid="error-message"]');
  }

  async navigateToUsers() {
    await this.page.goto('/users');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToCreateUser() {
    await this.navigateToUsers();
    await this.createButton.click();
    await this.page.waitForURL(/.*users.*create/);
  }

  async fillUserForm(userData: {
    name: string;
    email: string;
    password: string;
    passwordConfirmation: string;
    role: string;
  }) {
    await this.nameInput.fill(userData.name);
    await this.emailInput.fill(userData.email);
    await this.passwordInput.fill(userData.password);
    await this.passwordConfirmationInput.fill(userData.passwordConfirmation);
    await this.roleSelect.selectOption(userData.role);
  }

  async submitForm() {
    await this.submitButton.click();
  }

  async createUser(userData: {
    name: string;
    email: string;
    password: string;
    passwordConfirmation: string;
    role: string;
  }) {
    await this.navigateToCreateUser();
    await this.fillUserForm(userData);
    await this.submitForm();
    await this.page.waitForURL('/users');
  }

  async editUser(userEmail: string, updatedData: {
    name?: string;
    email?: string;
    password?: string;
    passwordConfirmation?: string;
    role?: string;
  }) {
    await this.navigateToUsers();

    // Find user row and click edit
    const userRow = this.page.locator('tr').filter({ hasText: userEmail });
    const editButton = userRow.locator('button:has-text("Edit"), a:has-text("Edit"), [data-testid="edit-user"]');
    await editButton.click();

    await this.page.waitForURL(/.*users.*edit/);

    // Update fields if provided
    if (updatedData.name) await this.nameInput.fill(updatedData.name);
    if (updatedData.email) await this.emailInput.fill(updatedData.email);
    if (updatedData.password) await this.passwordInput.fill(updatedData.password);
    if (updatedData.passwordConfirmation) await this.passwordConfirmationInput.fill(updatedData.passwordConfirmation);
    if (updatedData.role) await this.roleSelect.selectOption(updatedData.role);

    await this.submitForm();
    await this.page.waitForURL('/users');
  }

  async deleteUser(userEmail: string) {
    await this.navigateToUsers();

    // Find user row and click delete
    const userRow = this.page.locator('tr').filter({ hasText: userEmail });
    const deleteButton = userRow.locator('button:has-text("Delete"), a:has-text("Delete"), [data-testid="delete-user"]');
    await deleteButton.click();

    // Handle confirmation dialog if present
    const confirmButton = this.page.locator('button:has-text("Confirm"), button:has-text("Delete"), [data-testid="confirm-delete"]');
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    await this.page.waitForURL('/users');
  }

  async exportUsers() {
    await this.navigateToUsers();
    const downloadPromise = this.page.waitForEvent('download');
    await this.exportButton.click();
    return await downloadPromise;
  }

  async getUserFromTable(userEmail: string) {
    await this.navigateToUsers();
    return this.page.locator('tr').filter({ hasText: userEmail });
  }

  async waitForSuccessMessage(message?: string) {
    await this.successMessage.waitFor();
    if (message) {
      await this.successMessage.textContent().then(text =>
        expect(text).toContain(message)
      );
    }
  }

  async waitForErrorMessage(message?: string) {
    await this.errorMessage.waitFor();
    if (message) {
      await this.errorMessage.textContent().then(text =>
        expect(text).toContain(message)
      );
    }
  }

  async getValidationErrors() {
    return await this.errorMessage.allTextContents();
  }

  async clearForm() {
    await this.nameInput.clear();
    await this.emailInput.clear();
    await this.passwordInput.clear();
    await this.passwordConfirmationInput.clear();
  }
}











