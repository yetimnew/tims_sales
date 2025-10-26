// Test configuration and constants
export const TEST_CONFIG = {
  // Base URLs
  BASE_URL: 'http://localhost:8000',
  LOGIN_URL: '/login',
  DASHBOARD_URL: '/dashboard',
  USERS_URL: '/users',

  // Test credentials
  CREDENTIALS: {
    ADMIN: {
      email: 'admin@test.com',
      password: 'password123'
    },
    MANAGER: {
      email: 'manager@test.com',
      password: 'password123'
    },
    USER: {
      email: 'user@test.com',
      password: 'password123'
    }
  },

  // Test data
  TEST_USERS: {
    VALID_USER: {
      name: 'Test User',
      email: 'testuser@example.com',
      password: 'Password123!@#',
      passwordConfirmation: 'Password123!@#',
      role: 'user'
    },
    MANAGER_USER: {
      name: 'Manager User',
      email: 'manageruser@example.com',
      password: 'Password123!@#',
      passwordConfirmation: 'Password123!@#',
      role: 'manager'
    },
    INVALID_USER: {
      name: '',
      email: 'invalid-email',
      password: 'weak',
      passwordConfirmation: 'different',
      role: 'invalid'
    }
  },

  // Selectors
  SELECTORS: {
    LOGIN: {
      EMAIL_INPUT: 'input[type="email"]',
      PASSWORD_INPUT: 'input[type="password"]',
      SUBMIT_BUTTON: 'button[type="submit"]'
    },
    USERS: {
      TABLE: 'table, [data-testid="users-table"]',
      CREATE_BUTTON: 'button:has-text("Create"), a:has-text("Create"), [data-testid="create-user"]',
      EXPORT_BUTTON: 'button:has-text("Export"), a:has-text("Export"), [data-testid="export-users"]',
      EDIT_BUTTON: 'button:has-text("Edit"), a:has-text("Edit"), [data-testid="edit-user"]',
      DELETE_BUTTON: 'button:has-text("Delete"), a:has-text("Delete"), [data-testid="delete-user"]'
    },
    FORMS: {
      NAME_INPUT: 'input[name="name"]',
      EMAIL_INPUT: 'input[name="email"]',
      PASSWORD_INPUT: 'input[name="password"]',
      PASSWORD_CONFIRMATION_INPUT: 'input[name="password_confirmation"]',
      ROLE_SELECT: 'select[name="role"]',
      SUBMIT_BUTTON: 'button[type="submit"]'
    },
    MESSAGES: {
      SUCCESS: '.alert-success, .success, [data-testid="success-message"]',
      ERROR: '.error, .invalid-feedback, [data-testid="error-message"]'
    }
  },

  // Timeouts
  TIMEOUTS: {
    DEFAULT: 30000,
    NAVIGATION: 10000,
    FORM_SUBMIT: 5000
  },

  // Expected messages
  MESSAGES: {
    SUCCESS: {
      USER_CREATED: 'User created successfully',
      USER_UPDATED: 'User updated successfully',
      USER_DELETED: 'User deleted successfully'
    },
    ERROR: {
      EMAIL_TAKEN: 'email.*already.*taken|email.*unique',
      PASSWORD_CONFIRMATION: 'password.*confirmation|password.*match',
      PASSWORD_STRENGTH: 'password.*strong|password.*requirements',
      ROLE_REQUIRED: 'role.*required',
      CANNOT_DELETE_SELF: 'cannot.*delete.*yourself|delete.*own.*account'
    }
  }
};

// Helper functions
export const waitForNavigation = async (page: any, url: string) => {
  await page.waitForURL(url);
};

export const waitForElement = async (page: any, selector: string, timeout = 30000) => {
  await page.waitForSelector(selector, { timeout });
};

export const fillForm = async (page: any, formData: Record<string, string>) => {
  for (const [field, value] of Object.entries(formData)) {
    const selector = `input[name="${field}"], select[name="${field}"]`;
    await page.fill(selector, value);
  }
};

export const expectSuccessMessage = async (page: any, message?: string) => {
  const successSelector = TEST_CONFIG.SELECTORS.MESSAGES.SUCCESS;
  await page.waitForSelector(successSelector);

  if (message) {
    const successElement = page.locator(successSelector);
    await expect(successElement).toContainText(message);
  }
};

export const expectErrorMessage = async (page: any, message?: string) => {
  const errorSelector = TEST_CONFIG.SELECTORS.MESSAGES.ERROR;
  await page.waitForSelector(errorSelector);

  if (message) {
    const errorElement = page.locator(errorSelector);
    await expect(errorElement).toContainText(new RegExp(message, 'i'));
  }
};


