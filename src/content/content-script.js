/**
 * Content Script - Injected into job application pages
 * Handles form detection, extraction, and filling
 */

console.log('Job Application Assistant: Content script loaded');

// Listen for messages from the popup or service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);

  if (message.type === 'ANALYZE_FORM') {
    analyzeForm()
      .then((formData) => {
        sendResponse({ success: true, data: formData });
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep the message channel open for async response
  }

  if (message.type === 'FILL_FORM') {
    fillForm(message.fills)
      .then(() => {
        sendResponse({ success: true });
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
});

/**
 * Analyze the current page for form fields
 */
async function analyzeForm() {
  console.log('Analyzing form on page...');

  // Find all forms on the page
  const forms = document.querySelectorAll('form');

  if (forms.length === 0) {
    throw new Error('No forms detected on this page');
  }

  // Extract fields from the first form (MVP simplification)
  const form = forms[0];
  const fields = extractFields(form);
  const jobPosting = extractJobPosting();

  return {
    fields,
    jobPosting,
    url: window.location.href,
  };
}

/**
 * Extract form fields and their metadata
 */
function extractFields(form) {
  const fields = [];

  // Text inputs
  form.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="number"], input:not([type])').forEach((input) => {
    fields.push({
      id: input.id || input.name || `field-${fields.length}`,
      type: input.type || 'text',
      label: getFieldLabel(input),
      required: input.required,
      placeholder: input.placeholder || '',
      maxLength: input.maxLength > 0 ? input.maxLength : null,
      element: null, // Don't serialize the element
    });
  });

  // Textareas
  form.querySelectorAll('textarea').forEach((textarea) => {
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
  form.querySelectorAll('select').forEach((select) => {
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
  const radioGroups = new Map();
  form.querySelectorAll('input[type="radio"]').forEach((radio) => {
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
    radioGroups.get(name).options.push(radio.value || radio.id);
  });
  radioGroups.forEach((group) => fields.push(group));

  // Checkboxes
  form.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
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
function getFieldLabel(element) {
  // Try label element
  if (element.id) {
    const label = document.querySelector(`label[for="${element.id}"]`);
    if (label) return label.textContent.trim();
  }

  // Try parent label
  const parentLabel = element.closest('label');
  if (parentLabel) return parentLabel.textContent.trim();

  // Try aria-label
  if (element.getAttribute('aria-label')) {
    return element.getAttribute('aria-label');
  }

  // Try placeholder as fallback
  if (element.placeholder) {
    return element.placeholder;
  }

  // Try name attribute
  if (element.name) {
    return element.name.replace(/[-_]/g, ' ');
  }

  return 'Unlabeled field';
}

/**
 * Extract job posting information from the page
 */
function extractJobPosting() {
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
    const element = document.querySelector(selector);
    if (element && element.textContent.length > 200) {
      return {
        title: document.title,
        description: element.textContent.trim().slice(0, 5000), // Limit to 5000 chars
      };
    }
  }

  // Fallback to page text
  return {
    title: document.title,
    description: document.body.textContent.trim().slice(0, 5000),
  };
}

/**
 * Fill form with provided values
 */
async function fillForm(fills) {
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
function findElementById(id) {
  return document.getElementById(id) ||
         document.querySelector(`[name="${id}"]`) ||
         document.querySelector(`[data-field-id="${id}"]`);
}

/**
 * Fill a single field with a value
 */
async function fillField(element, value) {
  const tagName = element.tagName.toLowerCase();
  const type = element.type || 'text';

  if (tagName === 'input' && (type === 'text' || type === 'email' || type === 'tel' || type === 'number')) {
    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  } else if (tagName === 'textarea') {
    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  } else if (tagName === 'select') {
    const option = Array.from(element.options).find(
      (opt) => opt.text === value || opt.value === value
    );
    if (option) {
      element.value = option.value;
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }
  } else if (type === 'radio') {
    element.checked = true;
    element.dispatchEvent(new Event('change', { bubbles: true }));
  } else if (type === 'checkbox') {
    element.checked = value === true || value === 'true' || value === 'yes';
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // Small delay to let events propagate
  await new Promise((resolve) => setTimeout(resolve, 50));
}
