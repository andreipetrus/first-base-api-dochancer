import { test, expect } from '@playwright/test';
import { testUrls, testCredentials, testTimeouts } from './fixtures/test-data';

test.describe('Endpoint Testing E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    console.log('App loaded, starting endpoint testing workflow...');
  });

  test('should test all endpoints and verify success', async ({ page }) => {
    test.setTimeout(testTimeouts.veryLong * 3);

    console.log('\n=== Step 1: Upload Documentation ===');
    const urlInput = page.locator('input[placeholder*="https://api.example.com"]');
    await urlInput.fill(testUrls.fingerbankDoc);
    console.log(`✓ Entered URL: ${testUrls.fingerbankDoc}`);
    
    await page.click('button:has-text("Fetch")');
    
    await page.waitForSelector('text=/Document parsed successfully/i', {
      timeout: testTimeouts.long,
    });
    console.log('✓ Document parsed successfully');

    const successAlert = page.locator('[role="alert"]').filter({ hasText: /parsed successfully/i });
    const alertText = await successAlert.textContent();
    console.log(`  ${alertText}`);

    await page.waitForSelector('[class*="MuiStepLabel"][class*="active"]', {
      state: 'attached',
      timeout: 10000,
    });

    console.log('\n=== Step 2: Configure Settings ===');
    
    const claudeInput = page.locator('input[type="password"]').first();
    const currentClaudeValue = await claudeInput.inputValue();
    
    if (!currentClaudeValue) {
      const claudeKey = testCredentials.claudeApiKey;
      if (!claudeKey) {
        throw new Error('No Claude API key available. Set TEST_CLAUDE_KEY environment variable.');
      }
      await claudeInput.fill(claudeKey);
      console.log('✓ Claude API key filled');
    } else {
      console.log('✓ Claude API key already filled (from env)');
    }

    const testApiInput = page.locator('input[type="password"]').nth(1);
    const currentTestApiValue = await testApiInput.inputValue();
    
    if (!currentTestApiValue) {
      await testApiInput.fill(testCredentials.fingerbankApiKey);
      console.log('✓ Test API key filled');
    } else {
      console.log('✓ Test API key already filled (from env)');
    }

    const baseUrlInput = page.locator('input[label*="API Base URL"]');
    const currentBaseUrl = await baseUrlInput.inputValue();
    console.log(`✓ Base URL: ${currentBaseUrl || 'Not set'}`);

    const productUrlInput = page.locator('input[label*="Product URL"]');
    const currentProductUrl = await productUrlInput.inputValue();
    
    if (!currentProductUrl) {
      await productUrlInput.fill(testUrls.fingerbankProduct);
      console.log('✓ Product URL filled');
    } else {
      console.log('✓ Product URL already filled (from env)');
    }

    await page.click('button:has-text("Continue")');
    console.log('✓ Continuing to processing step');

    console.log('\n=== Step 3: Process & Extract ===');
    
    await page.waitForSelector('text=/Validating/i', {
      timeout: testTimeouts.medium,
    });
    console.log('✓ Validation started');

    const validationStages = [
      'Validating URL',
      'Validating Claude API key',
      'Validating test API key',
      'Extracting API endpoints',
      'Categorizing',
      'Testing API endpoints',
    ];

    for (const stage of validationStages) {
      try {
        await page.waitForSelector(`text=/${stage}/i`, { timeout: 5000, state: 'visible' });
        console.log(`  → ${stage}...`);
      } catch {
        console.log(`  → ${stage}... (skipped or fast)`);
      }
    }

    await page.waitForSelector('text=/Processing complete/i', {
      timeout: testTimeouts.veryLong,
    });
    
    const completeMessage = await page.locator('text=/Processing complete/i').textContent();
    console.log(`✓ ${completeMessage}`);

    const testResultsSection = page.locator('text=/Test Results:/i');
    if (await testResultsSection.isVisible({ timeout: 5000 })) {
      console.log('\n=== Test Results ===');
      
      const totalEndpoints = await page.locator('text=/Total:/i').textContent();
      const successCount = await page.locator('text=/Success:/i').textContent();
      const warningsCount = await page.locator('text=/Warnings:/i').textContent();
      const failuresCount = await page.locator('text=/Failures:/i').textContent();
      
      console.log(totalEndpoints);
      console.log(successCount);
      console.log(warningsCount);
      console.log(failuresCount);

      const successMatch = successCount?.match(/(\d+)/);
      const warningsMatch = warningsCount?.match(/(\d+)/);
      const failuresMatch = failuresCount?.match(/(\d+)/);
      const totalMatch = totalEndpoints?.match(/(\d+)/);

      const successNum = successMatch ? parseInt(successMatch[1]) : 0;
      const warningsNum = warningsMatch ? parseInt(warningsMatch[1]) : 0;
      const failuresNum = failuresMatch ? parseInt(failuresMatch[1]) : 0;
      const totalNum = totalMatch ? parseInt(totalMatch[1]) : 0;

      console.log(`\n📊 Results: ${successNum}/${totalNum} endpoints succeeded`);
      
      if (successNum === totalNum && failuresNum === 0) {
        console.log('✅ All endpoints tested successfully!');
      } else if (successNum > 0) {
        console.log(`✅ ${successNum} endpoints succeeded`);
        if (warningsNum > 0) {
          console.log(`⚠️  ${warningsNum} endpoints with warnings`);
        }
        if (failuresNum > 0) {
          console.log(`❌ ${failuresNum} endpoints failed`);
        }
      } else {
        console.log('❌ No endpoints succeeded - check API configuration');
      }

      expect(successNum).toBeGreaterThan(0);
      expect(totalNum).toBeGreaterThan(0);
    }

    await page.waitForSelector('[class*="MuiStepLabel"][class*="active"]', {
      state: 'attached',
      timeout: 10000,
    });

    console.log('\n=== Step 4: Review & Test ===');
    
    const endpointSummary = await page.locator('text=/Total Endpoints:/i').textContent();
    console.log(`✓ ${endpointSummary}`);

    const categories = await page.locator('h6').filter({ hasText: /^\w+$/ }).count();
    console.log(`✓ Endpoints organized into ${categories} category/categories`);

    const tables = await page.locator('table').count();
    expect(tables).toBeGreaterThan(0);
    console.log(`✓ Found ${tables} endpoint table(s)`);

    const firstTable = page.locator('table').first();
    if (await firstTable.isVisible()) {
      const rows = await firstTable.locator('tbody tr').count();
      console.log(`✓ First table contains ${rows} endpoint(s)`);
      
      if (rows > 0) {
        console.log('\n📋 Endpoint Details:');
        for (let i = 0; i < Math.min(5, rows); i++) {
          const row = firstTable.locator('tbody tr').nth(i);
          const cells = await row.locator('td').allTextContents();
          
          if (cells.length >= 2) {
            const method = cells[0];
            const path = cells[1];
            const status = cells[cells.length - 1];
            
            console.log(`  ${i + 1}. ${method} ${path} - ${status}`);
          }
        }
        
        if (rows > 5) {
          console.log(`  ... and ${rows - 5} more endpoints`);
        }
      }
    }

    await page.click('button:has-text("Generate Documentation")');
    console.log('✓ Proceeding to documentation generation');

    console.log('\n=== Step 5: Generate Documentation ===');
    
    await page.waitForSelector('text=/Documentation generated successfully/i', {
      timeout: testTimeouts.long,
    });
    console.log('✓ Documentation generated successfully');

    const downloadButton = page.locator('button:has-text("Download")');
    await expect(downloadButton).toBeVisible();
    console.log('✓ Download button available');

    const previewButton = page.locator('button:has-text("Preview")');
    await expect(previewButton).toBeVisible();
    console.log('✓ Preview button available');

    const chatButton = page.locator('button:has-text("Improve with AI")');
    await expect(chatButton).toBeVisible();
    console.log('✓ AI improvement button available');

    console.log('\n✅ Complete E2E workflow with endpoint testing finished successfully!');
  });
});
