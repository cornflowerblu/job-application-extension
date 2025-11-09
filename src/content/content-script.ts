/**
 * Content Script - Injected into job application pages
 * Handles form detection, extraction, and filling
 */

// Type definitions
interface FormField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  placeholder?: string;
  maxLength?: number | null;
  options?: string[];
}

interface JobPosting {
  title: string;
  description: string;
}

interface ExtractedFormData {
  fields: FormField[];
  jobPosting: JobPosting;
  url: string;
}

interface FormFill {
  fieldId: string;
  value: string | boolean;
}

interface FillResult {
  filled: Array<{ fieldId: string; value: string | boolean }>;
  skipped: Array<{ fieldId: string; reason: string }>;
  errors: Array<{ fieldId: string; error: string }>;
}

interface ContentMessage {
  type: string;
  fills?: FormFill[];
}

interface ContentResponse {
  success: boolean;
  data?: ExtractedFormData | FillResult;
  error?: string;
}

console.log('Job Application Assistant: Content script loaded');

// Toast notification system with race condition prevention
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
const TOAST_ID = 'job-app-assistant-toast';
const TOAST_ANIMATION_MS = 300;
const TOAST_MAX_ZINDEX = 2147483647;

function showToast(message: string, type: 'info' | 'success' | 'error' = 'info', duration: number = 3000): void {
  // Clear any existing timeouts for this toast
  const existingTimeout = toastTimeouts.get(TOAST_ID);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
    toastTimeouts.delete(TOAST_ID);
  }

  // Remove existing toast if any
  const existingToast = document.getElementById(TOAST_ID);
  if (existingToast) {
    existingToast.remove();
  }

  // Create toast element
  const toast = document.createElement('div');
  toast.id = TOAST_ID;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');
  toast.setAttribute('aria-atomic', 'true');

  // Set styles based on type
  const bgColors = {
    info: '#3B82F6',
    success: '#10B981',
    error: '#EF4444'
  };

  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background-color: ${bgColors[type]};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    z-index: ${TOAST_MAX_ZINDEX};
    opacity: 0;
    transform: translateY(10px);
    transition: opacity 0.3s ease, transform 0.3s ease;
    max-width: 350px;
  `;

  toast.textContent = message;

  // Append to body
  document.body.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  // Auto-hide after duration
  const hideTimeout = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';

    const removeTimeout = setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
      toastTimeouts.delete(TOAST_ID);
    }, TOAST_ANIMATION_MS);

    toastTimeouts.set(TOAST_ID, removeTimeout);
  }, duration);

  toastTimeouts.set(TOAST_ID, hideTimeout);
}

// Cleanup on unload
window.addEventListener('unload', () => {
  toastTimeouts.forEach(timeout => clearTimeout(timeout));
  toastTimeouts.clear();
});

// Listen for messages from the popup or service worker
chrome.runtime.onMessage.addListener((message: ContentMessage, _sender, sendResponse: (response: ContentResponse) => void) => {
  console.log('Content script received message:', message);

  if (message.type === 'ANALYZE_FORM') {
    // Show analyzing toast
    showToast('Analyzing form...', 'info', 2000);

    analyzeForm()
      .then((formData) => {
        const fieldCount = formData.fields.length;
        showToast(`✓ Found ${fieldCount} form field${fieldCount !== 1 ? 's' : ''}`, 'success', 3000);
        sendResponse({ success: true, data: formData });
      })
      .catch((error: Error) => {
        console.error('Form analysis failed:', error);
        let errorMessage = 'Failed to analyze form on this page.';

        if (error.message.includes('No forms detected')) {
          errorMessage = 'No forms found on this page. Please navigate to a job application page.';
        } else if (error.message.includes('DOM access')) {
          errorMessage = 'Unable to access page content. Please refresh and try again.';
        } else if (error.message.includes('Permission denied')) {
          errorMessage = 'Permission denied. Please check if the extension has access to this site.';
        }

        showToast(errorMessage, 'error', 4000);
        sendResponse({ success: false, error: errorMessage });
      });
    return true; // Keep the message channel open for async response
  }

  if (message.type === 'FILL_FORM') {
    if (!message.fills || !Array.isArray(message.fills)) {
      const errorMsg = 'Invalid form fill data provided.';
      showToast(errorMsg, 'error', 3000);
      sendResponse({ success: false, error: errorMsg });
      return;
    }

    showToast('Filling form...', 'info', 2000);

    fillForm(message.fills)
      .then((result) => {
        const total = result.filled.length + result.skipped.length + result.errors.length;
        showToast(`✓ Filled ${result.filled.length} of ${total} fields`, 'success', 3000);
        sendResponse({ success: true, data: result });
      })
      .catch((error: Error) => {
        console.error('Form filling failed:', error);
        let errorMessage = 'Failed to fill form fields.';

        if (error.message.includes('Element not found')) {
          errorMessage = 'Some form fields could not be found. The page may have changed.';
        } else if (error.message.includes('Read-only')) {
          errorMessage = 'Some fields are read-only and cannot be filled automatically.';
        } else if (error.message.includes('Permission denied')) {
          errorMessage = 'Permission denied while accessing form fields.';
        }

        showToast(errorMessage, 'error', 4000);
        sendResponse({ success: false, error: errorMessage });
      });
    return true;
  }

  // Handle unknown message types
  console.warn('Unknown message type:', message.type);
  sendResponse({ success: false, error: 'Unknown command received.' });
});

/**
 * Analyze the current page for form fields
 */
async function analyzeForm(): Promise<ExtractedFormData> {
  console.log('Analyzing form on page...');

  try {
    // Check if we can access the DOM
    if (!document || !document.body) {
      throw new Error('DOM access not available. Page may still be loading.');
    }

    // Find all forms on the page
    const forms = document.querySelectorAll('form');

    if (forms.length === 0) {
      // Try to find form-like structures that might not use <form> tags
      const formLikeElements = document.querySelectorAll('[class*="form"], [id*="form"], [class*="application"], [id*="application"]');

      if (formLikeElements.length === 0) {
        // Provide helpful guidance
        const pageType = document.location.hostname;
        throw new Error(`No application forms found on this page (${pageType}). Try opening a job application page first, then use the keyboard shortcut or click "Analyze Form" again.`);
      }

      // If we found form-like elements, use the body as the form container
      console.log('No <form> tags found, but detected form-like elements. Analyzing entire page...');
    }

    // Extract fields from the first form (MVP simplification)
    const form = forms.length > 0 ? forms[0] : document.body;
    const fields = extractFields(form as HTMLElement);

    if (fields.length === 0) {
      const suggestion = forms.length > 0
        ? 'The form was found but contains no fillable fields. You may need to scroll down or navigate to the next step of the application.'
        : 'No fillable input fields were detected on this page. Make sure you\'re on an active job application form.';
      throw new Error(suggestion);
    }

    const jobPosting = extractJobPosting();

    console.log(`Successfully analyzed form: ${fields.length} fields found`);
    
    return {
      fields,
      jobPosting,
      url: window.location.href,
    };
    
  } catch (error) {
    console.error('Error during form analysis:', error);
    throw error instanceof Error ? error : new Error('Unknown error during form analysis');
  }
}

/**
 * Extract form fields and their metadata
 */
function extractFields(container: HTMLElement): FormField[] {
  const fields: FormField[] = [];

  // Text inputs (including date, url, and number)
  container.querySelectorAll<HTMLInputElement>('input[type="text"], input[type="email"], input[type="tel"], input[type="number"], input[type="date"], input[type="url"], input:not([type])').forEach((input) => {
    // Skip if input is disabled or hidden
    if (input.disabled || input.type === 'hidden' || input.style.display === 'none') {
      return;
    }

    // Generate a unique ID for this field
    const fieldId = input.id || input.name || `job-app-field-${fields.length}`;

    // Add data attribute to element so we can find it later
    input.setAttribute('data-job-app-field-id', fieldId);

    // For number and date inputs, include min/max attributes if present
    const fieldData: FormField = {
      id: fieldId,
      type: input.type || 'text',
      label: getFieldLabel(input),
      required: input.required,
      placeholder: input.placeholder || '',
      maxLength: input.maxLength > 0 ? input.maxLength : null,
    };

    fields.push(fieldData);
  });

  // Textareas
  container.querySelectorAll<HTMLTextAreaElement>('textarea').forEach((textarea) => {
    if (textarea.disabled || textarea.style.display === 'none') {
      return;
    }

    // Generate a unique ID for this field
    const fieldId = textarea.id || textarea.name || `job-app-field-${fields.length}`;

    // Add data attribute to element so we can find it later
    textarea.setAttribute('data-job-app-field-id', fieldId);

    fields.push({
      id: fieldId,
      type: 'textarea',
      label: getFieldLabel(textarea),
      required: textarea.required,
      placeholder: textarea.placeholder || '',
      maxLength: textarea.maxLength > 0 ? textarea.maxLength : null,
    });
  });

  // Select dropdowns
  container.querySelectorAll<HTMLSelectElement>('select').forEach((select) => {
    if (select.disabled || select.style.display === 'none') {
      return;
    }

    // Generate a unique ID for this field
    const fieldId = select.id || select.name || `job-app-field-${fields.length}`;

    // Add data attribute to element so we can find it later
    select.setAttribute('data-job-app-field-id', fieldId);

    const options = Array.from(select.options).map((opt) => opt.text || opt.value);
    fields.push({
      id: fieldId,
      type: 'select',
      label: getFieldLabel(select),
      required: select.required,
      options,
    });
  });

  // Radio buttons
  interface RadioGroup extends FormField {
    options: string[];
  }
  const radioGroups = new Map<string, RadioGroup>();
  container.querySelectorAll<HTMLInputElement>('input[type="radio"]').forEach((radio) => {
    if (radio.disabled || radio.style.display === 'none') {
      return;
    }

    const name = radio.name;

    // Add data attribute to each radio button using the group name
    radio.setAttribute('data-job-app-field-id', name);

    if (!radioGroups.has(name)) {
      radioGroups.set(name, {
        id: name,
        type: 'radio',
        label: getFieldLabel(radio),
        required: radio.required,
        options: [],
      });
    }

    const group = radioGroups.get(name)!;
    const label = getFieldLabel(radio);
    if (label && !group.options.includes(label)) {
      group.options.push(label);
    }
  });

  // Add radio groups to fields
  radioGroups.forEach((group) => {
    fields.push(group);
  });

  // Checkboxes
  container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach((checkbox) => {
    if (checkbox.disabled || checkbox.style.display === 'none') {
      return;
    }

    // Generate a unique ID for this field
    const fieldId = checkbox.id || checkbox.name || `job-app-field-${fields.length}`;

    // Add data attribute to element so we can find it later
    checkbox.setAttribute('data-job-app-field-id', fieldId);

    fields.push({
      id: fieldId,
      type: 'checkbox',
      label: getFieldLabel(checkbox),
      required: checkbox.required,
    });
  });

  return fields;
}

/**
 * Get the label text for a form field
 */
function getFieldLabel(element: HTMLElement): string {
  // Try label element
  if (element.id) {
    const label = document.querySelector<HTMLLabelElement>(`label[for="${element.id}"]`);
    if (label && label.textContent) return label.textContent.trim();
  }

  // Try parent label
  const parentLabel = element.closest<HTMLLabelElement>('label');
  if (parentLabel && parentLabel.textContent) return parentLabel.textContent.trim();

  // Try aria-label
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) {
    return ariaLabel;
  }

  // Try placeholder as fallback
  if ('placeholder' in element && element.placeholder) {
    return (element as HTMLInputElement | HTMLTextAreaElement).placeholder;
  }

  // Try name attribute
  if ('name' in element && element.name) {
    return (element.name as string).replace(/[-_]/g, ' ');
  }

  return 'Unlabeled field';
}

/**
 * Extract job posting information from the page
 */
function extractJobPosting(): JobPosting {
  // Try common selectors for job postings
  const selectors = [
    '.job-description',
    '.job-details',
    '[class*="job-posting"]',
    '[class*="description"]',
    'article',
    'main',
  ];

  for (const selector of selectors) {
    const element = document.querySelector<HTMLElement>(selector);
    if (element && element.textContent && element.textContent.length > 200) {
      return {
        title: document.title,
        description: element.textContent.trim().slice(0, 5000), // Limit to 5000 chars
      };
    }
  }

  // Fallback to page text
  return {
    title: document.title,
    description: (document.body.textContent || '').trim().slice(0, 5000),
  };
}

/**
 * Fill form with provided values
 */
async function fillForm(fills: FormFill[]): Promise<FillResult> {
  console.log('Filling form with provided values:', fills);

  const result: FillResult = {
    filled: [],
    skipped: [],
    errors: []
  };

  const total = fills.length;

  for (let i = 0; i < fills.length; i++) {
    const fill = fills[i];
    const current = i + 1;

    // Send progress update
    try {
      chrome.runtime.sendMessage({
        type: 'FILL_PROGRESS',
        current,
        total,
        fieldId: fill.fieldId
      }).catch(() => {
        // Ignore errors - popup might be closed
      });
    } catch (error) {
      // Ignore errors - popup might be closed
    }

    try {
      const element = findElementById(fill.fieldId);
      if (!element) {
        console.warn(`Element not found for field: ${fill.fieldId}`);
        result.skipped.push({
          fieldId: fill.fieldId,
          reason: 'Element not found on page'
        });
        continue;
      }

      await fillField(element, fill.value);

      // Check for validation errors after a brief delay to let validation run
      await new Promise((resolve) => setTimeout(resolve, 100));
      const validation = hasValidationError(element);

      if (validation.hasError) {
        console.warn(`Validation error on field ${fill.fieldId}: ${validation.message}`);
        result.errors.push({
          fieldId: fill.fieldId,
          error: `Validation error: ${validation.message}`
        });
      } else {
        result.filled.push({
          fieldId: fill.fieldId,
          value: fill.value
        });
      }
    } catch (error) {
      console.error(`Error filling field ${fill.fieldId}:`, error);
      result.errors.push({
        fieldId: fill.fieldId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  console.log('Form filling complete:', result);
  return result;
}

/**
 * Find an element by ID, name, or other attributes
 */
function findElementById(id: string): HTMLElement | null {
  // Try data attribute first (most reliable for our generated IDs)
  const byData = document.querySelector<HTMLElement>(`[data-job-app-field-id="${id}"]`);
  if (byData) return byData;

  // Try direct ID
  const byId = document.getElementById(id);
  if (byId) return byId;

  // Try name attribute
  const byName = document.querySelector<HTMLElement>(`[name="${id}"]`);
  if (byName) return byName;

  return null;
}

/**
 * Check if a field has validation errors
 */
function hasValidationError(element: HTMLElement): { hasError: boolean; message: string } {
  // Check aria-invalid
  if (element.getAttribute('aria-invalid') === 'true') {
    // Try to find associated error message via aria-describedby
    const describedBy = element.getAttribute('aria-describedby');
    if (describedBy) {
      const errorElement = document.getElementById(describedBy);
      if (errorElement && errorElement.textContent) {
        return { hasError: true, message: errorElement.textContent.trim() };
      }
    }
    return { hasError: true, message: 'Field has validation error' };
  }

  // Check for :invalid CSS pseudo-class
  if ((element as HTMLInputElement).validity && !(element as HTMLInputElement).validity.valid) {
    const validityState = (element as HTMLInputElement).validity;
    let message = 'Invalid input';

    if (validityState.valueMissing) message = 'This field is required';
    else if (validityState.typeMismatch) message = 'Invalid format';
    else if (validityState.patternMismatch) message = 'Does not match required pattern';
    else if (validityState.tooLong) message = 'Input is too long';
    else if (validityState.tooShort) message = 'Input is too short';
    else if (validityState.rangeOverflow) message = 'Value is too high';
    else if (validityState.rangeUnderflow) message = 'Value is too low';

    return { hasError: true, message };
  }

  // Check for error classes on the element itself
  const errorClasses = ['error', 'invalid', 'validation-error', 'has-error', 'is-invalid'];
  for (const errorClass of errorClasses) {
    if (element.classList.contains(errorClass)) {
      // Try to find adjacent error message
      const parent = element.parentElement;
      if (parent) {
        const errorMsg = parent.querySelector('.error-message, .invalid-feedback, .validation-message, [class*="error"]');
        if (errorMsg && errorMsg.textContent) {
          return { hasError: true, message: errorMsg.textContent.trim() };
        }
      }
      return { hasError: true, message: 'Field has validation error' };
    }
  }

  // Check for error classes on parent wrapper
  const parent = element.parentElement;
  if (parent) {
    for (const errorClass of errorClasses) {
      if (parent.classList.contains(errorClass)) {
        const errorMsg = parent.querySelector('.error-message, .invalid-feedback, .validation-message, [class*="error"]');
        if (errorMsg && errorMsg.textContent) {
          return { hasError: true, message: errorMsg.textContent.trim() };
        }
        return { hasError: true, message: 'Field has validation error' };
      }
    }
  }

  return { hasError: false, message: '' };
}

/**
 * Fill a single field with a value
 */
async function fillField(element: HTMLElement, value: string | boolean): Promise<void> {
  const tagName = element.tagName.toLowerCase();
  const type = (element as HTMLInputElement).type || 'text';

  if (tagName === 'input' && (type === 'text' || type === 'email' || type === 'tel')) {
    (element as HTMLInputElement).value = String(value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  } else if (tagName === 'input' && type === 'number') {
    // Handle number inputs with potential min/max validation
    const numberInput = element as HTMLInputElement;
    let numValue = parseFloat(String(value));

    // Validate that the value can be parsed to a number
    if (isNaN(numValue)) {
      console.warn(`[Job App Assistant] Cannot parse value "${value}" as a number for field. Skipping.`);
      return;
    }

    // Respect min/max if set
    if (numberInput.min && numValue < parseFloat(numberInput.min)) {
      numValue = parseFloat(numberInput.min);
    }
    if (numberInput.max && numValue > parseFloat(numberInput.max)) {
      numValue = parseFloat(numberInput.max);
    }

    numberInput.value = String(numValue);
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  } else if (tagName === 'input' && type === 'date') {
    // Handle date inputs - expect format YYYY-MM-DD
    const dateInput = element as HTMLInputElement;
    let dateValue = String(value);

    // Try to parse and format various date formats to YYYY-MM-DD
    if (dateValue && !dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Try to parse common date formats explicitly
      let parsedYear: number | null = null;
      let parsedMonth: number | null = null;
      let parsedDay: number | null = null;

      // MM/DD/YYYY
      let mdy = dateValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (mdy) {
        parsedYear = parseInt(mdy[3], 10);
        parsedMonth = parseInt(mdy[1], 10);
        parsedDay = parseInt(mdy[2], 10);
      }

      // DD/MM/YYYY
      let dmy = dateValue.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
      if (!mdy && dmy) {
        parsedYear = parseInt(dmy[3], 10);
        parsedMonth = parseInt(dmy[2], 10);
        parsedDay = parseInt(dmy[1], 10);
      }

      // YYYY/MM/DD
      let ymd = dateValue.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
      if (!mdy && !dmy && ymd) {
        parsedYear = parseInt(ymd[1], 10);
        parsedMonth = parseInt(ymd[2], 10);
        parsedDay = parseInt(ymd[3], 10);
      }

      if (
        parsedYear !== null &&
        parsedMonth !== null &&
        parsedDay !== null &&
        parsedMonth >= 1 && parsedMonth <= 12 &&
        parsedDay >= 1 && parsedDay <= 31
      ) {
        dateValue = `${parsedYear}-${String(parsedMonth).padStart(2, '0')}-${String(parsedDay).padStart(2, '0')}`;
      }
      // If none matched, leave as-is (do not attempt Date parsing)
    }

    dateInput.value = dateValue;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  } else if (tagName === 'input' && type === 'url') {
    // Handle URL inputs - basic validation
    const urlInput = element as HTMLInputElement;
    let urlValue = String(value);

    // Ensure URL has protocol if it looks like a URL
    if (urlValue && !urlValue.match(/^https?:\/\//i) && urlValue.includes('.')) {
      urlValue = `https://${urlValue}`;
    }

    urlInput.value = urlValue;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  } else if (tagName === 'textarea') {
    (element as HTMLTextAreaElement).value = String(value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  } else if (tagName === 'select') {
    const selectElement = element as HTMLSelectElement;
    // Try to find option by text or value (case-insensitive and flexible matching)
    const valueStr = String(value).toLowerCase().trim();

    // Try exact match first
    let option = Array.from(selectElement.options).find(
      (opt) => {
        const optText = opt.text.toLowerCase().trim();
        const optValue = opt.value.toLowerCase().trim();
        return optText === valueStr || optValue === valueStr;
      }
    );

    // Fall back to fuzzy match
    if (!option) {
      option = Array.from(selectElement.options).find(
        (opt) => {
          const optText = opt.text.toLowerCase().trim();
          const optValue = opt.value.toLowerCase().trim();
          return optText.includes(valueStr) || valueStr.includes(optText) ||
                 optValue.includes(valueStr) || valueStr.includes(optValue);
        }
      );
    }

    if (option) {
      selectElement.value = option.value;
      element.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      console.warn(`Could not find option "${value}" in select element`, selectElement);
    }
  } else if (type === 'radio') {
    // For radio buttons, element is one button in a group. We need to find the right one by value.
    const radioElement = element as HTMLInputElement;
    const name = radioElement.name;

    if (!name) {
      console.warn('Radio button has no name attribute, cannot fill:', element);
      return;
    }

    // Find all radio buttons in the same group
    const radioGroup = document.querySelectorAll<HTMLInputElement>(`input[type="radio"][name="${name}"]`);

    // Try to match by value or label text (case-insensitive)
    const valueStr = String(value).toLowerCase().trim();
    let matched = false;

    for (const radio of radioGroup) {
      // Check if value matches
      if (radio.value.toLowerCase().trim() === valueStr) {
        radio.checked = true;
        radio.dispatchEvent(new Event('change', { bubbles: true }));
        matched = true;
        break;
      }

      // Check if label text matches
      const label = getFieldLabel(radio).toLowerCase().trim();
      if (label === valueStr || label.includes(valueStr) || valueStr.includes(label)) {
        radio.checked = true;
        radio.dispatchEvent(new Event('change', { bubbles: true }));
        matched = true;
        break;
      }
    }

    if (!matched) {
      console.warn(`Could not find radio button with value "${value}" in group "${name}"`);
    }
  } else if (type === 'checkbox') {
    (element as HTMLInputElement).checked = value === true || value === 'true' || value === 'yes';
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // Small delay to let events propagate
  await new Promise((resolve) => setTimeout(resolve, 50));
}
