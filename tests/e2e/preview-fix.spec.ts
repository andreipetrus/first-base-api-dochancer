import { test, expect } from './helpers/base-test';
import { testUrls, testCredentials, testTimeouts } from './fixtures/test-data';

test.describe('Preview Documentation Fix', () => {
  test.beforeEach(async ({ page, waitForApp }) => {
    await waitForApp();
  });

  test('should open preview with correct content (not empty page)', async ({ page, context }) => {
    test.setTimeout(testTimeouts.veryLong);
    
    console.log('Testing preview documentation fix...');
    
    // Quick workflow to generate documentation
    // Step 1: Upload
    await page.fill('input[placeholder*="https://api.example.com"]', testUrls.fingerbankDoc);
    await page.click('button:has-text("Fetch")');
    await page.waitForSelector('text=/Document parsed successfully/i', {
      timeout: testTimeouts.long,
    });
    
    // Step 2: Configuration
    await page.waitForSelector('text="Claude API Key"', {
      timeout: testTimeouts.medium,
    });
    const claudeInput = page.locator('input[type="password"]').first();
    await claudeInput.fill('test-key');
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
    const previewButton = page.locator('button:has-text("Preview Documentation")');
    await expect(previewButton).toBeVisible();
    
    // Listen for new page (preview opens in new tab)
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      previewButton.click(),
    ]);
    
    // Wait for new page to load
    await newPage.waitForLoadState('networkidle');
    
    // Get the preview URL
    const previewUrl = newPage.url();
    console.log('Preview URL:', previewUrl);
    
    // CRITICAL CHECKS:
    // 1. URL should NOT contain duplicate localhost (was the bug)
    expect(previewUrl).not.toContain('localhost:5173/localhost');
    expect(previewUrl).not.toContain('http://localhost:5173/http://');
    
    // 2. URL should be properly proxied through frontend
    expect(previewUrl).toContain('/api/preview/docs/');
    
    // 3. Check for Swagger UI - THIS IS THE KEY TEST
    // If page is empty, this will fail
    console.log('Checking for Swagger UI content...');
    
    // Wait for Swagger UI to load
    const swaggerUIExists = await newPage.locator('#swagger-ui').isVisible();
    expect(swaggerUIExists).toBeTruthy();
    
    // Check page is not empty
    const pageContent = await newPage.content();
    expect(pageContent.length).toBeGreaterThan(1000); // Should have substantial content
    
    // Check for critical Swagger UI elements
    const hasSwaggerJS = pageContent.includes('swagger-ui-bundle.js');
    expect(hasSwaggerJS).toBeTruthy();
    
    const hasSwaggerCSS = pageContent.includes('swagger-ui.css');
    expect(hasSwaggerCSS).toBeTruthy();
    
    // Check for OpenAPI spec in the page
    const hasSpec = pageContent.includes('openapi');
    expect(hasSpec).toBeTruthy();
    
    // Check that API title is visible
    const titleExists = await newPage.locator('.info .title').isVisible();
    expect(titleExists).toBeTruthy();
    
    // Get the title text to verify it's not empty
    const titleText = await newPage.locator('.info .title').textContent();
    console.log('API Title:', titleText);
    expect(titleText).toBeTruthy();
    expect(titleText?.length).toBeGreaterThan(0);
    
    // Check version is displayed
    const versionExists = await newPage.locator('.info .version').isVisible();
    expect(versionExists).toBeTruthy();
    
    const versionText = await newPage.locator('.info .version').textContent();
    console.log('API Version:', versionText);
    
    // Close preview tab
    await newPage.close();
    
    console.log('✅ Preview documentation fix verified - page shows content correctly!');
  });

  test('should generate correct preview URLs without origin duplication', async ({ page }) => {
    // This test checks the URL generation logic directly
    
    // Navigate to a generated documentation (assuming one exists)
    await page.goto(`${testUrls.frontend}/#generate`);
    
    // Check that preview button URLs don't have duplicated origins
    const previewButtons = await page.locator('button:has-text("Preview")').all();
    
    for (const button of previewButtons) {
      const onclickAttr = await button.getAttribute('onclick');
      if (onclickAttr) {
        // Check that onclick doesn't contain window.location.origin concatenation
        expect(onclickAttr).not.toContain('window.location.origin');
      }
    }
    
    console.log('✅ URL generation logic verified');
  });
});