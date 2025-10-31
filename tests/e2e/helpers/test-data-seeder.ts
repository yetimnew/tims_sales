import { Page } from '@playwright/test';

export class TestDataSeeder {
  constructor(private page: Page) {}

  async seedTestUsers() {
    // This would typically make API calls or use database seeding
    // For now, we'll create users through the UI
    const testUsers = [
      {
        name: 'Manager User',
        email: 'manager@test.com',
        password: 'password123',
        passwordConfirmation: 'password123',
        role: 'manager'
      },
      {
        name: 'Regular User',
        email: 'user@test.com',
        password: 'password123',
        passwordConfirmation: 'password123',
        role: 'user'
      }
    ];

    // Login as admin
    await this.page.goto('/login');
    await this.page.fill('input[type="email"]', 'admin@test.com');
    await this.page.fill('input[type="password"]', 'password123');
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL('/dashboard');

    // Create test users
    for (const user of testUsers) {
      await this.createUser(user);
    }
  }

  private async createUser(userData: {
    name: string;
    email: string;
    password: string;
    passwordConfirmation: string;
    role: string;
  }) {
    await this.page.goto('/users');

    // Click create user button
    const createButton = this.page.locator('button:has-text("Create"), a:has-text("Create"), [data-testid="create-user"]').first();
    await createButton.click();

    // Fill form
    await this.page.fill('input[name="name"]', userData.name);
    await this.page.fill('input[name="email"]', userData.email);
    await this.page.fill('input[name="password"]', userData.password);
    await this.page.fill('input[name="password_confirmation"]', userData.passwordConfirmation);
    await this.page.selectOption('select[name="role"]', userData.role);

    // Submit form
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL('/users');
  }

  async cleanupTestUsers() {
    // This would clean up test data
    // For now, we'll just logout
    await this.page.goto('/logout');
  }
}










