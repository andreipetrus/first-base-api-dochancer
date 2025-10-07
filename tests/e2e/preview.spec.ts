import { test, expect } from './helpers/base-test';
import { testUrls, testCredentials, testTimeouts } from './fixtures/test-data';

test.describe('Preview Documentation Feature', () => {
  test.beforeEach(async ({ page, waitForApp }) => {
    await waitForApp();
  });

  test('should complete workflow and open preview in new tab', async ({ page, context }) => {
    test.setTimeout(testTimeouts.veryLong * 2);
    
    // Quick navigation through workflow
    console.log('Starting preview test workflow...');
    
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
    
    // Step 2: Configuration (use test keys if available)
    await page.waitForSelector('input[label*="Claude API Key"]', {
      timeout: testTimeouts.medium,
    });
    
    const claudeInput = page.locator('input[label*="Claude API Key"]');
    const claudeValue = await claudeInput.inputValue();
    if (!claudeValue) {
      const key = process.env.TEST_CLAUDE_KEY || testCredentials.claudeApiKey || 'test-key';
      await claudeInput.fill(key);
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
    
    console.log('Documentation generated, testing preview...');
    
    // Test preview button
    const previewButton = page.locator('button:has-text("Preview")');
    await expect(previewButton).toBeVisible();
    
    // Listen for new page (preview opens in new tab)
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      previewButton.click(),
    ]);
    
    // Wait for new page to load
    await newPage.waitForLoadState('networkidle');
    
    // Verify preview page loaded
    const newPageUrl = newPage.url();
    console.log('Preview URL:', newPageUrl);
    
    // Check that it's the preview endpoint
    expect(newPageUrl).toContain('/api/preview/docs/');
    
    // Check for Swagger UI elements in preview
    await newPage.waitForSelector('#swagger-ui', {
      timeout: testTimeouts.medium,
    });
    
    // Verify Swagger UI loaded
    const swaggerContainer = await newPage.locator('#swagger-ui').isVisible();
    expect(swaggerContainer).toBeTruthy();
    
    // Check for API title in the documentation
    const title = await newPage.locator('.info .title').textContent();
    console.log('API Documentation Title:', title);
    
    // Check that version was correctly inferred (should be 2.0 for Fingerbank)
    const versionElement = await newPage.locator('.info .version').textContent();
    console.log('API Version detected:', versionElement);
    
    // Version should be 2.0 for Fingerbank API
    if (versionElement) {
      expect(versionElement).toContain('2.0');
    }
    
    // Close preview tab
    await newPage.close();
    
    console.log('✓ Preview feature working correctly');
  });

  test('should handle preview errors gracefully', async ({ page }) => {
    // Navigate directly to generate step with invalid preview URL
    await page.goto(`${testUrls.frontend}/#generate`);
    
    // Try to access non-existent preview
    const response = await page.request.get('/api/preview/docs/non-existent-file.html');
    expect(response.status()).toBe(404);
    
    console.log('✓ Preview handles 404 errors correctly');
  });

  test('should serve preview through existing server without spinning new server', async ({ page }) => {
    // Check that no additional server endpoints are created
    const response = await page.request.post('/api/preview/server', {
      data: {},
      failOnStatusCode: false,
    });
    
    // This endpoint should not exist anymore
    expect(response.status()).toBe(404);
    
    console.log('✓ No separate preview server needed');
  });

  test('should list available previews', async ({ page }) => {
    const response = await page.request.get('/api/preview/list');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('success');
    expect(data).toHaveProperty('files');
    expect(Array.isArray(data.files)).toBeTruthy();
    
    console.log(`✓ Preview list endpoint working (${data.files.length} files available)`);
  });
});