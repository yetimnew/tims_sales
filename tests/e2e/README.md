# Playwright End-to-End Testing

This directory contains end-to-end tests for the TIMS (Transport Information Management System) using Playwright.

## Setup

Playwright is already installed and configured. The browsers have been downloaded and are ready to use.

## Running Tests

### Basic Commands

```bash
# Run all e2e tests
npm run test:e2e

# Run tests with UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Run tests in debug mode
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

### Advanced Commands

```bash
# Run specific test file
npx playwright test example.spec.ts

# Run user management tests only
npx playwright test user-management.spec.ts
npx playwright test user-management-simplified.spec.ts

# Run tests for specific browser
npx playwright test --project=chromium

# Run tests in parallel
npx playwright test --workers=4

# Run tests with specific timeout
npx playwright test --timeout=60000
```

## Test Structure

- `example.spec.ts` - Basic example tests for homepage and login
- `tims-system.spec.ts` - Comprehensive tests for TIMS system functionality
- `user-management.spec.ts` - Detailed user management tests based on existing PHP tests
- `user-management-simplified.spec.ts` - Simplified user management tests using page object pattern

## User Management Tests

The user management tests are based on your existing PHP test suite and cover:

### CRUD Operations
- ✅ User creation with role assignment
- ✅ User reading/listing with table display
- ✅ User updating (name, email, role, password)
- ✅ User deletion with confirmation

### Form Validation
- ✅ Required field validation
- ✅ Email format validation
- ✅ Email uniqueness validation
- ✅ Password strength validation
- ✅ Password confirmation validation
- ✅ Role selection validation

### Permission-based Access Control
- ✅ Admin: Full CRUD access
- ✅ Manager: No delete permissions
- ✅ User: View and export only
- ✅ Unauthenticated: Redirected to login

### Error Handling
- ✅ Duplicate email handling
- ✅ Self-deletion prevention
- ✅ Permission-based error messages
- ✅ Form validation error display

### Additional Features
- ✅ CSV export functionality
- ✅ Navigation and breadcrumbs
- ✅ Pagination (if implemented)
- ✅ Success/error message display

## Configuration

The Playwright configuration is in `playwright.config.ts` at the project root. Key settings:

- **Base URL**: `http://localhost:8000` (Laravel development server)
- **Test Directory**: `./tests/e2e`
- **Browsers**: Chromium, Firefox, Webkit, Mobile Chrome, Mobile Safari
- **Auto-start Server**: Laravel server starts automatically before tests
- **Screenshots**: Taken on failure
- **Videos**: Recorded on failure
- **Traces**: Collected on retry

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';

test('test name', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText('Expected Text');
});
```

### Common Patterns

```typescript
// Login before each test
test.beforeEach(async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'admin@example.com');
  await page.fill('input[type="password"]', 'password');
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
});

// Wait for elements
await page.waitForSelector('selector');
await page.waitForLoadState('networkidle');

// Fill forms
await page.fill('input[name="name"]', 'John Doe');
await page.selectOption('select[name="role"]', 'admin');

// Click buttons
await page.click('button:has-text("Save")');
await page.click('[data-testid="submit-button"]');

// Assertions
await expect(page.locator('h1')).toHaveText('Dashboard');
await expect(page).toHaveURL('/dashboard');
await expect(page.locator('.error')).not.toBeVisible();
```

## Best Practices

1. **Use data-testid attributes** for reliable element selection
2. **Wait for network requests** to complete before assertions
3. **Use page object model** for complex applications
4. **Group related tests** in describe blocks
5. **Use beforeEach/afterEach** for setup/cleanup
6. **Test user workflows** end-to-end, not just individual components

## Debugging

### Debug Mode
```bash
npm run test:e2e:debug
```

### Trace Viewer
```bash
npx playwright show-trace trace.zip
```

### Screenshots and Videos
- Screenshots are automatically saved on failure
- Videos are recorded for failed tests
- Both are saved in `test-results/` directory

## CI/CD Integration

For GitHub Actions or other CI systems:

```yaml
- name: Install Playwright Browsers
  run: npx playwright install --with-deps

- name: Run Playwright tests
  run: npm run test:e2e
```

## Troubleshooting

### Common Issues

1. **Server not starting**: Ensure Laravel server is configured correctly
2. **Timeout errors**: Increase timeout in config or use `page.waitForLoadState()`
3. **Element not found**: Use `page.waitForSelector()` or check selectors
4. **Login issues**: Verify test credentials and login flow

### Useful Commands

```bash
# Generate test code from browser actions
npx playwright codegen localhost:8000

# Show all available commands
npx playwright --help

# Update browsers
npx playwright install
```
