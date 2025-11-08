# Testing Guide

This project has comprehensive test coverage including unit tests, mocked integration tests, and **real API integration tests**.

## Test Types

### 1. Unit Tests (Fast, Free)
Tests individual functions and components in isolation.

```bash
npm test                    # Run all unit tests once
npm run test:watch          # Run in watch mode
npm run test:coverage       # Generate coverage report
```

**Coverage:** 70%+ required (enforced in CI)

### 2. Mocked Integration Tests (Fast, Free)
Tests the full flow with mocked Claude API responses. Safe to run in CI.

```bash
npm test src/__tests__/integration/form-flow.test.ts
```

**What they test:**
- Form extraction → Claude (mocked) → Form filling flow
- Prompt construction
- Response parsing
- Error handling

**What they DON'T test:**
- Actual Claude API behavior
- Real-world prompt effectiveness
- Unexpected Claude responses

### 3. End-to-End Tests (Playwright)

Browser automation tests with real extension loaded.

```bash
npm run test:e2e            # Run E2E tests (mocked API)
npm run test:e2e:ui         # Run with UI
npm run test:e2e:debug      # Debug mode
```

**What they test:**
- Full extension in real browser
- DOM interactions
- Extension APIs
- User workflows
- Form filling with **mocked** Claude API

### 4. Real API E2E Tests (Playwright) ⚠️

**⚠️  WARNING: These tests make REAL calls to Claude API and incur costs!**

```bash
npm run test:e2e:real-api
```

**Safety Measures:**
- Only runs when explicitly enabled (`ENABLE_REAL_API_TESTS=true`)
- Maximum 3 API calls per run
- Validates test API key format
- Estimated cost: ~$0.03-$0.06 per run
- Requires extension to be built first (`npm run build`)

**What they test:**
- Actual Claude API integration in real browser
- Real prompt effectiveness
- End-to-end user workflow with real AI
- EEO field generation with real AI
- Cover letter generation quality
- Keyboard shortcuts with real API

**When to run:**
- Before major releases
- When changing prompt construction
- When debugging AI behavior issues
- After EEO or profile changes
- When testing in real browser environment
- NOT in CI (manual only)

**How it works:**
1. Loads actual extension in Chrome
2. Navigates to test-form.html
3. Uses keyboard shortcuts to trigger analysis and filling
4. Makes **real** Claude API calls (no mocking!)
5. Verifies form fields are filled correctly

---

## Test File Organization

```
src/__tests__/
├── setup.ts                          # Jest configuration
├── form-filling.test.ts              # Form interaction unit tests
├── form-field-extraction.test.ts     # Field extraction (no ID bug prevention)
├── keyboard-shortcuts.test.ts        # Keyboard shortcut tests
├── api-errors.test.ts                # API error handling
├── security.test.ts                  # Profile sanitization (EEO bug prevention)
└── integration/
    └── form-flow.test.ts             # Mocked integration tests

e2e/
├── form-filling.spec.ts              # E2E tests with mocked API
└── real-api.spec.ts                  # REAL API E2E tests ⚠️
```

---

## Running Real API E2E Tests - Detailed Guide

### Prerequisites

1. **Build the extension first:**
   ```bash
   npm run build
   ```

2. **Valid API Key** in `.env` file:
   ```bash
   API_KEY=sk-ant-api03-...
   ```

3. **Understand the costs:**
   - Each test run makes ~3 API calls
   - Cost: ~$0.03-$0.06 per run (Sonnet 4.5 pricing)
   - Failed tests still incur costs

4. **Safety limits:**
   - Maximum 3 API calls enforced
   - Tests run in headed browser (you'll see Chrome open)
   - Tests abort if limit reached

### Running the Tests

```bash
# Build extension first
npm run build

# Run real API E2E tests
npm run test:e2e:real-api
```

### What Gets Tested

1. **Basic Form Filling E2E:**
   - Loads real extension in Chrome
   - Uses keyboard shortcuts (Cmd/Ctrl+Shift+A to analyze, Cmd/Ctrl+Shift+F to fill)
   - Makes **real** Claude API call
   - Verifies form fields are filled correctly

2. **EEO Fields E2E:** (Regression test for the bug!)
   - Verifies EEO fields in profile storage
   - Real Claude API generates EEO values
   - Tests actual form filling in browser

3. **Cover Letter Generation:**
   - Tests real AI-generated cover letter
   - Validates length constraints
   - Checks quality of generated content

### Reading Test Output

```
⚠️  REAL API TESTS ENABLED - Will make actual Claude API calls!
📊 Maximum API calls allowed: 3
✅ API key loaded: sk-ant-api03-gEUi...
✅ Browser launched with extension loaded

🔵 API Call 1/3: Basic form test
Name filled: Test User
Email filled: test@example.com
✅ Test passed - Form filled with real Claude API

🔵 API Call 2/3: EEO fields test
Gender: male
Race: white
Veteran: not-veteran
Disability: no
✅ Test passed - EEO fields filled with real Claude API

📊 Total API calls made: 2/3
💰 Estimated cost: $0.0400 (approximate)
```

### If Tests Fail

1. **Build not found:** Run `npm run build` first
2. **Extension not loading:** Check dist/manifest.json exists
3. **API key invalid:** Ensure `.env` has valid key starting with `sk-ant-`
4. **Timeout errors:** Claude API might be slow, increase timeout in test
5. **Field not filled:** Check console in browser window for errors
6. **Service worker issues:** Check that service worker is running in chrome://extensions

---

## CI/CD Integration

### GitHub Actions (example)

```yaml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run test:ci  # Unit + mocked integration only
      - run: npm run test:e2e  # E2E with mocked API

  # Real API E2E tests run manually or on release
  real-api-e2e-tests:
    runs-on: ubuntu-latest
    if: github.event_name == 'release'
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run build  # Build extension first
      - run: npm run test:e2e:real-api
        env:
          API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          ENABLE_REAL_API_TESTS: true
```

---

## Test Coverage Goals

| Test Suite | Coverage | Status |
|------------|----------|--------|
| Unit Tests | 70%+ | ✅ Met |
| Integration (Mocked) | Key flows | ✅ Met |
| E2E (Mocked API) | Critical paths | ✅ Met |
| E2E (Real API) | Pre-release | ⚠️ Manual |

---

## Common Issues

### "Skipped - Set ENABLE_REAL_API_TESTS=true"

This is normal! Real API E2E tests are disabled by default to prevent accidental costs.

**To enable:** `npm run test:e2e:real-api`

### "API_KEY not found in .env file"

Create a `.env` file in the project root:
```bash
API_KEY=sk-ant-api03-your-key-here
```

### "SAFETY: Extension not built!"

Build the extension first before running E2E tests:
```bash
npm run build
npm run test:e2e:real-api
```

### "Maximum API call limit reached"

Safety limit working as intended. Tests stop after 3 calls to prevent runaway costs.

### Real API E2E tests fail but mocked tests pass

This indicates:
1. Prompt construction issue
2. Claude response format changed
3. API connectivity issue
4. Extension not loaded correctly in browser
5. Keyboard shortcuts not working

Check the browser window that opens during the test for errors.

---

## Best Practices

### During Development
- Run unit tests frequently (`npm test`)
- Use watch mode for TDD (`npm run test:watch`)
- Mocked integration tests for quick feedback

### Before Committing
- Run full test suite (`npm run test:ci`)
- Check coverage (`npm run test:coverage`)

### Before Releases
- Run real API E2E tests (`npm run test:e2e:real-api`)
- Run mocked E2E tests (`npm run test:e2e`)
- Manual testing on real job sites

### In Production
- Monitor error logs
- Track Claude API failures
- User feedback loops

---

## Adding New Tests

### Unit Test Example
```typescript
// src/__tests__/my-feature.test.ts
describe('MyFeature', () => {
  it('should do something', () => {
    expect(myFunction()).toBe(expected);
  });
});
```

### Real API E2E Test Example
```typescript
// Add to e2e/real-api.spec.ts
test('should test new feature with real API', async () => {
  apiCallCount++; // MUST increment!
  console.log(`🔵 API Call ${apiCallCount}/${MAX_API_CALLS}: New feature test`);

  const page = await context.newPage();

  // Navigate to test form
  const testFormPath = path.join(__dirname, '..', 'test-form.html');
  await page.goto(`file://${testFormPath}`);

  // Set up profile...
  // Trigger analysis and filling...
  // Verify results...

  console.log('✅ Test passed');
  await page.close();
});
```

---

## Questions?

- Unit test failing? Check mocks in `setup.ts`
- Integration test failing? Check mock responses in `form-flow.test.ts`
- E2E test failing? Check extension is loaded in browser
- Real API E2E test failing? Check browser console and Claude's response
- Need to add test? See examples above

Happy testing! 🧪
