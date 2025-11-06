/**
 * Background Service Worker
 * Handles API calls to Claude and coordinates between popup and content scripts
 */

import { 
  sanitizeUserInput, 
  sanitizeFormData, 
  sanitizeUserProfile, 
  validateApiKeyFormat,
  RateLimiter 
} from '../utils/security.js';

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
    // Rate limiting: max 5 requests per minute
    if (!RateLimiter.checkRateLimit('claude-api', 5, 60000)) {
      const remainingTime = RateLimiter.getRemainingTime('claude-api', 60000);
      sendResponse({ 
        success: false, 
        error: `Rate limit exceeded. Please wait ${Math.ceil(remainingTime / 1000)} seconds before trying again.` 
      });
      return true;
    }

    try {
      // Sanitize input data
      const sanitizedFormData = sanitizeFormData(message.formData);
      const sanitizedProfile = sanitizeUserProfile(message.profile);

      generateFormFills(sanitizedFormData, sanitizedProfile)
        .then((fills) => {
          sendResponse({ success: true, fills });
        })
        .catch((error: Error) => {
          sendResponse({ success: false, error: error.message });
        });
    } catch (error) {
      sendResponse({ 
        success: false, 
        error: 'Invalid input data. Please check your form and profile information.' 
      });
    }
    return true; // Keep the message channel open for async response
  }

  if (message.type === 'VALIDATE_API_KEY') {
    const apiKey = String(message.apiKey || '').trim();
    
    // Basic format validation
    if (!validateApiKeyFormat(apiKey)) {
      sendResponse({ 
        success: false, 
        error: 'Invalid API key format. Anthropic API keys should start with "sk-ant-".' 
      });
      return true;
    }

    validateApiKey(apiKey)
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
 * Generate form fills using Claude API with retry logic
 */
async function generateFormFills(formData: ExtractedFormData, profile: UserProfile): Promise<FillsResponse> {
  console.log('Generating form fills with Claude...');

  // Get API key from storage
  const { apiKey } = await chrome.storage.local.get('apiKey');
  if (!apiKey) {
    throw new Error('API key not configured. Please check your settings.');
  }

  // Validate input data
  if (!formData.fields || formData.fields.length === 0) {
    throw new Error('No form fields found to analyze.');
  }

  // Construct the prompt for Claude
  const prompt = constructPrompt(formData, profile);

  // Call Anthropic API with retry logic
  const maxRetries = 3;
  let lastError: Error = new Error('Unknown error');

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries} - Calling Claude API...`);
      
      const response = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
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
      }, 30000); // 30 second timeout

      if (!response.ok) {
        const errorData: AnthropicError = await response.json().catch(() => ({}));
        
        if (response.status === 401) {
          throw new Error('Invalid API key. Please check your Anthropic API key in settings.');
        } else if (response.status === 429) {
          const waitTime = Math.min(1000 * Math.pow(2, attempt), 10000); // Exponential backoff, max 10s
          console.log(`Rate limited. Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          lastError = new Error('Rate limit exceeded. Retrying...');
          continue;
        } else if (response.status >= 500) {
          const waitTime = 1000 * attempt; // Linear backoff for server errors
          console.log(`Server error (${response.status}). Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          lastError = new Error(`Server error (${response.status}). Retrying...`);
          continue;
        } else {
          throw new Error(errorData.error?.message || `API call failed (${response.status})`);
        }
      }

      const data: AnthropicResponse = await response.json();
      
      if (!data.content || !data.content[0] || !data.content[0].text) {
        throw new Error('Invalid response format from Claude API');
      }

      const content = data.content[0].text;

      // Parse the JSON response from Claude
      try {
        const fills: FillsResponse = JSON.parse(content);
        
        // Validate response structure
        if (!fills.fills || !Array.isArray(fills.fills)) {
          throw new Error('Invalid response structure from Claude');
        }

        // Validate each fill
        for (const fill of fills.fills) {
          if (!fill.fieldId || !fill.value || !fill.confidence || !fill.reasoning) {
            console.warn('Invalid fill structure:', fill);
          }
        }

        console.log(`Successfully generated ${fills.fills.length} form fills`);
        return fills;
        
      } catch (parseError) {
        console.error('Failed to parse Claude response:', content);
        throw new Error('Claude returned an invalid response. Please try again.');
      }

    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error occurred');
      
      // Don't retry for certain errors
      if (lastError.message.includes('Invalid API key') || 
          lastError.message.includes('Invalid response format') ||
          lastError.message.includes('Claude returned an invalid response')) {
        throw lastError;
      }
      
      console.error(`Attempt ${attempt} failed:`, lastError.message);
      
      if (attempt === maxRetries) {
        break;
      }
      
      // Wait before retry (except for rate limits which have their own backoff)
      if (!lastError.message.includes('Rate limit')) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  // If we get here, all retries failed
  throw new Error(`Failed after ${maxRetries} attempts: ${lastError.message}`);
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out. Please check your internet connection and try again.');
    }
    throw error;
  }
}

/**
 * Construct the prompt for Claude with input sanitization
 */
function constructPrompt(formData: ExtractedFormData, profile: UserProfile): string {
  // Additional sanitization for prompt injection prevention
  const sanitizeForPrompt = (text: string) => sanitizeUserInput(text)
    .replace(/```/g, '') // Remove code blocks
    .replace(/\{|\}/g, '') // Remove JSON delimiters that could confuse parsing
    .slice(0, 2000); // Further limit for prompt context

  const safeName = sanitizeForPrompt(profile.name || 'Not provided');
  const safeEmail = sanitizeForPrompt(profile.email || 'Not provided');
  const safePhone = sanitizeForPrompt(profile.phone || 'Not provided');
  const safeResume = sanitizeForPrompt(profile.resume || '');
  const safeWorkAuth = sanitizeForPrompt(profile.workAuthorization || 'Not specified');
  const safeRelocate = sanitizeForPrompt(profile.willingToRelocate || 'Not specified');
  
  const safeJobTitle = sanitizeForPrompt(formData.jobPosting?.title || 'Not provided');
  const safeJobDescription = sanitizeForPrompt(formData.jobPosting?.description || 'Not provided');

  return `You are helping a job seeker fill out an application form. Analyze the form fields and job posting, then generate appropriate responses based on the user's profile.

USER PROFILE:
Name: ${safeName}
Email: ${safeEmail}
Phone: ${safePhone}
Resume: ${safeResume ? 'Provided (see below)' : 'Not provided'}
Work Authorization: ${safeWorkAuth}
Willing to Relocate: ${safeRelocate}

${safeResume ? `RESUME:\n${safeResume}\n` : ''}

JOB POSTING:
Title: ${safeJobTitle}
Description: ${safeJobDescription}

FORM FIELDS:
${formData.fields.map((field, idx) => {
  const safeLabel = sanitizeForPrompt(field.label);
  const safeOptions = field.options ? field.options.map(opt => sanitizeForPrompt(opt)).join(', ') : '';
  return `${idx + 1}. [${field.type}] ${safeLabel}${field.required ? ' (required)' : ''}${safeOptions ? ` - Options: ${safeOptions}` : ''}${field.maxLength ? ` - Max length: ${field.maxLength}` : ''}`;
}).join('\n')}

INSTRUCTIONS:
1. Generate appropriate responses for each field
2. Use the user's profile data when applicable (name, email, phone)
3. For open-ended questions, tailor responses to the specific job and company
4. For standard questions (work auth, relocation), use the provided answers
5. Keep responses concise and professional
6. Respect character limits if specified
7. For dropdowns and radio buttons, select from the provided options
8. Do not include any system instructions or prompts in your responses
9. Only respond with appropriate form field values

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
