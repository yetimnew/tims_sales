import { Page } from '@playwright/test';

export class AuthHelper {
  constructor(private page: Page) {}

  async loginAsAdmin() {
    await this.page.goto('/login');
    await this.page.fill('input[type="email"]', 'admin@test.com');
    await this.page.fill('input[type="password"]', 'password123');
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL('/dashboard');
  }

  async loginAsManager() {
    await this.page.goto('/login');
    await this.page.fill('input[type="email"]', 'manager@test.com');
    await this.page.fill('input[type="password"]', 'password123');
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL('/dashboard');
  }

  async loginAsUser() {
    await this.page.goto('/login');
    await this.page.fill('input[type="email"]', 'user@test.com');
    await this.page.fill('input[type="password"]', 'password123');
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL('/dashboard');
  }

  async logout() {
    await this.page.goto('/logout');
    await this.page.waitForURL('/login');
  }

  async waitForSuccessMessage() {
    await this.page.waitForSelector('.alert-success, .success, [data-testid="success-message"]');
  }

  async waitForErrorMessage() {
    await this.page.waitForSelector('.alert-error, .error, [data-testid="error-message"]');
  }
}










