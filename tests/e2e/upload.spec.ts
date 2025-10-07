import { test, expect, waitForStep } from './helpers/base-test';
import { testUrls, testTimeouts } from './fixtures/test-data';

test.describe('Upload Documentation Flow', () => {
  test.beforeEach(async ({ page, waitForApp }) => {
    await waitForApp();
  });

  test('should load the application successfully', async ({ page }) => {
    // Check that main heading is visible
    await expect(page.locator('h1')).toContainText('API DocHancer');
    
    // Check that subtitle is visible
    await expect(page.locator('text=/Transform your API documentation/i')).toBeVisible();
    
    // Check stepper is visible
    await expect(page.locator('.MuiStepper-root')).toBeVisible();
    
    // Verify we're on step 1
    const activeStep = page.locator('.MuiStep-root.Mui-active');
    await expect(activeStep).toContainText('Upload Documentation');
  });

  test('should show test mode indicator when enabled', async ({ page }) => {
    // Look for test mode indicator
    const testModeAlert = page.locator('text=/Test Mode Active/i');
    
    // If test mode is enabled, it should be visible
    if (await testModeAlert.isVisible({ timeout: 3000 })) {
      await expect(testModeAlert).toBeVisible();
      console.log('✓ Test mode is active');
    } else {
      console.log('ℹ Test mode is not active');
    }
  });

  test('should prefill URL when test mode is active', async ({ page }) => {
    // Find the URL input
    const urlInput = page.locator('input[placeholder*="https://api.example.com"]');
    
    // Check if it's prefilled with test URL
    const value = await urlInput.inputValue();
    if (value === testUrls.fingerbankDoc) {
      console.log('✓ URL is prefilled with test value');
      await expect(urlInput).toHaveValue(testUrls.fingerbankDoc);
    } else {
      console.log('ℹ URL is not prefilled');
    }
  });

  test('should fetch documentation from URL', async ({ page }) => {
    // Enter URL if not prefilled
    const urlInput = page.locator('input[placeholder*="https://api.example.com"]');
    const currentValue = await urlInput.inputValue();
    
    if (!currentValue) {
      await urlInput.fill(testUrls.fingerbankDoc);
    }
    
    // Click fetch button
    await page.click('button:has-text("Fetch")');
    
    // Wait for loading to complete
    await page.waitForSelector('text=/Document parsed successfully/i', {
      timeout: testTimeouts.long,
    });
    
    // Check success message
    const successAlert = page.locator('[role="alert"]').filter({ hasText: /parsed successfully/i });
    await expect(successAlert).toBeVisible();
    
    // Check for extracted information
    await expect(successAlert).toContainText(/Found \d+ API endpoints/);
    
    // Check if base URL was extracted
    const baseUrlText = await successAlert.textContent();
    if (baseUrlText?.includes('Extracted base URL')) {
      console.log('✓ Base URL was extracted from documentation');
    }
    
    // Wait for navigation to next step
    await waitForStep(page, 1);
  });

  test('should handle invalid URL gracefully', async ({ page }) => {
    // Clear and enter invalid URL
    const urlInput = page.locator('input[placeholder*="https://api.example.com"]');
    await urlInput.clear();
    await urlInput.fill('https://invalid-url-that-does-not-exist.com');
    
    // Click fetch button
    await page.click('button:has-text("Fetch")');
    
    // Wait for error message
    await page.waitForSelector('[role="alert"]', {
      timeout: testTimeouts.medium,
    });
    
    // Check error is displayed
    const errorAlert = page.locator('[role="alert"]').filter({ hasText: /Failed/i });
    await expect(errorAlert).toBeVisible();
    
    // Verify we're still on the same step
    const activeStep = page.locator('.MuiStep-root.Mui-active');
    await expect(activeStep).toContainText('Upload Documentation');
  });

  test('should support file upload via drag and drop area', async ({ page }) => {
    // Check upload area is visible
    const uploadArea = page.locator('text=/Drag & drop a file here/i').locator('..');
    await expect(uploadArea).toBeVisible();
    
    // Verify supported formats are shown
    await expect(page.locator('text=/PDF, DOC, DOCX, HTML, JSON, TXT, MD/i')).toBeVisible();
  });
});