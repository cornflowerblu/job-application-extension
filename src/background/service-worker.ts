/**
 * Background Service Worker
 * Handles API calls to Claude and coordinates between popup and content scripts
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

interface UserProfile {
  name?: string;
  email?: string;
  phone?: string;
  resume?: string;
  workAuthorization?: string;
  willingToRelocate?: string;
}

interface Fill {
  fieldId: string;
  value: string;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
}

interface FillsResponse {
  fills: Fill[];
}

interface WorkerMessage {
  type: string;
  formData?: ExtractedFormData;
  profile?: UserProfile;
  apiKey?: string;
}

interface WorkerResponse {
  success: boolean;
  fills?: FillsResponse;
  isValid?: boolean;
  error?: string;
}

interface AnthropicError {
  error?: {
    message: string;
  };
}

interface AnthropicResponse {
  content: Array<{
    text: string;
  }>;
}

console.log('Job Application Assistant: Service worker loaded');

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((message: WorkerMessage, _sender, sendResponse: (response: WorkerResponse) => void) => {
  console.log('Service worker received message:', message);

  if (message.type === 'GENERATE_FILLS') {
    generateFormFills(message.formData!, message.profile!)
      .then((fills) => {
        sendResponse({ success: true, fills });
      })
      .catch((error: Error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep the message channel open for async response
  }

  if (message.type === 'VALIDATE_API_KEY') {
    validateApiKey(message.apiKey!)
      .then((isValid) => {
        sendResponse({ success: true, isValid });
      })
      .catch((error: Error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
});

/**
 * Generate form fills using Claude API
 */
async function generateFormFills(formData: ExtractedFormData, profile: UserProfile): Promise<FillsResponse> {
  console.log('Generating form fills with Claude...');

  // Get API key from storage
  const { apiKey } = await chrome.storage.local.get('apiKey');
  if (!apiKey) {
    throw new Error('API key not configured');
  }

  // Construct the prompt for Claude
  const prompt = constructPrompt(formData, profile);

  // Call Anthropic API
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey as string,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error: AnthropicError = await response.json();
    throw new Error(error.error?.message || 'API call failed');
  }

  const data: AnthropicResponse = await response.json();
  const content = data.content[0].text;

  // Parse the JSON response from Claude
  try {
    const fills: FillsResponse = JSON.parse(content);
    return fills;
  } catch (error) {
    console.error('Failed to parse Claude response:', content);
    throw new Error('Failed to parse AI response');
  }
}

/**
 * Construct the prompt for Claude
 */
function constructPrompt(formData: ExtractedFormData, profile: UserProfile): string {
  return `You are helping a job seeker fill out an application form. Analyze the form fields and job posting, then generate appropriate responses based on the user's profile.

USER PROFILE:
Name: ${profile.name || 'Not provided'}
Email: ${profile.email || 'Not provided'}
Phone: ${profile.phone || 'Not provided'}
Resume: ${profile.resume ? 'Provided (see below)' : 'Not provided'}
Work Authorization: ${profile.workAuthorization || 'Not specified'}
Willing to Relocate: ${profile.willingToRelocate || 'Not specified'}

${profile.resume ? `RESUME:\n${profile.resume}\n` : ''}

JOB POSTING:
Title: ${formData.jobPosting?.title || 'Not provided'}
Description: ${formData.jobPosting?.description || 'Not provided'}

FORM FIELDS:
${formData.fields.map((field, idx) => `${idx + 1}. [${field.type}] ${field.label}${field.required ? ' (required)' : ''}${field.options ? ` - Options: ${field.options.join(', ')}` : ''}${field.maxLength ? ` - Max length: ${field.maxLength}` : ''}`).join('\n')}

INSTRUCTIONS:
1. Generate appropriate responses for each field
2. Use the user's profile data when applicable (name, email, phone)
3. For open-ended questions, tailor responses to the specific job and company
4. For standard questions (work auth, relocation), use the provided answers
5. Keep responses concise and professional
6. Respect character limits if specified
7. For dropdowns and radio buttons, select from the provided options

Respond with ONLY a valid JSON object in this exact format:
{
  "fills": [
    {
      "fieldId": "field-id-here",
      "value": "your generated response",
      "confidence": "high|medium|low",
      "reasoning": "brief explanation"
    }
  ]
}

Important: Return ONLY the JSON object, no additional text or formatting.`;
}

/**
 * Validate an Anthropic API key
 */
async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }],
      }),
    });

    return response.ok || response.status === 429; // 429 = rate limited but valid key
  } catch (error) {
    return false;
  }
}
