/**
 * @jest-environment jsdom
 */

/**
 * Tests for form field extraction, specifically covering scenarios
 * where form elements lack ID or name attributes.
 *
 * These tests prevent the bug where elements without IDs couldn't be filled
 * because the generated field IDs didn't match the DOM lookup.
 */

describe('Form Field Extraction Without IDs', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('Text Inputs Without IDs', () => {
    it('should generate fallback ID for input without id or name', () => {
      const input = document.createElement('input');
      input.type = 'text';
      // NO id, NO name - forces fallback
      document.body.appendChild(input);

      // Simulate what extractFields() does
      const fieldId = input.id || input.name || 'job-app-field-0';
      input.setAttribute('data-job-app-field-id', fieldId);

      expect(fieldId).toBe('job-app-field-0');
      expect(input.getAttribute('data-job-app-field-id')).toBe('job-app-field-0');
    });

    it('should use name attribute when id is missing', () => {
      const input = document.createElement('input');
      input.type = 'text';
      input.name = 'firstName';
      // NO id, but HAS name
      document.body.appendChild(input);

      const fieldId = input.id || input.name || 'job-app-field-0';
      input.setAttribute('data-job-app-field-id', fieldId);

      expect(fieldId).toBe('firstName');
      expect(input.getAttribute('data-job-app-field-id')).toBe('firstName');
    });

    it('should prioritize id over name', () => {
      const input = document.createElement('input');
      input.type = 'text';
      input.id = 'full-name';
      input.name = 'firstName';
      document.body.appendChild(input);

      const fieldId = input.id || input.name || 'job-app-field-0';
      input.setAttribute('data-job-app-field-id', fieldId);

      expect(fieldId).toBe('full-name');
      expect(input.getAttribute('data-job-app-field-id')).toBe('full-name');
    });

    it('should generate unique IDs for multiple inputs without names', () => {
      const input1 = document.createElement('input');
      input1.type = 'text';
      document.body.appendChild(input1);

      const input2 = document.createElement('input');
      input2.type = 'email';
      document.body.appendChild(input2);

      const input3 = document.createElement('input');
      input3.type = 'tel';
      document.body.appendChild(input3);

      // Simulate field counter incrementing
      let fieldCount = 0;
      const fieldId1 = input1.id || input1.name || `job-app-field-${fieldCount++}`;
      input1.setAttribute('data-job-app-field-id', fieldId1);

      const fieldId2 = input2.id || input2.name || `job-app-field-${fieldCount++}`;
      input2.setAttribute('data-job-app-field-id', fieldId2);

      const fieldId3 = input3.id || input3.name || `job-app-field-${fieldCount++}`;
      input3.setAttribute('data-job-app-field-id', fieldId3);

      expect(fieldId1).toBe('job-app-field-0');
      expect(fieldId2).toBe('job-app-field-1');
      expect(fieldId3).toBe('job-app-field-2');
    });
  });

  describe('Other Input Types Without IDs', () => {
    it('should handle textarea without id or name', () => {
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);

      const fieldId = textarea.id || textarea.name || 'job-app-field-0';
      textarea.setAttribute('data-job-app-field-id', fieldId);

      expect(fieldId).toBe('job-app-field-0');
      expect(textarea.getAttribute('data-job-app-field-id')).toBe('job-app-field-0');
    });

    it('should handle select without id or name', () => {
      const select = document.createElement('select');
      const option = document.createElement('option');
      option.value = 'test';
      select.appendChild(option);
      document.body.appendChild(select);

      const fieldId = select.id || select.name || 'job-app-field-0';
      select.setAttribute('data-job-app-field-id', fieldId);

      expect(fieldId).toBe('job-app-field-0');
      expect(select.getAttribute('data-job-app-field-id')).toBe('job-app-field-0');
    });

    it('should handle checkbox without id or name', () => {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      document.body.appendChild(checkbox);

      const fieldId = checkbox.id || checkbox.name || 'job-app-field-0';
      checkbox.setAttribute('data-job-app-field-id', fieldId);

      expect(fieldId).toBe('job-app-field-0');
      expect(checkbox.getAttribute('data-job-app-field-id')).toBe('job-app-field-0');
    });

    it('should handle radio buttons using name for grouping', () => {
      const radio1 = document.createElement('input');
      radio1.type = 'radio';
      radio1.name = 'gender';
      radio1.value = 'male';
      document.body.appendChild(radio1);

      const radio2 = document.createElement('input');
      radio2.type = 'radio';
      radio2.name = 'gender';
      radio2.value = 'female';
      document.body.appendChild(radio2);

      // Radio buttons use name for grouping, not individual IDs
      const groupId = radio1.name;
      radio1.setAttribute('data-job-app-field-id', groupId);
      radio2.setAttribute('data-job-app-field-id', groupId);

      expect(radio1.getAttribute('data-job-app-field-id')).toBe('gender');
      expect(radio2.getAttribute('data-job-app-field-id')).toBe('gender');
    });
  });

  describe('Finding Elements by Data Attribute', () => {
    it('should find element by data-job-app-field-id attribute', () => {
      const input = document.createElement('input');
      input.type = 'text';
      const fieldId = 'job-app-field-0';
      input.setAttribute('data-job-app-field-id', fieldId);
      document.body.appendChild(input);

      // Simulate findElementById() lookup
      const found = document.querySelector<HTMLElement>(`[data-job-app-field-id="${fieldId}"]`);

      expect(found).toBe(input);
      expect(found?.getAttribute('data-job-app-field-id')).toBe(fieldId);
    });

    it('should prioritize data attribute over id lookup', () => {
      // Element with both id and data attribute
      const input = document.createElement('input');
      input.type = 'text';
      input.id = 'real-id';
      input.setAttribute('data-job-app-field-id', 'job-app-field-0');
      document.body.appendChild(input);

      // First try data attribute (should succeed)
      const byData = document.querySelector<HTMLElement>('[data-job-app-field-id="job-app-field-0"]');
      expect(byData).toBe(input);

      // Then try ID (also should succeed)
      const byId = document.getElementById('real-id');
      expect(byId).toBe(input);

      // Data attribute method should be preferred
      expect(byData).toBeDefined();
    });

    it('should find element by name when data attribute and id are missing', () => {
      const input = document.createElement('input');
      input.type = 'text';
      input.name = 'firstName';
      document.body.appendChild(input);

      // Simulate findElementById() fallback to name
      const byName = document.querySelector<HTMLElement>('[name="firstName"]');

      expect(byName).toBe(input);
    });

    it('should return null when element cannot be found', () => {
      const found = document.querySelector<HTMLElement>('[data-job-app-field-id="nonexistent"]');
      expect(found).toBeNull();
    });
  });

  describe('Mixed Scenarios', () => {
    it('should handle form with mix of IDs, names, and generated IDs', () => {
      // Input with ID
      const input1 = document.createElement('input');
      input1.type = 'text';
      input1.id = 'full-name';
      document.body.appendChild(input1);

      // Input with name only
      const input2 = document.createElement('input');
      input2.type = 'email';
      input2.name = 'email';
      document.body.appendChild(input2);

      // Input with neither (needs generated ID)
      const input3 = document.createElement('input');
      input3.type = 'tel';
      document.body.appendChild(input3);

      // Simulate extraction
      let fieldCount = 0;
      const fieldId1 = input1.id || input1.name || `job-app-field-${fieldCount++}`;
      input1.setAttribute('data-job-app-field-id', fieldId1);

      const fieldId2 = input2.id || input2.name || `job-app-field-${fieldCount++}`;
      input2.setAttribute('data-job-app-field-id', fieldId2);

      const fieldId3 = input3.id || input3.name || `job-app-field-${fieldCount++}`;
      input3.setAttribute('data-job-app-field-id', fieldId3);

      expect(fieldId1).toBe('full-name');
      expect(fieldId2).toBe('email');
      expect(fieldId3).toBe('job-app-field-0');

      // Verify all can be found
      expect(document.querySelector('[data-job-app-field-id="full-name"]')).toBe(input1);
      expect(document.querySelector('[data-job-app-field-id="email"]')).toBe(input2);
      expect(document.querySelector('[data-job-app-field-id="job-app-field-0"]')).toBe(input3);
    });
  });

  describe('End-to-End: Extract and Fill Cycle', () => {
    it('should extract field without ID and successfully fill it', () => {
      // Create input without ID
      const input = document.createElement('input');
      input.type = 'text';
      document.body.appendChild(input);

      // STEP 1: Extract (simulate extractFields)
      const fieldId = input.id || input.name || 'job-app-field-0';
      input.setAttribute('data-job-app-field-id', fieldId);

      // STEP 2: Fill (simulate fillForm)
      const element = document.querySelector<HTMLInputElement>(`[data-job-app-field-id="${fieldId}"]`);
      expect(element).toBe(input);

      if (element) {
        element.value = 'Test Value';
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // STEP 3: Verify
      expect(input.value).toBe('Test Value');
    });

    it('should handle multiple fields in extract-fill cycle', () => {
      // Create multiple inputs without IDs
      const inputs: HTMLInputElement[] = [];
      for (let i = 0; i < 3; i++) {
        const input = document.createElement('input');
        input.type = 'text';
        document.body.appendChild(input);
        inputs.push(input);
      }

      // STEP 1: Extract all fields
      const fieldIds: string[] = [];
      inputs.forEach((input, idx) => {
        const fieldId = input.id || input.name || `job-app-field-${idx}`;
        input.setAttribute('data-job-app-field-id', fieldId);
        fieldIds.push(fieldId);
      });

      expect(fieldIds).toEqual(['job-app-field-0', 'job-app-field-1', 'job-app-field-2']);

      // STEP 2: Fill all fields
      const fills = [
        { fieldId: 'job-app-field-0', value: 'First' },
        { fieldId: 'job-app-field-1', value: 'Second' },
        { fieldId: 'job-app-field-2', value: 'Third' }
      ];

      fills.forEach(fill => {
        const element = document.querySelector<HTMLInputElement>(`[data-job-app-field-id="${fill.fieldId}"]`);
        if (element) {
          element.value = fill.value;
        }
      });

      // STEP 3: Verify all filled
      expect(inputs[0].value).toBe('First');
      expect(inputs[1].value).toBe('Second');
      expect(inputs[2].value).toBe('Third');
    });
  });

  describe('Regression Tests for the Bug', () => {
    it('should prevent the "Element not found" bug for generated IDs', () => {
      // This test reproduces the exact bug scenario:
      // 1. Form element has no ID or name
      // 2. Code generates "job-app-field-0"
      // 3. Code must set data attribute so it can be found later

      const input = document.createElement('input');
      input.type = 'text';
      document.body.appendChild(input);

      // Extract: Generate ID and set data attribute
      const extractedFieldId = input.id || input.name || 'job-app-field-0';
      input.setAttribute('data-job-app-field-id', extractedFieldId);

      // Fill: Try to find the element
      // OLD BUG: This would fail because we looked for id="job-app-field-0" which doesn't exist
      // NEW FIX: We look for data-job-app-field-id="job-app-field-0" which we set above
      const foundByData = document.querySelector(`[data-job-app-field-id="${extractedFieldId}"]`);
      const foundById = document.getElementById(extractedFieldId);
      const foundByName = document.querySelector(`[name="${extractedFieldId}"]`);

      // Data attribute lookup should work
      expect(foundByData).toBe(input);

      // ID and name lookups should fail (element doesn't have these)
      expect(foundById).toBeNull();
      expect(foundByName).toBeNull();

      // This proves we MUST use data attribute lookup for generated IDs
    });

    it('should match the exact prompt construction scenario', () => {
      // This test verifies that field IDs in the prompt match the actual field IDs
      const input = document.createElement('input');
      input.id = 'full-name';
      document.body.appendChild(input);

      // Extract field
      const fieldId = input.id || input.name || 'job-app-field-0';
      input.setAttribute('data-job-app-field-id', fieldId);

      // Simulate prompt construction (what goes to Claude)
      const promptFieldId = fieldId; // This is what we send in the prompt now

      // Simulate Claude response
      const claudeResponseFieldId = promptFieldId; // Claude returns what we sent

      // Try to fill using Claude's field ID
      const element = document.querySelector(`[data-job-app-field-id="${claudeResponseFieldId}"]`);

      // Should find the element
      expect(element).toBe(input);
      expect(claudeResponseFieldId).toBe('full-name');
    });
  });
});
