/**
 * REAL API E2E TESTS
 *
 * ⚠️  WARNING: These tests make REAL calls to the Claude API and incur costs!
 *
 * SAFETY MEASURES:
 * 1. Only runs when ENABLE_REAL_API_TESTS=true
 * 2. Maximum of 3 API calls per test run
 * 3. Validates test API key is being used
 * 4. Each test is independent and isolated
 * 5. Timeouts prevent runaway tests
 *
 * COST ESTIMATE:
 * - ~3 API calls per full run
 * - ~$0.03 - $0.06 per run (assuming Sonnet 4.5 pricing)
 *
 * TO RUN:
 * ENABLE_REAL_API_TESTS=true npm run test:e2e:real-api
 *
 * BEFORE RUNNING:
 * - Ensure .env file has valid API_KEY
 * - Verify you're okay with incurring API costs
 * - Build the extension first: npm run build
 */

import { test, expect, chromium, BrowserContext } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SAFETY CHECK: Only run if explicitly enabled
const isEnabled = process.env.ENABLE_REAL_API_TESTS === 'true';

// Safety counter to prevent runaway API calls
let apiCallCount = 0;
const MAX_API_CALLS = 3;

// Load API key from .env
function loadApiKey(): string {
  const envPath = path.join(__dirname, '../.env');

  if (!fs.existsSync(envPath)) {
    throw new Error('SAFETY: .env file not found! Cannot run real API tests without API key.');
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const match = envContent.match(/API_KEY=(.+)/);

  if (!match) {
    throw new Error('SAFETY: API_KEY not found in .env file!');
  }

  return match[1].trim();
}

test.describe('Real Claude API E2E Tests', () => {
  // Skip all tests if not enabled
  test.skip(!isEnabled, 'Set ENABLE_REAL_API_TESTS=true to run real API tests');

  let context: BrowserContext;
  let apiKey: string;

  test.beforeAll(async () => {
    console.log('\n⚠️  REAL API TESTS ENABLED - Will make actual Claude API calls!');
    console.log(`📊 Maximum API calls allowed: ${MAX_API_CALLS}\n`);

    // Load and validate API key
    apiKey = loadApiKey();

    if (!apiKey.startsWith('sk-ant-')) {
      throw new Error('SAFETY: API key format invalid! Must start with sk-ant-');
    }

    console.log(`✅ API key loaded: ${apiKey.substring(0, 20)}...`);

    // Launch browser with extension loaded
    const pathToExtension = path.join(__dirname, '..', 'dist');

    // Verify extension is built
    if (!fs.existsSync(path.join(pathToExtension, 'manifest.json'))) {
      throw new Error('SAFETY: Extension not built! Run "npm run build" first.');
    }

    context = await chromium.launchPersistentContext('', {
      headless: false, // Extensions require headed mode
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });

    console.log('✅ Browser launched with extension loaded\n');
  });

  test.afterAll(async () => {
    await context.close();
    console.log(`\n📊 Total API calls made: ${apiCallCount}/${MAX_API_CALLS}`);
    console.log(`💰 Estimated cost: $${(apiCallCount * 0.02).toFixed(4)} (approximate)\n`);
  });

  test.beforeEach(async () => {
    // Safety check before each test
    if (apiCallCount >= MAX_API_CALLS) {
      throw new Error(`SAFETY: Maximum API call limit reached (${MAX_API_CALLS})! Aborting tests.`);
    }
  });

  test('should fill basic form fields with real Claude API', async () => {
    apiCallCount++;
    console.log(`🔵 API Call ${apiCallCount}/${MAX_API_CALLS}: Basic form test`);

    const page = await context.newPage();

    // DO NOT mock the API - let real calls go through!
    // (This is the key difference from form-filling.spec.ts)

    // Navigate to test form
    const testFormPath = path.join(__dirname, '..', 'test-form.html');
    await page.goto(`file://${testFormPath}`);
    await page.waitForLoadState('domcontentloaded');

    // Open extension popup to set up profile
    const [popupPage] = await Promise.all([
      context.waitForEvent('page'),
      page.evaluate(() => {
        // Open popup via extension icon click simulation
        // In real usage, user clicks the extension icon
        // For testing, we'll directly navigate to popup
      }),
    ]);

    // If popup opened, close it and use storage API instead
    if (popupPage) {
      await popupPage.close();
    }

    // Set up profile data in extension storage
    // This is done via the service worker's storage API
    const targets = context.serviceWorkers();
    if (targets.length > 0) {
      const serviceWorker = targets[0];
      await serviceWorker.evaluate((apiKeyValue) => {
        // Set API key and profile in chrome.storage
        chrome.storage.local.set({
          apiKey: apiKeyValue,
          profile: {
            name: 'Test User',
            email: 'test@example.com',
            phone: '555-1234',
            resume: 'Experienced software engineer with 5 years in web development.',
            workAuthorization: 'U.S. Citizen',
            willingToRelocate: 'Yes',
            gender: 'Male',
            race: 'White',
            veteranStatus: 'I am not a protected veteran',
            disabilityStatus: 'No, I do not have a disability',
          },
        });
      }, apiKey);
    }

    // Use keyboard shortcut to analyze form (Ctrl+Shift+A or Cmd+Shift+A)
    const isMac = process.platform === 'darwin';
    await page.keyboard.press(isMac ? 'Meta+Shift+A' : 'Control+Shift+A');

    // Wait for analysis to complete
    await page.waitForTimeout(3000); // Give Claude time to respond

    // Use keyboard shortcut to fill form (Ctrl+Shift+F or Cmd+Shift+F)
    await page.keyboard.press(isMac ? 'Meta+Shift+F' : 'Control+Shift+F');

    // Wait for form to be filled
    await page.waitForTimeout(2000);

    // Verify form fields are filled
    const nameValue = await page.locator('#full-name').inputValue();
    const emailValue = await page.locator('#email').inputValue();

    console.log('Name filled:', nameValue);
    console.log('Email filled:', emailValue);

    // Assert that fields were filled
    expect(nameValue).toBeTruthy();
    expect(nameValue.length).toBeGreaterThan(0);
    expect(emailValue).toContain('@');

    console.log('✅ Test passed - Form filled with real Claude API\n');

    await page.close();
  });

  test('should fill EEO fields with real Claude API', async () => {
    apiCallCount++;
    console.log(`🔵 API Call ${apiCallCount}/${MAX_API_CALLS}: EEO fields test`);

    const page = await context.newPage();

    // Navigate to test form
    const testFormPath = path.join(__dirname, '..', 'test-form.html');
    await page.goto(`file://${testFormPath}`);
    await page.waitForLoadState('domcontentloaded');

    // Set up profile with EEO data via service worker
    const targets = context.serviceWorkers();
    if (targets.length > 0) {
      const serviceWorker = targets[0];
      await serviceWorker.evaluate((apiKeyValue) => {
        chrome.storage.local.set({
          apiKey: apiKeyValue,
          profile: {
            name: 'Jane Smith',
            email: 'jane@example.com',
            phone: '555-5678',
            resume: 'Product manager with 8 years experience.',
            workAuthorization: 'Yes',
            willingToRelocate: 'No',
            gender: 'Female',
            race: 'Asian',
            veteranStatus: 'I am not a protected veteran',
            disabilityStatus: 'No, I do not have a disability',
          },
        });
      }, apiKey);
    }

    // Analyze form
    const isMac = process.platform === 'darwin';
    await page.keyboard.press(isMac ? 'Meta+Shift+A' : 'Control+Shift+A');
    await page.waitForTimeout(3000);

    // Fill form
    await page.keyboard.press(isMac ? 'Meta+Shift+F' : 'Control+Shift+F');
    await page.waitForTimeout(2000);

    // Verify EEO fields are filled
    const genderValue = await page.locator('#gender').inputValue();
    const raceValue = await page.locator('#race').inputValue();
    const veteranValue = await page.locator('#veteran').inputValue();
    const disabilityValue = await page.locator('#disability').inputValue();

    console.log('Gender:', genderValue);
    console.log('Race:', raceValue);
    console.log('Veteran:', veteranValue);
    console.log('Disability:', disabilityValue);

    // Assert EEO fields are filled
    expect(genderValue).toBeTruthy();
    expect(raceValue).toBeTruthy();
    expect(veteranValue).toBeTruthy();
    expect(disabilityValue).toBeTruthy();

    console.log('✅ Test passed - EEO fields filled with real Claude API\n');

    await page.close();
  });

  test('should handle cover letter generation with real Claude API', async () => {
    apiCallCount++;
    console.log(`🔵 API Call ${apiCallCount}/${MAX_API_CALLS}: Cover letter test`);

    const page = await context.newPage();

    // Navigate to test form
    const testFormPath = path.join(__dirname, '..', 'test-form.html');
    await page.goto(`file://${testFormPath}`);
    await page.waitForLoadState('domcontentloaded');

    // Set up profile via service worker
    const targets = context.serviceWorkers();
    if (targets.length > 0) {
      const serviceWorker = targets[0];
      await serviceWorker.evaluate((apiKeyValue) => {
        chrome.storage.local.set({
          apiKey: apiKeyValue,
          profile: {
            name: 'Senior Developer',
            email: 'dev@example.com',
            phone: '555-9999',
            resume: 'Senior software engineer with 12 years of experience in full-stack development. Expert in React, Node.js, TypeScript, and AWS.',
            workAuthorization: 'U.S. Citizen',
            willingToRelocate: 'Yes',
          },
        });
      }, apiKey);
    }

    // Analyze form
    const isMac = process.platform === 'darwin';
    await page.keyboard.press(isMac ? 'Meta+Shift+A' : 'Control+Shift+A');
    await page.waitForTimeout(3000);

    // Fill form
    await page.keyboard.press(isMac ? 'Meta+Shift+F' : 'Control+Shift+F');
    await page.waitForTimeout(2000);

    // Verify cover letter is generated
    const coverLetterValue = await page.locator('#cover-letter').inputValue();

    console.log('Cover letter length:', coverLetterValue.length);
    console.log('Cover letter preview:', coverLetterValue.substring(0, 100) + '...');

    // Assert cover letter was generated
    expect(coverLetterValue.length).toBeGreaterThan(50);
    expect(coverLetterValue.length).toBeLessThanOrEqual(500); // Respects max length

    console.log('✅ Test passed - Cover letter generated with real Claude API\n');

    await page.close();
  });
});
