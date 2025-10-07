/**
 * Test data and configurations for E2E tests
 */

export const testUrls = {
  frontend: 'http://localhost:5173',
  backend: 'http://localhost:3001',
  fingerbankDoc: 'https://api.fingerbank.org/api_doc/2.html',
  fingerbankProduct: 'http://demo.fingerbank.org',
};

export const testCredentials = {
  // These are test credentials - should match .env.local
  fingerbankApiKey: process.env.TEST_FINGERBANK_KEY || 'e353fdc19c9c45aa02d1d0ff618310afaa0d180c',
  claudeApiKey: process.env.TEST_CLAUDE_KEY || '', // Should be provided via env
};

export const testTimeouts = {
  short: 5000,
  medium: 15000,
  long: 30000,
  veryLong: 60000,
};

export const testSelectors = {
  // Upload Step
  urlInput: 'input[label*="Documentation URL"]',
  fetchButton: 'button:has-text("Fetch")',
  uploadArea: '[role="button"]',
  
  // Configuration Step
  claudeKeyInput: 'input[label*="Claude API Key"]',
  testApiKeyInput: 'input[label*="Test API Key"]',
  baseUrlInput: 'input[label*="API Base URL"]',
  productUrlInput: 'input[label*="Product URL"]',
  continueButton: 'button:has-text("Continue")',
  backButton: 'button:has-text("Back")',
  
  // Processing Step
  progressBar: '[role="progressbar"]',
  validationList: '[role="list"]',
  
  // Review Step
  endpointTable: 'table',
  generateButton: 'button:has-text("Generate Documentation")',
  
  // Generate Step
  downloadButton: 'button:has-text("Download")',
  previewButton: 'button:has-text("Preview")',
  chatButton: 'button:has-text("Improve with AI")',
  
  // Common
  alert: '[role="alert"]',
  stepper: '[class*="MuiStepper"]',
  stepLabel: '[class*="MuiStepLabel"]',
};