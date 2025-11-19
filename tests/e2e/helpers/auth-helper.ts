import { Page } from '@playwright/test';

export class AuthHelper {
  constructor(private page: Page) {}

  async loginAsAdmin() {
    await this.page.goto('/login');
    await this.page.fill('input[type="email"]', 'admin@test.com');
    await this.page.fill('input[type="password"]', 'password123');
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL('/dashboard', { timeout: 45000 });
  }

  async loginAsManager() {
    await this.page.goto('/login');
    await this.page.fill('input[type="email"]', 'manager@test.com');
    await this.page.fill('input[type="password"]', 'password123');
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL('/dashboard', { timeout: 45000 });
  }

  async loginAsUser() {
    await this.page.goto('/login');
    await this.page.fill('input[type="email"]', 'user@test.com');
    await this.page.fill('input[type="password"]', 'password123');
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL('/dashboard', { timeout: 45000 });
  }

  async logout() {
    await this.page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

    const menuTrigger = this.page.locator('button[aria-haspopup="menu"]').last();
    await menuTrigger.waitFor({ state: 'visible', timeout: 10000 });
    await menuTrigger.click();

    const logoutButton = this.page.locator('[data-test="logout-button"]');
    await logoutButton.waitFor({ state: 'visible', timeout: 10000 });
    await Promise.all([
      this.page.waitForURL((url) => {
        const target = typeof url === 'string' ? new URL(url) : url;
        return target.pathname === '/login' || target.pathname === '/';
      }, { timeout: 45000 }),
      logoutButton.click(),
    ]);
  }

  async waitForSuccessMessage() {
    await this.page.waitForSelector('.alert-success, .success, [data-testid="success-message"]');
  }

  async waitForErrorMessage() {
    await this.page.waitForSelector('.alert-error, .error, [data-testid="error-message"]');
  }
}











