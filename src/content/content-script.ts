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

interface ContentMessage {
  type: string;
  fills?: FormFill[];
}

interface ContentResponse {
  success: boolean;
  data?: ExtractedFormData;
  error?: string;
}

console.log('Job Application Assistant: Content script loaded');

// Listen for messages from the popup or service worker
chrome.runtime.onMessage.addListener((message: ContentMessage, _sender, sendResponse: (response: ContentResponse) => void) => {
  console.log('Content script received message:', message);

  if (message.type === 'ANALYZE_FORM') {
    analyzeForm()
      .then((formData) => {
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
        
        sendResponse({ success: false, error: errorMessage });
      });
    return true; // Keep the message channel open for async response
  }

  if (message.type === 'FILL_FORM') {
    if (!message.fills || !Array.isArray(message.fills)) {
      sendResponse({ success: false, error: 'Invalid form fill data provided.' });
      return;
    }
    
    fillForm(message.fills)
      .then(() => {
        sendResponse({ success: true });
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
        throw new Error('No forms detected on this page. Please navigate to a job application page with forms.');
      }
      
      // If we found form-like elements, use the body as the form container
      console.log('No <form> tags found, but detected form-like elements. Analyzing entire page...');
    }

    // Extract fields from the first form (MVP simplification)
    const form = forms.length > 0 ? forms[0] : document.body;
    const fields = extractFields(form as HTMLElement);
    
    if (fields.length === 0) {
      throw new Error('No fillable form fields found on this page.');
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

  // Text inputs
  container.querySelectorAll<HTMLInputElement>('input[type="text"], input[type="email"], input[type="tel"], input[type="number"], input:not([type])').forEach((input) => {
    // Skip if input is disabled or hidden
    if (input.disabled || input.type === 'hidden' || input.style.display === 'none') {
      return;
    }
    
    fields.push({
      id: input.id || input.name || `field-${fields.length}`,
      type: input.type || 'text',
      label: getFieldLabel(input),
      required: input.required,
      placeholder: input.placeholder || '',
      maxLength: input.maxLength > 0 ? input.maxLength : null,
    });
  });

  // Textareas
  container.querySelectorAll<HTMLTextAreaElement>('textarea').forEach((textarea) => {
    if (textarea.disabled || textarea.style.display === 'none') {
      return;
    }
    
    fields.push({
      id: textarea.id || textarea.name || `field-${fields.length}`,
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
    
    const options = Array.from(select.options).map((opt) => opt.text || opt.value);
    fields.push({
      id: select.id || select.name || `field-${fields.length}`,
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
    
    fields.push({
      id: checkbox.id || checkbox.name || `field-${fields.length}`,
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
async function fillForm(fills: FormFill[]): Promise<void> {
  console.log('Filling form with provided values:', fills);

  for (const fill of fills) {
    try {
      const element = findElementById(fill.fieldId);
      if (!element) {
        console.warn(`Element not found for field: ${fill.fieldId}`);
        continue;
      }

      await fillField(element, fill.value);
    } catch (error) {
      console.error(`Error filling field ${fill.fieldId}:`, error);
      throw error;
    }
  }

  console.log('Form filling complete');
}

/**
 * Find an element by ID, name, or other attributes
 */
function findElementById(id: string): HTMLElement | null {
  return document.getElementById(id) ||
         document.querySelector<HTMLElement>(`[name="${id}"]`) ||
         document.querySelector<HTMLElement>(`[data-field-id="${id}"]`);
}

/**
 * Fill a single field with a value
 */
async function fillField(element: HTMLElement, value: string | boolean): Promise<void> {
  const tagName = element.tagName.toLowerCase();
  const type = (element as HTMLInputElement).type || 'text';

  if (tagName === 'input' && (type === 'text' || type === 'email' || type === 'tel' || type === 'number')) {
    (element as HTMLInputElement).value = String(value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  } else if (tagName === 'textarea') {
    (element as HTMLTextAreaElement).value = String(value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  } else if (tagName === 'select') {
    const selectElement = element as HTMLSelectElement;
    const option = Array.from(selectElement.options).find(
      (opt) => opt.text === value || opt.value === value
    );
    if (option) {
      selectElement.value = option.value;
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }
  } else if (type === 'radio') {
    (element as HTMLInputElement).checked = true;
    element.dispatchEvent(new Event('change', { bubbles: true }));
  } else if (type === 'checkbox') {
    (element as HTMLInputElement).checked = value === true || value === 'true' || value === 'yes';
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // Small delay to let events propagate
  await new Promise((resolve) => setTimeout(resolve, 50));
}
