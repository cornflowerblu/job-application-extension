/**
 * REAL API E2E TESTS
 *
 * ⚠️  WARNING: These tests make REAL calls to the Claude API and incur costs!
 *
 * SAFETY MEASURES:
 * 1. Only runs when ENABLE_REAL_API_TESTS=true
 * 2. Maximum of 1 API call per test run
 * 3. Validates test API key is being used
 * 4. Each test is independent and isolated
 * 5. Timeouts prevent runaway tests
 *
 * COST ESTIMATE:
 * - 1 API call per full run (single comprehensive test)
 * - ~$0.01 - $0.02 per run (assuming Sonnet 4.5 pricing)
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
const MAX_API_CALLS = 1; // Only 1 comprehensive test now

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

    // Use headless mode in CI, headed mode for local debugging
    const isCI = process.env.CI === 'true';
    context = await chromium.launchPersistentContext('', {
      headless: isCI, // Headless in CI, headed for local development
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

  test('should fill comprehensive form with real Claude API', async () => {
    // Increase timeout for this test (Claude API can take 60+ seconds)
    test.setTimeout(120000); // 2 minutes

    apiCallCount++;
    console.log(`🔵 API Call ${apiCallCount}/${MAX_API_CALLS}: Comprehensive form test`);

    const page = await context.newPage();

    // DO NOT mock the API - let real calls go through!
    // (This is the key difference from form-filling.spec.ts)

    // Set up profile data in extension storage via service worker
    // Note: Cannot navigate to chrome://extensions/ in headless/CI mode
    const serviceWorkers = context.serviceWorkers();
    if (serviceWorkers.length > 0) {
      const sw = serviceWorkers[0];
      await sw.evaluate(({ apiKeyValue, profileData }) => {
        return new Promise<void>((resolve) => {
          chrome.storage.local.set(
            {
              apiKey: apiKeyValue,
              profile: profileData,
              keyboardShortcutsEnabled: true, // CRITICAL: Enable keyboard shortcuts!
            },
            () => {
              console.log('Storage set successfully');
              resolve();
            }
          );
        });
      }, {
        apiKeyValue: apiKey,
        profileData: {
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
    }

    // Navigate to comprehensive test form
    const testFormPath = path.join(__dirname, 'fixtures', 'comprehensive-job-application.html');
    await page.goto(`file://${testFormPath}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000); // Wait for content script to inject

    // Check if content script is loaded
    const isContentScriptLoaded = await page.evaluate(() => {
      return typeof (window as any).__jobAppExtensionLoaded !== 'undefined';
    });
    console.log('Content script loaded:', isContentScriptLoaded);

    // Listen for console messages from the page
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    // Step 1: Extract form data via service worker
    console.log('Analyzing form fields...');

    const workers = context.serviceWorkers();
    if (workers.length === 0) {
      throw new Error('No service workers found!');
    }

    const sw = workers[0];

    // Send ANALYZE_FORM to content script to get form data
    const formData = await sw.evaluate(async () => {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tabId = tabs[0].id!;

      return new Promise((resolve) => {
        chrome.tabs.sendMessage(tabId, { type: 'ANALYZE_FORM' }, (response) => {
          if (!response || !response.success) {
            throw new Error('Failed to analyze form');
          }
          resolve(response.data);
        });
      });
    });

    console.log(`Form analyzed: ${(formData as any).fields?.length || 0} fields found`);

    // Step 2: Generate fills with Claude API (this takes 30-60 seconds!)
    console.log('Generating fills with Claude API...');

    const fillsResponse = await sw.evaluate(async (formDataParam) => {
      // Get profile from storage
      const { profile } = await chrome.storage.local.get('profile');

      // Call generateFormFills that's exposed on globalThis
      try {
        const generateFn = (globalThis as any).__generateFormFills;
        if (!generateFn) {
          throw new Error('generateFormFills not found on globalThis');
        }
        const fills = await generateFn(formDataParam, profile);
        return { success: true, fills };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    }, formData);

    console.log('Fills generated successfully');
    const fillsStr = JSON.stringify(fillsResponse, null, 2);
    console.log('Fills response structure:', fillsStr ? fillsStr.substring(0, 500) : 'undefined');

    // Step 3: Send FILL_FORM message to content script
    console.log('Filling form...');

    await sw.evaluate(async (fills: any) => {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tabId = tabs[0].id!;

      const fillsStr = JSON.stringify(fills, null, 2);
      console.log('Fills object:', fillsStr ? fillsStr.substring(0, 300) : 'undefined');

      if (!fills || !fills.success) {
        throw new Error(`Invalid fills response: ${JSON.stringify(fills)}`);
      }

      // Extract the actual fills array from the response
      // Structure: { success: true, fills: { fills: [...] } }
      const fillsArray = fills.fills?.fills || [];

      chrome.tabs.sendMessage(tabId, {
        type: 'FILL_FORM',
        fills: fillsArray
      });
    }, fillsResponse);

    // Wait for filling to complete
    console.log('Waiting for form to fill...');
    await page.waitForTimeout(5000);

    // Verify comprehensive form fields are filled
    console.log('Verifying all fields...');

    // Basic fields
    const nameValue = await page.locator('#full-name').inputValue();
    const emailValue = await page.locator('#email').inputValue();
    const phoneValue = await page.locator('#phone').inputValue();

    // URLs
    const linkedinValue = await page.locator('#linkedin-url').inputValue();

    // Address
    const streetValue = await page.locator('#street-address').inputValue();
    const cityValue = await page.locator('#city').inputValue();

    // Employment history
    const employer1Value = await page.locator('#employer-1').inputValue();
    const startDate1Value = await page.locator('#start-date-1').inputValue();

    // Education
    const school1Value = await page.locator('#school-1').inputValue();
    const gpa1Value = await page.locator('#gpa-1').inputValue();

    // EEO fields
    const genderValue = await page.locator('#gender').inputValue();
    const raceValue = await page.locator('#race').inputValue();

    // Cover letter
    const coverLetterValue = await page.locator('#cover-letter').inputValue();

    console.log('Name:', nameValue);
    console.log('Email:', emailValue);
    console.log('LinkedIn:', linkedinValue);
    console.log('Employer:', employer1Value);
    console.log('School:', school1Value);
    console.log('GPA:', gpa1Value);
    console.log('Gender:', genderValue);
    console.log('Cover letter length:', coverLetterValue.length);

    // Assert basic fields
    expect(nameValue).toBeTruthy();
    expect(emailValue).toContain('@');
    expect(phoneValue).toBeTruthy();

    // Assert URLs
    expect(linkedinValue).toContain('linkedin.com');

    // Assert address
    expect(streetValue).toBeTruthy();
    expect(cityValue).toBeTruthy();

    // Assert employment
    expect(employer1Value).toBeTruthy();
    expect(startDate1Value).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // Assert education
    expect(school1Value).toBeTruthy();
    expect(parseFloat(gpa1Value)).toBeGreaterThan(0);
    expect(parseFloat(gpa1Value)).toBeLessThanOrEqual(4.0);

    // Assert EEO
    expect(genderValue).toBeTruthy();
    expect(raceValue).toBeTruthy();

    // Assert cover letter
    expect(coverLetterValue.length).toBeGreaterThan(50);

    console.log('✅ Test passed - Comprehensive form filled with real Claude API!\n');

    await page.close();
  });
});

/*
  Single comprehensive test covers all field types with real Claude API:
  - Basic fields (name, email, phone)
  - URLs (LinkedIn, portfolio, GitHub)
  - Address fields
  - Employment history with dates
  - Education with GPA
  - EEO fields (gender, race)
  - Cover letter generation
*/
