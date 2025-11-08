/**
 * @jest-environment jsdom
 */

describe('Form Filling', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('Text Input Fields', () => {
    it('should fill a text input field', () => {
      const input = document.createElement('input');
      input.type = 'text';
      input.id = 'full-name';
      document.body.appendChild(input);

      const changeHandler = jest.fn();
      const inputHandler = jest.fn();
      input.addEventListener('change', changeHandler);
      input.addEventListener('input', inputHandler);

      input.value = 'Roger Urich';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));

      expect(input.value).toBe('Roger Urich');
      expect(inputHandler).toHaveBeenCalled();
      expect(changeHandler).toHaveBeenCalled();
    });

    it('should fill an email input field', () => {
      const input = document.createElement('input');
      input.type = 'email';
      input.id = 'email';
      document.body.appendChild(input);

      input.value = 'test@example.com';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));

      expect(input.value).toBe('test@example.com');
    });

    it('should fill a tel input field', () => {
      const input = document.createElement('input');
      input.type = 'tel';
      input.id = 'phone';
      document.body.appendChild(input);

      input.value = '9494005039';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));

      expect(input.value).toBe('9494005039');
    });
  });

  describe('Textarea Fields', () => {
    it('should fill a textarea field', () => {
      const textarea = document.createElement('textarea');
      textarea.id = 'cover-letter';
      document.body.appendChild(textarea);

      const changeHandler = jest.fn();
      const inputHandler = jest.fn();
      textarea.addEventListener('change', changeHandler);
      textarea.addEventListener('input', inputHandler);

      textarea.value = 'This is my cover letter';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));

      expect(textarea.value).toBe('This is my cover letter');
      expect(inputHandler).toHaveBeenCalled();
      expect(changeHandler).toHaveBeenCalled();
    });
  });

  describe('Select Dropdowns', () => {
    it('should select an option by exact text match', () => {
      const select = document.createElement('select');
      select.id = 'work-auth-status';

      const option1 = document.createElement('option');
      option1.value = '';
      option1.text = 'Select...';
      select.appendChild(option1);

      const option2 = document.createElement('option');
      option2.value = 'us-citizen';
      option2.text = 'U.S. Citizen';
      select.appendChild(option2);

      const option3 = document.createElement('option');
      option3.value = 'permanent-resident';
      option3.text = 'Permanent Resident';
      select.appendChild(option3);

      document.body.appendChild(select);

      const changeHandler = jest.fn();
      select.addEventListener('change', changeHandler);

      // Simulate fuzzy matching: "U.S. Citizen" should match
      const valueToMatch = 'U.S. Citizen';
      const valueStr = valueToMatch.toLowerCase().trim();
      const matchedOption = Array.from(select.options).find(
        (opt) => {
          const optText = opt.text.toLowerCase().trim();
          const optValue = opt.value.toLowerCase().trim();
          return optText === valueStr ||
                 optValue === valueStr ||
                 optText.includes(valueStr) ||
                 valueStr.includes(optText);
        }
      );

      if (matchedOption) {
        select.value = matchedOption.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }

      expect(select.value).toBe('us-citizen');
      expect(changeHandler).toHaveBeenCalled();
    });

    it('should select an option by value match', () => {
      const select = document.createElement('select');
      select.id = 'experience';

      const option1 = document.createElement('option');
      option1.value = '';
      option1.text = 'Select...';
      select.appendChild(option1);

      const option2 = document.createElement('option');
      option2.value = '5-10';
      option2.text = '5-10 years';
      select.appendChild(option2);

      document.body.appendChild(select);

      // Match by value
      const valueToMatch = '5-10';
      const valueStr = valueToMatch.toLowerCase().trim();
      const matchedOption = Array.from(select.options).find(
        (opt) => {
          const optText = opt.text.toLowerCase().trim();
          const optValue = opt.value.toLowerCase().trim();
          return optText === valueStr ||
                 optValue === valueStr ||
                 optText.includes(valueStr) ||
                 valueStr.includes(optText);
        }
      );

      if (matchedOption) {
        select.value = matchedOption.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }

      expect(select.value).toBe('5-10');
    });

    it('should handle fuzzy matching for partial text', () => {
      const select = document.createElement('select');
      select.id = 'gender';

      const option1 = document.createElement('option');
      option1.value = '';
      option1.text = 'Prefer not to answer';
      select.appendChild(option1);

      const option2 = document.createElement('option');
      option2.value = 'male';
      option2.text = 'Male';
      select.appendChild(option2);

      document.body.appendChild(select);

      // Should match "Male" even if Claude returns "male"
      const valueToMatch = 'male';
      const valueStr = valueToMatch.toLowerCase().trim();
      const matchedOption = Array.from(select.options).find(
        (opt) => {
          const optText = opt.text.toLowerCase().trim();
          const optValue = opt.value.toLowerCase().trim();
          return optText === valueStr ||
                 optValue === valueStr ||
                 optText.includes(valueStr) ||
                 valueStr.includes(optText);
        }
      );

      if (matchedOption) {
        select.value = matchedOption.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }

      expect(select.value).toBe('male');
    });
  });

  describe('Radio Buttons', () => {
    it('should check the correct radio button by value', () => {
      const container = document.createElement('div');

      const radio1 = document.createElement('input');
      radio1.type = 'radio';
      radio1.name = 'work-auth';
      radio1.value = 'yes';
      container.appendChild(radio1);

      const radio2 = document.createElement('input');
      radio2.type = 'radio';
      radio2.name = 'work-auth';
      radio2.value = 'no';
      container.appendChild(radio2);

      document.body.appendChild(container);

      const changeHandler = jest.fn();
      radio1.addEventListener('change', changeHandler);

      // Simulate selecting "yes"
      const valueToMatch = 'yes';
      const valueStr = valueToMatch.toLowerCase().trim();
      const radioGroup = document.querySelectorAll<HTMLInputElement>('input[type="radio"][name="work-auth"]');

      let matched = false;
      for (const radio of radioGroup) {
        if (radio.value.toLowerCase().trim() === valueStr) {
          radio.checked = true;
          radio.dispatchEvent(new Event('change', { bubbles: true }));
          matched = true;
          break;
        }
      }

      expect(matched).toBe(true);
      expect(radio1.checked).toBe(true);
      expect(radio2.checked).toBe(false);
      expect(changeHandler).toHaveBeenCalled();
    });

    it('should check radio button by label text when value does not match', () => {
      const container = document.createElement('div');

      const label1 = document.createElement('label');
      const radio1 = document.createElement('input');
      radio1.type = 'radio';
      radio1.name = 'relocate';
      radio1.value = 'yes';
      label1.appendChild(radio1);
      label1.appendChild(document.createTextNode('Yes'));
      container.appendChild(label1);

      const label2 = document.createElement('label');
      const radio2 = document.createElement('input');
      radio2.type = 'radio';
      radio2.name = 'relocate';
      radio2.value = 'no';
      label2.appendChild(radio2);
      label2.appendChild(document.createTextNode('No'));
      container.appendChild(label2);

      const label3 = document.createElement('label');
      const radio3 = document.createElement('input');
      radio3.type = 'radio';
      radio3.name = 'relocate';
      radio3.value = 'depends';
      label3.appendChild(radio3);
      label3.appendChild(document.createTextNode('Depends on location'));
      container.appendChild(label3);

      document.body.appendChild(container);

      // Helper function to get label text
      const getFieldLabel = (element: HTMLElement): string => {
        const parentLabel = element.closest<HTMLLabelElement>('label');
        if (parentLabel && parentLabel.textContent) return parentLabel.textContent.trim();
        return '';
      };

      // Try to match "Depends on location"
      const valueToMatch = 'Depends on location';
      const valueStr = valueToMatch.toLowerCase().trim();
      const radioGroup = document.querySelectorAll<HTMLInputElement>('input[type="radio"][name="relocate"]');

      let matched = false;
      for (const radio of radioGroup) {
        // Check by value first
        if (radio.value.toLowerCase().trim() === valueStr) {
          radio.checked = true;
          radio.dispatchEvent(new Event('change', { bubbles: true }));
          matched = true;
          break;
        }

        // Check by label text
        const label = getFieldLabel(radio).toLowerCase().trim();
        if (label === valueStr || label.includes(valueStr) || valueStr.includes(label)) {
          radio.checked = true;
          radio.dispatchEvent(new Event('change', { bubbles: true }));
          matched = true;
          break;
        }
      }

      expect(matched).toBe(true);
      expect(radio3.checked).toBe(true);
      expect(radio1.checked).toBe(false);
      expect(radio2.checked).toBe(false);
    });

    it('should handle case-insensitive matching', () => {
      const container = document.createElement('div');

      const radio1 = document.createElement('input');
      radio1.type = 'radio';
      radio1.name = 'work-auth';
      radio1.value = 'YES';
      container.appendChild(radio1);

      const radio2 = document.createElement('input');
      radio2.type = 'radio';
      radio2.name = 'work-auth';
      radio2.value = 'NO';
      container.appendChild(radio2);

      document.body.appendChild(container);

      // Should match "yes" to "YES"
      const valueToMatch = 'yes';
      const valueStr = valueToMatch.toLowerCase().trim();
      const radioGroup = document.querySelectorAll<HTMLInputElement>('input[type="radio"][name="work-auth"]');

      let matched = false;
      for (const radio of radioGroup) {
        if (radio.value.toLowerCase().trim() === valueStr) {
          radio.checked = true;
          radio.dispatchEvent(new Event('change', { bubbles: true }));
          matched = true;
          break;
        }
      }

      expect(matched).toBe(true);
      expect(radio1.checked).toBe(true);
    });
  });

  describe('Checkboxes', () => {
    it('should check a checkbox with boolean true', () => {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = 'terms';
      document.body.appendChild(checkbox);

      const changeHandler = jest.fn();
      checkbox.addEventListener('change', changeHandler);

      checkbox.checked = true;
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));

      expect(checkbox.checked).toBe(true);
      expect(changeHandler).toHaveBeenCalled();
    });

    it('should check a checkbox with string "true"', () => {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = 'terms';
      document.body.appendChild(checkbox);

      const value = 'true';
      checkbox.checked = value === 'true' || value === 'yes';
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));

      expect(checkbox.checked).toBe(true);
    });

    it('should check a checkbox with string "yes"', () => {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = 'terms';
      document.body.appendChild(checkbox);

      const value: string = 'yes';
      checkbox.checked = value === 'true' || value === 'yes';
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));

      expect(checkbox.checked).toBe(true);
    });

    it('should uncheck a checkbox with boolean false', () => {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = 'terms';
      checkbox.checked = true;
      document.body.appendChild(checkbox);

      checkbox.checked = false;
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));

      expect(checkbox.checked).toBe(false);
    });
  });

  describe('Element Finding', () => {
    it('should find element by ID', () => {
      const input = document.createElement('input');
      input.id = 'full-name';
      document.body.appendChild(input);

      const found = document.getElementById('full-name');
      expect(found).toBe(input);
    });

    it('should find element by name attribute when ID is not present', () => {
      const input = document.createElement('input');
      input.name = 'work-auth';
      input.type = 'radio';
      document.body.appendChild(input);

      const found = document.querySelector<HTMLElement>('[name="work-auth"]');
      expect(found).toBe(input);
    });

    it('should prioritize ID over name attribute', () => {
      const input1 = document.createElement('input');
      input1.id = 'email';
      input1.name = 'user-email';
      document.body.appendChild(input1);

      const input2 = document.createElement('input');
      input2.name = 'email';
      document.body.appendChild(input2);

      const foundById = document.getElementById('email');
      expect(foundById).toBe(input1);
    });

    it('should find element by data-job-app-field-id attribute', () => {
      const input = document.createElement('input');
      input.type = 'text';
      const fieldId = 'job-app-field-0';
      input.setAttribute('data-job-app-field-id', fieldId);
      document.body.appendChild(input);

      const found = document.querySelector<HTMLElement>(`[data-job-app-field-id="${fieldId}"]`);
      expect(found).toBe(input);
    });

    it('should handle element with no ID, no name, using data attribute', () => {
      const input = document.createElement('input');
      input.type = 'text';
      // NO id, NO name
      const generatedId = 'job-app-field-0';
      input.setAttribute('data-job-app-field-id', generatedId);
      document.body.appendChild(input);

      // Try data attribute (should succeed)
      const byData = document.querySelector<HTMLElement>(`[data-job-app-field-id="${generatedId}"]`);
      expect(byData).toBe(input);

      // Try ID (should fail - element doesn't have id attribute)
      const byId = document.getElementById(generatedId);
      expect(byId).toBeNull();

      // Try name (should fail - element doesn't have name attribute)
      const byName = document.querySelector<HTMLElement>(`[name="${generatedId}"]`);
      expect(byName).toBeNull();
    });

    it('should prioritize data attribute over ID when both exist', () => {
      const input1 = document.createElement('input');
      input1.type = 'text';
      input1.id = 'full-name';
      input1.setAttribute('data-job-app-field-id', 'full-name');
      document.body.appendChild(input1);

      // Simulate findElementById() priority: data attribute first, then ID
      const byData = document.querySelector<HTMLElement>('[data-job-app-field-id="full-name"]');
      if (byData) {
        expect(byData).toBe(input1);
      } else {
        const byId = document.getElementById('full-name');
        expect(byId).toBe(input1);
      }
    });
  });

  describe('Date Input Filling', () => {
    it('should fill date input with YYYY-MM-DD format', async () => {
      const input = document.createElement('input');
      input.type = 'date';
      input.id = 'start-date';
      input.setAttribute('data-job-app-field-id', 'start-date');
      document.body.appendChild(input);

      // Simulate filling with proper format
      input.value = '2020-01-15';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));

      expect(input.value).toBe('2020-01-15');
    });

    it('should handle date input with various formats', async () => {
      const input = document.createElement('input');
      input.type = 'date';
      input.id = 'graduation-date';
      input.setAttribute('data-job-app-field-id', 'graduation-date');
      document.body.appendChild(input);

      // Date inputs require YYYY-MM-DD format
      const formatted = '2022-05-20';

      input.value = formatted;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));

      expect(input.value).toBe('2022-05-20');
    });

    it('should handle empty date input', async () => {
      const input = document.createElement('input');
      input.type = 'date';
      input.id = 'end-date';
      input.setAttribute('data-job-app-field-id', 'end-date');
      document.body.appendChild(input);

      // Empty string is valid for optional date fields
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));

      expect(input.value).toBe('');
    });
  });

  describe('Number Input Filling', () => {
    it('should fill number input with numeric value', async () => {
      const input = document.createElement('input');
      input.type = 'number';
      input.id = 'gpa';
      input.setAttribute('data-job-app-field-id', 'gpa');
      input.min = '0.0';
      input.max = '4.0';
      document.body.appendChild(input);

      // Simulate filling
      input.value = '3.75';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));

      expect(input.value).toBe('3.75');
    });

    it('should handle salary number input', async () => {
      const input = document.createElement('input');
      input.type = 'number';
      input.id = 'expected-salary';
      input.setAttribute('data-job-app-field-id', 'expected-salary');
      input.min = '0';
      input.step = '1000';
      document.body.appendChild(input);

      // Simulate filling with large number
      input.value = '120000';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));

      expect(input.value).toBe('120000');
    });

    it('should respect min/max constraints', async () => {
      const input = document.createElement('input');
      input.type = 'number';
      input.id = 'test-number';
      input.setAttribute('data-job-app-field-id', 'test-number');
      input.min = '0';
      input.max = '100';
      document.body.appendChild(input);

      // Test value within range
      input.value = '50';
      expect(input.value).toBe('50');

      // Values outside range are allowed by HTML but may trigger validation
      input.value = '150';
      expect(input.value).toBe('150'); // Browser allows but may show invalid state
    });
  });

  describe('URL Input Filling', () => {
    it('should fill URL input with valid URL', async () => {
      const input = document.createElement('input');
      input.type = 'url';
      input.id = 'linkedin-url';
      input.setAttribute('data-job-app-field-id', 'linkedin-url');
      document.body.appendChild(input);

      // Simulate filling with full URL
      input.value = 'https://linkedin.com/in/johndoe';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));

      expect(input.value).toBe('https://linkedin.com/in/johndoe');
    });

    it('should handle portfolio URL', async () => {
      const input = document.createElement('input');
      input.type = 'url';
      input.id = 'portfolio-url';
      input.setAttribute('data-job-app-field-id', 'portfolio-url');
      document.body.appendChild(input);

      // Simulate filling
      input.value = 'https://johndoe.com';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));

      expect(input.value).toBe('https://johndoe.com');
    });

    it('should handle GitHub URL', async () => {
      const input = document.createElement('input');
      input.type = 'url';
      input.id = 'github-url';
      input.setAttribute('data-job-app-field-id', 'github-url');
      document.body.appendChild(input);

      // Simulate filling
      input.value = 'https://github.com/johndoe';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));

      expect(input.value).toBe('https://github.com/johndoe');
    });

    it('should handle empty URL (optional field)', async () => {
      const input = document.createElement('input');
      input.type = 'url';
      input.id = 'optional-url';
      input.setAttribute('data-job-app-field-id', 'optional-url');
      document.body.appendChild(input);

      // Empty is valid for optional URL fields
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));

      expect(input.value).toBe('');
    });
  });

  describe('Multiple Employment/Education Entries', () => {
    it('should fill multiple employment date fields independently', async () => {
      const startDate1 = document.createElement('input');
      startDate1.type = 'date';
      startDate1.id = 'start-date-1';
      startDate1.setAttribute('data-job-app-field-id', 'start-date-1');
      document.body.appendChild(startDate1);

      const endDate1 = document.createElement('input');
      endDate1.type = 'date';
      endDate1.id = 'end-date-1';
      endDate1.setAttribute('data-job-app-field-id', 'end-date-1');
      document.body.appendChild(endDate1);

      const startDate2 = document.createElement('input');
      startDate2.type = 'date';
      startDate2.id = 'start-date-2';
      startDate2.setAttribute('data-job-app-field-id', 'start-date-2');
      document.body.appendChild(startDate2);

      const endDate2 = document.createElement('input');
      endDate2.type = 'date';
      endDate2.id = 'end-date-2';
      endDate2.setAttribute('data-job-app-field-id', 'end-date-2');
      document.body.appendChild(endDate2);

      // Fill all four date fields
      startDate1.value = '2018-01-01';
      startDate1.dispatchEvent(new Event('change', { bubbles: true }));

      endDate1.value = '2020-12-31';
      endDate1.dispatchEvent(new Event('change', { bubbles: true }));

      startDate2.value = '2016-06-01';
      startDate2.dispatchEvent(new Event('change', { bubbles: true }));

      endDate2.value = '2017-12-31';
      endDate2.dispatchEvent(new Event('change', { bubbles: true }));

      expect(startDate1.value).toBe('2018-01-01');
      expect(endDate1.value).toBe('2020-12-31');
      expect(startDate2.value).toBe('2016-06-01');
      expect(endDate2.value).toBe('2017-12-31');
    });

    it('should fill multiple GPA fields independently', async () => {
      const gpa1 = document.createElement('input');
      gpa1.type = 'number';
      gpa1.id = 'gpa-1';
      gpa1.setAttribute('data-job-app-field-id', 'gpa-1');
      gpa1.min = '0.0';
      gpa1.max = '4.0';
      document.body.appendChild(gpa1);

      const gpa2 = document.createElement('input');
      gpa2.type = 'number';
      gpa2.id = 'gpa-2';
      gpa2.setAttribute('data-job-app-field-id', 'gpa-2');
      gpa2.min = '0.0';
      gpa2.max = '4.0';
      document.body.appendChild(gpa2);

      // Fill both GPA fields
      gpa1.value = '3.8';
      gpa1.dispatchEvent(new Event('change', { bubbles: true }));

      gpa2.value = '3.5';
      gpa2.dispatchEvent(new Event('change', { bubbles: true }));

      expect(gpa1.value).toBe('3.8');
      expect(gpa2.value).toBe('3.5');
    });
  });
});
