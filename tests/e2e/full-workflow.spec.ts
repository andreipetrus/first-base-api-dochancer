import { test, expect, waitForStep, waitForProcessing, checkForErrors } from './helpers/base-test';
import { testUrls, testCredentials, testTimeouts } from './fixtures/test-data';

test.describe('Complete Documentation Generation Workflow', () => {
  test.beforeEach(async ({ page, waitForApp }) => {
    await waitForApp();
    console.log('Starting full workflow test...');
  });

  test('should complete full workflow from upload to generation', async ({ page }) => {
    test.setTimeout(testTimeouts.veryLong * 2); // Extended timeout for full workflow

    // Step 1: Upload Documentation
    console.log('Step 1: Uploading documentation...');
    
    const urlInput = page.locator('input[placeholder*="https://api.example.com"]');
    const currentUrl = await urlInput.inputValue();
    
    if (!currentUrl) {
      await urlInput.fill(testUrls.fingerbankDoc);
    }
    
    await page.click('button:has-text("Fetch")');
    
    // Wait for successful parsing
    await page.waitForSelector('text=/Document parsed successfully/i', {
      timeout: testTimeouts.long,
    });
    
    // Extract info from success message
    const successAlert = page.locator('[role="alert"]').filter({ hasText: /parsed successfully/i });
    const alertText = await successAlert.textContent();
    console.log(`✓ Parsed document: ${alertText}`);
    
    // Wait for navigation to configuration
    await waitForStep(page, 1);
    
    // Step 2: Configuration
    console.log('Step 2: Configuring API keys...');
    
    // Check if base URL was extracted and prefilled
    const baseUrlInput = page.locator('input[label*="API Base URL"]');
    const baseUrl = await baseUrlInput.inputValue();
    if (baseUrl) {
      console.log(`✓ Base URL detected: ${baseUrl}`);
    }
    
    // Fill Claude API key if not already filled
    const claudeInput = page.locator('input[label*="Claude API Key"]');
    const claudeValue = await claudeInput.inputValue();
    
    if (!claudeValue) {
      const claudeKey = process.env.TEST_CLAUDE_KEY || '';
      if (claudeKey) {
        await claudeInput.fill(claudeKey);
        console.log('✓ Claude API key filled');
      } else {
        console.warn('⚠ No Claude API key available for testing');
        // Fill a dummy key to proceed
        await claudeInput.fill('sk-test-key-for-validation');
      }
    }
    
    // Fill test API key if not already filled
    const testApiInput = page.locator('input[label*="Test API Key"]');
    const testApiValue = await testApiInput.inputValue();
    
    if (!testApiValue) {
      await testApiInput.fill(testCredentials.fingerbankApiKey);
      console.log('✓ Test API key filled');
    }
    
    // Fill product URL if not already filled
    const productUrlInput = page.locator('input[label*="Product URL"]');
    const productUrlValue = await productUrlInput.inputValue();
    
    if (!productUrlValue) {
      await productUrlInput.fill(testUrls.fingerbankProduct);
      console.log('✓ Product URL filled');
    }
    
    // Continue to processing
    await page.click('button:has-text("Continue")');
    
    // Step 3: Processing and Validation
    console.log('Step 3: Processing and validating...');
    await waitForStep(page, 2);
    
    // Watch validation progress
    const validationSteps = [
      { selector: 'text=/Validating URL/i', name: 'URL validation' },
      { selector: 'text=/Validating Claude API key/i', name: 'Claude API validation' },
      { selector: 'text=/Validating test API key/i', name: 'Test API validation' },
      { selector: 'text=/Extracting API endpoints/i', name: 'Endpoint extraction' },
      { selector: 'text=/Categorizing/i', name: 'Categorization' },
    ];
    
    for (const step of validationSteps) {
      try {
        await page.waitForSelector(step.selector, {
          timeout: testTimeouts.medium,
        });
        console.log(`✓ ${step.name} started`);
      } catch {
        console.log(`ℹ ${step.name} skipped or too fast to detect`);
      }
    }
    
    // Wait for validation results
    const validationList = page.locator('[role="list"]').first();
    if (await validationList.isVisible({ timeout: 5000 })) {
      const validationItems = await validationList.locator('[role="listitem"]').count();
      console.log(`✓ ${validationItems} validations completed`);
      
      // Check validation statuses
      const successIcons = await page.locator('[data-testid="CheckCircleIcon"]').count();
      const errorIcons = await page.locator('[data-testid="ErrorIcon"]').count();
      
      console.log(`  - Success: ${successIcons}`);
      if (errorIcons > 0) {
        console.log(`  - Errors: ${errorIcons}`);
      }
    }
    
    // Wait for processing to complete
    await page.waitForSelector('text=/Processing complete/i', {
      timeout: testTimeouts.veryLong,
    });
    
    // Get endpoint count
    const completeText = await page.locator('text=/Processing complete/i').textContent();
    console.log(`✓ ${completeText}`);
    
    // Auto-navigation should occur to Review step
    await waitForStep(page, 3);
    
    // Step 4: Review Endpoints
    console.log('Step 4: Reviewing endpoints...');
    
    // Check summary is displayed
    const summaryText = await page.locator('text=/Total Endpoints:/i').textContent();
    console.log(`✓ ${summaryText}`);
    
    // Check if endpoints are categorized
    const categories = await page.locator('h6').filter({ hasText: /^[A-Z]/ }).count();
    console.log(`✓ Endpoints organized into ${categories} categories`);
    
    // Check endpoint table
    const tables = await page.locator('table').count();
    expect(tables).toBeGreaterThan(0);
    
    // Click Generate Documentation
    await page.click('button:has-text("Generate Documentation")');
    
    // Step 5: Generate Documentation
    console.log('Step 5: Generating documentation...');
    await waitForStep(page, 4);
    
    // Wait for generation to complete
    await page.waitForSelector('text=/Documentation generated successfully/i', {
      timeout: testTimeouts.long,
    });
    console.log('✓ Documentation generated successfully');
    
    // Check for download button
    const downloadButton = page.locator('button:has-text("Download")');
    await expect(downloadButton).toBeVisible();
    
    // Check for preview button
    const previewButton = page.locator('button:has-text("Preview")');
    await expect(previewButton).toBeVisible();
    
    // Check for chat button
    const chatButton = page.locator('button:has-text("Improve with AI")');
    await expect(chatButton).toBeVisible();
    
    // Check for any warnings
    const warningAlert = page.locator('[role="alert"]').filter({ hasText: /Warning/i });
    if (await warningAlert.isVisible({ timeout: 3000 })) {
      const warnings = await warningAlert.textContent();
      console.log(`⚠ Warnings: ${warnings}`);
    }
    
    console.log('✅ Full workflow completed successfully!');
  });

  test('should handle validation failures gracefully', async ({ page }) => {
    // Upload documentation
    const urlInput = page.locator('input[placeholder*="https://api.example.com"]');
    await urlInput.fill(testUrls.fingerbankDoc);
    await page.click('button:has-text("Fetch")');
    
    await page.waitForSelector('text=/Document parsed successfully/i', {
      timeout: testTimeouts.long,
    });
    
    await waitForStep(page, 1);
    
    // Enter invalid Claude API key
    const claudeInput = page.locator('input[label*="Claude API Key"]');
    await claudeInput.fill('invalid-api-key');
    
    // Continue to processing
    await page.click('button:has-text("Continue")');
    
    await waitForStep(page, 2);
    
    // Wait for validation to fail
    await page.waitForSelector('text=/failed/i', {
      timeout: testTimeouts.long,
    });
    
    // Check error is displayed
    const errorMessage = page.locator('text=/Claude API key validation failed/i');
    await expect(errorMessage).toBeVisible();
    
    console.log('✓ Validation failure handled correctly');
  });

  test('should test chat interface for improvements', async ({ page }) => {
    test.setTimeout(testTimeouts.veryLong * 3);
    
    // Quick navigation through steps (assuming test mode is active)
    const urlInput = page.locator('input[placeholder*="https://api.example.com"]');
    if (!(await urlInput.inputValue())) {
      await urlInput.fill(testUrls.fingerbankDoc);
    }
    await page.click('button:has-text("Fetch")');
    
    await page.waitForSelector('text=/Document parsed successfully/i', {
      timeout: testTimeouts.long,
    });
    
    // Configuration
    await waitForStep(page, 1);
    
    const claudeInput = page.locator('input[label*="Claude API Key"]');
    if (!(await claudeInput.inputValue())) {
      const key = process.env.TEST_CLAUDE_KEY || 'test-key';
      await claudeInput.fill(key);
    }
    
    await page.click('button:has-text("Continue")');
    
    // Wait for processing
    await waitForStep(page, 2);
    await page.waitForSelector('text=/Processing complete/i', {
      timeout: testTimeouts.veryLong,
    });
    
    // Review
    await waitForStep(page, 3);
    await page.click('button:has-text("Generate Documentation")');
    
    // Generate
    await waitForStep(page, 4);
    await page.waitForSelector('text=/Documentation generated successfully/i', {
      timeout: testTimeouts.long,
    });
    
    // Open chat interface
    await page.click('button:has-text("Improve with AI")');
    
    // Wait for dialog to open
    await page.waitForSelector('[role="dialog"]', {
      timeout: testTimeouts.medium,
    });
    
    // Check chat interface elements
    await expect(page.locator('text=/Improve Documentation with AI/i')).toBeVisible();
    
    // Check for message input
    const messageInput = page.locator('[placeholder*="How would you like to improve"]');
    await expect(messageInput).toBeVisible();
    
    // Check send button
    const sendButton = page.locator('button:has-text("Send")');
    await expect(sendButton).toBeVisible();
    
    // Close dialog
    const closeButton = page.locator('[role="dialog"] button[aria-label*="close"]');
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
    
    console.log('✓ Chat interface tested successfully');
  });
});