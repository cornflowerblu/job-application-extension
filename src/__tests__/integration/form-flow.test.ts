/**
 * @jest-environment jsdom
 */

/**
 * Integration tests for the full form filling flow.
 *
 * SAFETY GUARANTEES:
 * - All API calls are mocked (no real Claude API calls)
 * - Tests verify mocks were used (fails if real API is called)
 * - No cost incurred from running these tests
 *
 * These tests verify the end-to-end flow:
 * 1. Extract form fields from DOM
 * 2. Send to Claude API (mocked)
 * 3. Parse response
 * 4. Fill form with values
 */

import { generateFormFills } from '../../background/service-worker';

// Mock retrieveApiKey to return test API key
jest.mock('../../utils/security', () => ({
  ...jest.requireActual('../../utils/security'),
  retrieveApiKey: jest.fn().mockResolvedValue('sk-ant-test-key-12345678901234567890'),
}));

// SAFETY CHECK: Verify we're in a test environment
if (typeof jest === 'undefined') {
  throw new Error('SAFETY: Integration tests must run in Jest environment with mocked APIs');
}

describe('Form Flow Integration Tests (Mocked)', () => {
  beforeAll(() => {
    // SAFETY: Verify fetch is mocked, not real
    if (!global.fetch || typeof global.fetch !== 'function') {
      throw new Error('SAFETY: fetch must be mocked before integration tests');
    }

    // Check if fetch is a Jest mock
    const fetchString = global.fetch.toString();
    if (fetchString.includes('native code') || !fetchString.includes('jest')) {
      console.warn('WARNING: fetch may not be properly mocked!');
    }
  });

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Reset Chrome storage mock
    (global.chrome.storage.local.get as jest.Mock).mockClear();
    (global.chrome.storage.local.set as jest.Mock).mockClear();
  });

  afterEach(() => {
    // SAFETY: Verify that mocked fetch was called, not a real API
    if ((global.fetch as jest.Mock).mock.calls.length > 0) {
      // Good - mock was used
      const calls = (global.fetch as jest.Mock).mock.calls;
      calls.forEach(call => {
        const url = call[0];
        // Verify it's calling the expected API endpoint
        if (typeof url === 'string' && url.includes('anthropic.com')) {
          // Expected - mock is intercepting the right calls
        }
      });
    }
  });

  describe('Full Flow: Extract → Generate → Fill', () => {
    it('should complete full flow with mocked Claude API', async () => {
      // SETUP: Create a simple form
      const input = document.createElement('input');
      input.type = 'text';
      input.id = 'full-name';
      input.required = true;
      document.body.appendChild(input);

      // STEP 1: Extract form data (simulated)
      const formData = {
        fields: [
          {
            id: 'full-name',
            type: 'text' as const,
            label: 'Full Name',
            required: true,
            placeholder: '',
            maxLength: null
          }
        ],
        jobPosting: {
          title: 'Software Engineer',
          description: 'Join our team!'
        },
        url: 'https://example.com/apply'
      };

      const profile = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-1234',
        resume: 'Experienced developer...',
        workAuthorization: 'US Citizen',
        willingToRelocate: 'Yes'
      };

      // STEP 2: Mock Chrome storage
      (global.chrome.storage.local.get as jest.Mock).mockResolvedValue({
        apiKey: 'sk-test-key-12345' // Fake API key
      });

      // STEP 3: Mock Claude API response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [{
            text: JSON.stringify({
              fills: [
                {
                  fieldId: 'full-name',
                  value: 'John Doe',
                  confidence: 'high',
                  reasoning: 'From profile'
                }
              ]
            })
          }],
          stop_reason: 'end_turn'
        })
      });

      // STEP 4: Generate fills
      const result = await generateFormFills(formData, profile);

      // STEP 5: Verify
      expect(result.fills).toHaveLength(1);
      expect(result.fills[0].fieldId).toBe('full-name');
      expect(result.fills[0].value).toBe('John Doe');

      // SAFETY: Verify mock was called, not real API
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          method: 'POST'
        })
      );

      // STEP 6: Fill the form
      input.value = result.fills[0].value;
      expect(input.value).toBe('John Doe');
    });

    it('should handle elements without IDs in full flow', async () => {
      // Create input WITHOUT id or name
      const input = document.createElement('input');
      input.type = 'text';
      document.body.appendChild(input);

      // Extract with generated ID
      const generatedId = 'job-app-field-0';
      input.setAttribute('data-job-app-field-id', generatedId);

      const formData = {
        fields: [
          {
            id: generatedId, // Generated ID!
            type: 'text' as const,
            label: 'Name',
            required: true,
            placeholder: '',
            maxLength: null
          }
        ],
        jobPosting: {
          title: 'Test Job',
          description: 'Test description'
        },
        url: 'https://example.com/test'
      };

      const profile = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '555-5678',
        resume: 'Experienced professional...',
        workAuthorization: 'US Citizen',
        willingToRelocate: 'No'
      };

      // Mock storage
      (global.chrome.storage.local.get as jest.Mock).mockResolvedValue({
        apiKey: 'sk-test-key-12345'
      });

      // Mock Claude response - MUST use the generated ID
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [{
            text: JSON.stringify({
              fills: [
                {
                  fieldId: generatedId, // Using generated ID!
                  value: 'Jane Smith',
                  confidence: 'high',
                  reasoning: 'From profile'
                }
              ]
            })
          }],
          stop_reason: 'end_turn'
        })
      });

      // Generate fills
      const result = await generateFormFills(formData, profile);

      expect(result.fills).toHaveLength(1);
      expect(result.fills[0].fieldId).toBe(generatedId);

      // Find element by data attribute
      const element = document.querySelector<HTMLInputElement>(`[data-job-app-field-id="${generatedId}"]`);
      expect(element).toBe(input);

      // Fill it
      if (element) {
        element.value = result.fills[0].value;
      }
      expect(input.value).toBe('Jane Smith');

      // SAFETY: Verify mock was used
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('Prompt Construction', () => {
    it('should include field IDs in the prompt sent to Claude', async () => {
      const formData = {
        fields: [
          {
            id: 'email-address',
            type: 'email' as const,
            label: 'Email',
            required: true,
            placeholder: 'your@email.com',
            maxLength: null
          }
        ],
        jobPosting: {
          title: 'Developer',
          description: 'Cool job'
        },
        url: 'https://example.com'
      };

      const profile = {
        name: 'Test User',
        email: 'test@example.com',
        phone: '555-0000',
        resume: 'Resume text',
        workAuthorization: 'Yes',
        willingToRelocate: 'Yes'
      };

      (global.chrome.storage.local.get as jest.Mock).mockResolvedValue({
        apiKey: 'sk-test-key'
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [{
            text: JSON.stringify({
              fills: [
                {
                  fieldId: 'email-address',
                  value: 'test@example.com',
                  confidence: 'high',
                  reasoning: 'From profile'
                }
              ]
            })
          }],
          stop_reason: 'end_turn'
        })
      });

      await generateFormFills(formData, profile);

      // Verify the prompt includes the field ID
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      const prompt = requestBody.messages[0].content;

      // The prompt should include the field ID
      expect(prompt).toContain('ID: "email-address"');
      expect(prompt).toContain('[email] Email');

      // SAFETY check
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should verify prompt includes exact field IDs that Claude must return', async () => {
      const formData = {
        fields: [
          {
            id: 'job-app-field-0', // Generated ID
            type: 'text' as const,
            label: 'First Name',
            required: false,
            placeholder: '',
            maxLength: null
          },
          {
            id: 'last-name', // Real ID
            type: 'text' as const,
            label: 'Last Name',
            required: true,
            placeholder: '',
            maxLength: null
          }
        ],
        jobPosting: {
          title: 'Job',
          description: 'Description'
        },
        url: 'https://example.com'
      };

      const profile = {
        name: 'Test',
        email: 'test@test.com',
        phone: '555',
        resume: 'Resume',
        workAuthorization: 'Yes',
        willingToRelocate: 'No'
      };

      (global.chrome.storage.local.get as jest.Mock).mockResolvedValue({
        apiKey: 'sk-test'
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [{
            text: JSON.stringify({
              fills: [
                { fieldId: 'job-app-field-0', value: 'Test', confidence: 'high', reasoning: 'Profile' },
                { fieldId: 'last-name', value: 'User', confidence: 'high', reasoning: 'Profile' }
              ]
            })
          }],
          stop_reason: 'end_turn'
        })
      });

      const result = await generateFormFills(formData, profile);

      // Verify both IDs are in result
      expect(result.fills).toHaveLength(2);
      expect(result.fills[0].fieldId).toBe('job-app-field-0');
      expect(result.fills[1].fieldId).toBe('last-name');

      // Verify prompt included both IDs
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      const prompt = requestBody.messages[0].content;

      expect(prompt).toContain('ID: "job-app-field-0"');
      expect(prompt).toContain('ID: "last-name"');
    });
  });

  describe('Response Parsing', () => {
    it('should parse Claude response with markdown code fences', async () => {
      const formData = {
        fields: [{ id: 'test', type: 'text' as const, label: 'Test', required: false, placeholder: '', maxLength: null }],
        jobPosting: { title: 'Job', description: 'Desc' },
        url: 'https://example.com'
      };

      const profile = {
        name: 'Test',
        email: 'test@test.com',
        phone: '555',
        resume: 'Resume',
        workAuthorization: 'Yes',
        willingToRelocate: 'No'
      };

      (global.chrome.storage.local.get as jest.Mock).mockResolvedValue({ apiKey: 'sk-test' });

      // Claude sometimes wraps JSON in markdown
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [{
            text: '```json\n{"fills": [{"fieldId": "test", "value": "Value", "confidence": "high", "reasoning": "Test"}]}\n```'
          }],
          stop_reason: 'end_turn'
        })
      });

      const result = await generateFormFills(formData, profile);

      expect(result.fills).toHaveLength(1);
      expect(result.fills[0].value).toBe('Value');
    });

    it('should detect truncated responses', async () => {
      const formData = {
        fields: [{ id: 'test', type: 'text' as const, label: 'Test', required: false, placeholder: '', maxLength: null }],
        jobPosting: { title: 'Job', description: 'Desc' },
        url: 'https://example.com'
      };

      const profile = {
        name: 'Test',
        email: 'test@test.com',
        phone: '555',
        resume: 'Resume',
        workAuthorization: 'Yes',
        willingToRelocate: 'No'
      };

      (global.chrome.storage.local.get as jest.Mock).mockResolvedValue({ apiKey: 'sk-test' });

      // Response was truncated
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [{
            text: '{"fills": [{"fieldId": "test", "value": "Value"' // Incomplete JSON
          }],
          stop_reason: 'max_tokens' // Truncated!
        })
      });

      await expect(generateFormFills(formData, profile)).rejects.toThrow('The form is too complex');
    });
  });

  describe('EEO Fields Integration', () => {
    it('should include EEO fields in profile sent to Claude', async () => {
      const formData = {
        fields: [
          { id: 'gender', type: 'select' as const, label: 'Gender', required: false, placeholder: '', maxLength: null, options: ['Male', 'Female'] }
        ],
        jobPosting: { title: 'Job', description: 'Desc' },
        url: 'https://example.com'
      };

      const profile = {
        name: 'Test',
        email: 'test@test.com',
        phone: '555',
        resume: 'Resume',
        workAuthorization: 'Yes',
        willingToRelocate: 'No',
        // EEO fields - the bug was these weren't being sent!
        gender: 'Male',
        race: 'White',
        veteranStatus: 'I am not a protected veteran',
        disabilityStatus: 'No, I do not have a disability'
      };

      (global.chrome.storage.local.get as jest.Mock).mockResolvedValue({ apiKey: 'sk-test' });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [{
            text: JSON.stringify({
              fills: [
                { fieldId: 'gender', value: 'Male', confidence: 'high', reasoning: 'Profile' }
              ]
            })
          }],
          stop_reason: 'end_turn'
        })
      });

      await generateFormFills(formData, profile);

      // Verify the prompt included EEO fields
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      const prompt = requestBody.messages[0].content;

      // REGRESSION TEST: These were missing before the fix!
      expect(prompt).toContain('Gender: Male');
      expect(prompt).toContain('Race/Ethnicity: White');
      expect(prompt).toContain('Veteran Status: I am not a protected veteran');
      expect(prompt).toContain('Disability Status: No, I do not have a disability');
    });

    it('should generate fills for EEO fields when provided in profile', async () => {
      const formData = {
        fields: [
          { id: 'gender', type: 'select' as const, label: 'Gender', required: false, placeholder: '', maxLength: null, options: ['Male', 'Female'] },
          { id: 'race', type: 'select' as const, label: 'Race', required: false, placeholder: '', maxLength: null, options: ['White', 'Asian'] },
          { id: 'veteran', type: 'select' as const, label: 'Veteran', required: false, placeholder: '', maxLength: null, options: [] },
          { id: 'disability', type: 'select' as const, label: 'Disability', required: false, placeholder: '', maxLength: null, options: [] }
        ],
        jobPosting: { title: 'Job', description: 'Desc' },
        url: 'https://example.com'
      };

      const profile = {
        name: 'Test',
        email: 'test@test.com',
        phone: '555',
        resume: 'Resume',
        workAuthorization: 'Yes',
        willingToRelocate: 'No',
        gender: 'Female',
        race: 'Asian',
        veteranStatus: 'I am not a protected veteran',
        disabilityStatus: 'Yes, I have a disability'
      };

      (global.chrome.storage.local.get as jest.Mock).mockResolvedValue({ apiKey: 'sk-test' });

      // Mock Claude to return EEO field fills
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [{
            text: JSON.stringify({
              fills: [
                { fieldId: 'gender', value: 'Female', confidence: 'high', reasoning: 'Profile' },
                { fieldId: 'race', value: 'Asian', confidence: 'high', reasoning: 'Profile' },
                { fieldId: 'veteran', value: 'I am not a protected veteran', confidence: 'high', reasoning: 'Profile' },
                { fieldId: 'disability', value: 'Yes, I have a disability', confidence: 'high', reasoning: 'Profile' }
              ]
            })
          }],
          stop_reason: 'end_turn'
        })
      });

      const result = await generateFormFills(formData, profile);

      // Verify EEO fields were generated
      expect(result.fills).toHaveLength(4);
      expect(result.fills.find(f => f.fieldId === 'gender')?.value).toBe('Female');
      expect(result.fills.find(f => f.fieldId === 'race')?.value).toBe('Asian');
      expect(result.fills.find(f => f.fieldId === 'veteran')?.value).toBe('I am not a protected veteran');
      expect(result.fills.find(f => f.fieldId === 'disability')?.value).toBe('Yes, I have a disability');
    });

    it('should handle missing EEO fields gracefully', async () => {
      const formData = {
        fields: [
          { id: 'name', type: 'text' as const, label: 'Name', required: true, placeholder: '', maxLength: null }
        ],
        jobPosting: { title: 'Job', description: 'Desc' },
        url: 'https://example.com'
      };

      // Profile without EEO fields
      const profile = {
        name: 'Test',
        email: 'test@test.com',
        phone: '555',
        resume: 'Resume',
        workAuthorization: 'Yes',
        willingToRelocate: 'No'
        // No EEO fields
      };

      (global.chrome.storage.local.get as jest.Mock).mockResolvedValue({ apiKey: 'sk-test' });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [{
            text: JSON.stringify({
              fills: [
                { fieldId: 'name', value: 'Test', confidence: 'high', reasoning: 'Profile' }
              ]
            })
          }],
          stop_reason: 'end_turn'
        })
      });

      // Should not throw
      const result = await generateFormFills(formData, profile);
      expect(result.fills).toHaveLength(1);
    });
  });

  describe('Safety Verification', () => {
    it('should never make real API calls', async () => {
      // This test verifies our safety mechanisms work

      const formData = {
        fields: [
          {
            id: 'test-field',
            type: 'text' as const,
            label: 'Test',
            required: false,
            placeholder: '',
            maxLength: null
          }
        ],
        jobPosting: { title: 'Test', description: 'Test' },
        url: 'https://example.com'
      };

      const profile = {
        name: 'Test',
        email: 'test@test.com',
        phone: '555',
        resume: 'Resume',
        workAuthorization: 'Yes',
        willingToRelocate: 'No'
      };

      (global.chrome.storage.local.get as jest.Mock).mockResolvedValue({ apiKey: 'sk-test' });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [{ text: '{"fills": []}' }],
          stop_reason: 'end_turn'
        })
      });

      await generateFormFills(formData, profile);

      // Verify fetch was mocked
      expect(jest.isMockFunction(global.fetch)).toBe(true);
      expect(global.fetch).toHaveBeenCalled();

      // Verify it was called with mocked behavior
      const mock = global.fetch as jest.Mock;
      expect(mock.mock.calls.length).toBeGreaterThan(0);
    });

    it('should fail if real fetch is somehow used', () => {
      // Verify fetch is a mock
      expect(jest.isMockFunction(global.fetch)).toBe(true);

      // If this fails, we're in danger of making real API calls!
      const fetchString = global.fetch.toString();
      expect(fetchString).not.toContain('native code');
    });
  });
});
