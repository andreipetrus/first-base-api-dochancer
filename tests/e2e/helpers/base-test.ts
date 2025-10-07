import { test as base, expect } from '@playwright/test';
import { testUrls, testCredentials, testTimeouts } from '../fixtures/test-data';

/**
 * Custom test fixture with common utilities
 */
type TestFixtures = {
  appUrl: string;
  waitForApp: () => Promise<void>;
  fillTestCredentials: () => Promise<void>;
};

export const test = base.extend<TestFixtures>({
  appUrl: async ({}, use) => {
    await use(testUrls.frontend);
  },

  waitForApp: async ({ page }, use) => {
    const waitForApp = async () => {
      // Wait for the app to be fully loaded
      await page.goto(testUrls.frontend);
      await page.waitForLoadState('networkidle');
      
      // Wait for React to render
      await page.waitForSelector('h1:has-text("API DocHancer")', {
        timeout: testTimeouts.long,
      });
    };
    await use(waitForApp);
  },

  fillTestCredentials: async ({ page }, use) => {
    const fillTestCredentials = async () => {
      // Check if we have Claude API key from env
      const claudeKey = process.env.TEST_CLAUDE_KEY || testCredentials.claudeApiKey;
      
      if (!claudeKey) {
        console.warn('No Claude API key provided for tests');
      }

      // Fill in the test credentials
      if (claudeKey) {
        const claudeInput = page.locator('input[label*="Claude API Key"]');
        if (await claudeInput.isVisible()) {
          await claudeInput.fill(claudeKey);
        }
      }

      const testApiInput = page.locator('input[label*="Test API Key"]');
      if (await testApiInput.isVisible()) {
        await testApiInput.fill(testCredentials.fingerbankApiKey);
      }
    };
    await use(fillTestCredentials);
  },
});

export { expect };

/**
 * Helper to wait for stepper to reach a specific step
 */
export async function waitForStep(page: any, stepIndex: number) {
  await page.waitForSelector(
    `.MuiStepper-root .MuiStep-root:nth-child(${stepIndex + 1}).Mui-active`,
    { timeout: testTimeouts.medium }
  );
}

/**
 * Helper to wait for processing to complete
 */
export async function waitForProcessing(page: any) {
  // Wait for validation to start
  await page.waitForSelector('text=/validat/i', {
    timeout: testTimeouts.medium,
  });

  // Wait for processing to complete
  await page.waitForSelector('text=/complete/i', {
    timeout: testTimeouts.veryLong,
  });
}

/**
 * Helper to check for errors
 */
export async function checkForErrors(page: any) {
  const errorAlerts = await page.locator('[role="alert"][severity="error"]').count();
  if (errorAlerts > 0) {
    const errorText = await page.locator('[role="alert"][severity="error"]').first().textContent();
    throw new Error(`Error alert found: ${errorText}`);
  }
}

/**
 * Helper to take a labeled screenshot
 */
export async function takeScreenshot(page: any, name: string) {
  await page.screenshot({
    path: `test-results/screenshots/${name}.png`,
    fullPage: true,
  });
}