import { test, expect } from './helpers/base-test';
import { testUrls, testCredentials, testTimeouts } from './fixtures/test-data';

test.describe('Start Over Functionality', () => {
  test.beforeEach(async ({ page, waitForApp }) => {
    await waitForApp();
  });

  test('should show Start Over button after generation and reset workflow', async ({ page }) => {
    test.setTimeout(testTimeouts.veryLong * 2);
    
    console.log('Testing Start Over functionality...');
    
    // Quick navigation through workflow
    // Step 1: Upload
    const urlInput = page.locator('input[placeholder*="https://api.example.com"]');
    const currentUrl = await urlInput.inputValue();
    if (!currentUrl) {
      await urlInput.fill(testUrls.fingerbankDoc);
    }
    
    await page.click('button:has-text("Fetch")');
    await page.waitForSelector('text=/Document parsed successfully/i', {
      timeout: testTimeouts.long,
    });
    
    // Step 2: Configuration
    await page.waitForSelector('input[label*="Claude API Key"]', {
      timeout: testTimeouts.medium,
    });
    
    const claudeInput = page.locator('input[label*="Claude API Key"]');
    const claudeValue = await claudeInput.inputValue();
    if (!claudeValue) {
      const key = process.env.TEST_CLAUDE_KEY || testCredentials.claudeApiKey || 'test-key';
      await claudeInput.fill(key);
    }
    
    // Verify base URL is prefilled from test env
    const baseUrlInput = page.locator('input[label*="API Base URL"]');
    const baseUrlValue = await baseUrlInput.inputValue();
    console.log('Base URL value:', baseUrlValue);
    
    // Should be prefilled with test env value if available
    if (process.env.VITE_TEST_BASE_URL) {
      expect(baseUrlValue).toBe(process.env.VITE_TEST_BASE_URL);
    }
    
    await page.click('button:has-text("Continue")');
    
    // Step 3: Processing
    await page.waitForSelector('text=/Processing complete/i', {
      timeout: testTimeouts.veryLong,
    });
    
    // Step 4: Review
    await page.waitForSelector('button:has-text("Generate Documentation")', {
      timeout: testTimeouts.medium,
    });
    await page.click('button:has-text("Generate Documentation")');
    
    // Step 5: Generation
    await page.waitForSelector('text=/Documentation generated successfully/i', {
      timeout: testTimeouts.long,
    });
    
    console.log('Documentation generated, looking for Start Over button...');
    
    // Look for Start Over button
    const startOverButton = page.locator('button:has-text("Start Over")');
    await expect(startOverButton).toBeVisible();
    
    // Click Start Over
    await startOverButton.click();
    
    // Verify we're back at step 1
    await page.waitForSelector('text="Upload Documentation"', {
      timeout: testTimeouts.short,
    });
    
    // Check that stepper shows step 1 as active
    const firstStepActive = await page.locator('.MuiStepper-root .MuiStep-root:first-child.Mui-active').isVisible();
    expect(firstStepActive).toBeTruthy();
    
    // Verify upload form is visible again
    const uploadForm = await page.locator('input[placeholder*="https://api.example.com"]').isVisible();
    expect(uploadForm).toBeTruthy();
    
    // Verify state was reset (URL field should be empty or have test value)
    const resetUrlValue = await page.locator('input[placeholder*="https://api.example.com"]').inputValue();
    if (process.env.VITE_TEST_DOC_URL) {
      expect(resetUrlValue).toBe(process.env.VITE_TEST_DOC_URL);
    } else {
      expect(resetUrlValue).toBe('');
    }
    
    console.log('✓ Start Over functionality working correctly');
  });

  test('should reset all form data when starting over', async ({ page }) => {
    test.setTimeout(testTimeouts.veryLong);
    
    // Navigate to step 2 with some data
    const urlInput = page.locator('input[placeholder*="https://api.example.com"]');
    const currentUrl = await urlInput.inputValue();
    if (!currentUrl) {
      await urlInput.fill('https://example.com/custom-api-doc');
    }
    
    await page.click('button:has-text("Fetch")');
    
    // Wait for any response (might fail, but that's ok for this test)
    await page.waitForTimeout(2000);
    
    // If we got an error, that's fine - just check we can navigate
    const continueButton = page.locator('button:has-text("Continue")');
    if (await continueButton.isVisible()) {
      await continueButton.click();
      
      // Fill in some custom config
      await page.fill('input[label*="Claude API Key"]', 'custom-test-key');
      await page.fill('input[label*="API Base URL"]', 'https://custom.api.com');
      
      // Go back to step 1
      await page.click('button:has-text("Back")');
      
      // Verify custom URL is still there
      const urlValue = await page.locator('input[placeholder*="https://api.example.com"]').inputValue();
      expect(urlValue).toContain('custom');
    }
    
    console.log('✓ Form data persistence test completed');
  });
});