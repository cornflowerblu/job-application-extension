/**
 * Validation Handling E2E Tests (AJH-67)
 *
 * Tests that the extension properly handles form validation errors:
 * - Pauses when validation errors occur
 * - Notifies user of validation issues
 * - Allows manual correction
 * - Resumes after correction
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Form Validation Handling (AJH-67)', () => {

  test('should pause and notify when validation error occurs', async ({ page }) => {
    // Load a form with validation rules
    const testFormPath = path.join(__dirname, 'fixtures', 'form-with-validation.html');
    await page.goto(`file://${testFormPath}`);

    // Fill a field with invalid data
    const emailField = page.locator('#email');
    await emailField.fill('invalid-email');
    await emailField.blur(); // Trigger validation

    // Check that validation error is displayed for email field
    const errorMessage = page.locator('.error-message[data-for="email"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('valid email');
  });

  test('should detect validation errors after auto-fill', async ({ page }) => {
    const testFormPath = path.join(__dirname, 'fixtures', 'form-with-validation.html');
    await page.goto(`file://${testFormPath}`);

    // Simulate extension filling field with invalid data
    await page.evaluate(() => {
      const emailField = document.querySelector('#email') as HTMLInputElement;
      emailField.value = 'not-an-email';
      emailField.dispatchEvent(new Event('input', { bubbles: true }));
      emailField.dispatchEvent(new Event('blur', { bubbles: true }));
    });

    // Wait for validation to trigger
    await page.waitForTimeout(200);

    // Check validation error exists
    const hasError = await page.evaluate(() => {
      const emailField = document.querySelector('#email') as HTMLElement;
      return (
        emailField.classList.contains('error') ||
        emailField.classList.contains('invalid') ||
        emailField.getAttribute('aria-invalid') === 'true' ||
        !!emailField.parentElement?.querySelector('.error-message')
      );
    });

    expect(hasError).toBeTruthy();
  });

  test('should notify user when validation errors are found', async ({ page }) => {
    // This test verifies that when the extension detects validation errors,
    // it should:
    // 1. Pause the auto-fill process
    // 2. Display a notification/modal showing the validation issues
    // 3. Allow the user to manually correct the problematic fields

    // TODO: This will fail until we implement the pause-and-notify behavior
    test.skip(true, 'Not yet implemented - AJH-67');

    // Expected behavior once implemented:
    // 1. Extension fills form
    // 2. Validation error detected on email field
    // 3. Extension pauses and shows modal: "Validation error detected on Email: Please enter a valid email address"
    // 4. User can click "Fix Manually" to correct the field
    // 5. User can click "Continue" to resume auto-fill after correction
  });

  test('should allow manual correction of validation errors', async ({ page }) => {
    const testFormPath = path.join(__dirname, 'fixtures', 'form-with-validation.html');
    await page.goto(`file://${testFormPath}`);

    // Fill with invalid data
    await page.locator('#email').fill('invalid');
    await page.locator('#email').blur();

    // Verify error exists for email field
    const emailError = page.locator('.error-message[data-for="email"]');
    await expect(emailError).toBeVisible();

    // Manually correct the field
    await page.locator('#email').fill('valid@example.com');
    await page.locator('#email').blur();

    // Wait for validation to clear
    await page.waitForTimeout(200);

    // Verify error is gone
    await expect(emailError).not.toBeVisible();
  });

  test('should resume filling after validation error is corrected', async ({ page }) => {
    // This test verifies the complete flow:
    // 1. Extension starts auto-fill
    // 2. Hits a validation error
    // 3. Pauses and notifies user
    // 4. User corrects the field
    // 5. Extension resumes filling remaining fields

    // TODO: This will fail until we implement the pause-resume behavior
    test.skip(true, 'Not yet implemented - AJH-67');

    // Expected behavior once implemented:
    // - Fill first 3 fields successfully
    // - Hit validation error on field 4 (email)
    // - Pause and show notification
    // - User corrects email manually
    // - User clicks "Continue"
    // - Extension resumes and fills fields 5-10
  });
});
