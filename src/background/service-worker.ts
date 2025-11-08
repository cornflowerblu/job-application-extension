/**
 * Background Service Worker
 * Handles API calls to Claude and coordinates between popup and content scripts
 */

import {
  sanitizeUserInput,
  sanitizeFormData,
  sanitizeUserProfile,
  validateApiKeyFormat,
  RateLimiter,
  retrieveApiKey
} from '../utils/security.js';
import { API_CONFIG, TIMING, USER_FRIENDLY_ERRORS } from '../utils/constants.js';

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
  gender?: string;
  race?: string;
  veteranStatus?: string;
  disabilityStatus?: string;
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
  stop_reason?: string;
}

console.log('Job Application Assistant: Service worker loaded');

// Initialize rate limiter with automatic cleanup
RateLimiter.initialize();

// Listen for keyboard commands
chrome.commands.onCommand.addListener((command) => {
  console.log('Command received:', command);

  if (command === 'analyze-form') {
    handleAnalyzeFormCommand();
  }
});

// Handle keyboard shortcut to analyze form
async function handleAnalyzeFormCommand(): Promise<void> {
  try {
    // Check if keyboard shortcuts are enabled
    const { keyboardShortcutsEnabled } = await chrome.storage.local.get('keyboardShortcutsEnabled');

    // Default to disabled if not explicitly enabled
    if (keyboardShortcutsEnabled !== true) {
      console.log('Keyboard shortcuts are disabled');
      return;
    }

    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.id) {
      console.error('No active tab found');
      return;
    }

    // Update badge to show processing
    await chrome.action.setBadgeText({ text: '...', tabId: tab.id });
    await chrome.action.setBadgeBackgroundColor({ color: '#3B82F6', tabId: tab.id }); // Blue

    // Send message to content script to analyze form
    chrome.tabs.sendMessage(tab.id, { type: 'ANALYZE_FORM' }, async (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error sending message to content script:', chrome.runtime.lastError);
        await chrome.action.setBadgeText({ text: '!', tabId: tab.id });
        await chrome.action.setBadgeBackgroundColor({ color: '#EF4444', tabId: tab.id }); // Red

        // Clear badge after 3 seconds
        setTimeout(async () => {
          await chrome.action.setBadgeText({ text: '', tabId: tab.id });
        }, 3000);
        return;
      }

      if (!response || !response.success) {
        console.error('Form analysis failed:', response?.error);
        await chrome.action.setBadgeText({ text: '✗', tabId: tab.id });
        await chrome.action.setBadgeBackgroundColor({ color: '#EF4444', tabId: tab.id }); // Red

        // Clear badge after 3 seconds
        setTimeout(async () => {
          await chrome.action.setBadgeText({ text: '', tabId: tab.id });
        }, 3000);
        return;
      }

      // Success - show green badge
      const fieldCount = response.data?.fields?.length || 0;
      await chrome.action.setBadgeText({ text: fieldCount.toString(), tabId: tab.id });
      await chrome.action.setBadgeBackgroundColor({ color: '#10B981', tabId: tab.id }); // Green

      console.log(`Form analysis successful: ${fieldCount} fields found`);
    });

  } catch (error) {
    console.error('Error handling analyze form command:', error);
  }
}

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
      return true; // Keep the message channel open
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
export async function generateFormFills(formData: ExtractedFormData, profile: UserProfile): Promise<FillsResponse> {
  console.log('Generating form fills with Claude...');
  console.log('DEBUG: Profile EEO values:', {
    gender: profile.gender,
    race: profile.race,
    veteranStatus: profile.veteranStatus,
    disabilityStatus: profile.disabilityStatus
  });
  console.log('DEBUG: Form fields being analyzed:', formData.fields.map(f => ({ id: f.id, label: f.label, type: f.type })));

  // Get API key from encrypted storage
  const apiKey = await retrieveApiKey();
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
  const maxRetries = TIMING.API_RETRY_MAX;
  let lastError: Error = new Error('Unknown error');

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries} - Calling Claude API...`);

      const response = await fetchWithTimeout(API_CONFIG.ANTHROPIC_BASE_URL + API_CONFIG.ENDPOINTS.MESSAGES, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey as string,
          'anthropic-version': API_CONFIG.ANTHROPIC_VERSION,
          'anthropic-dangerous-direct-browser-access': 'true',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: API_CONFIG.MODELS.SONNET,
          max_tokens: 8000,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      }, TIMING.API_TIMEOUT_DEFAULT);

      if (!response.ok) {
        const errorData: AnthropicError = await response.json().catch(() => ({}));
        
        if (response.status === 401) {
          throw new Error(USER_FRIENDLY_ERRORS.API_AUTHENTICATION);
        } else if (response.status === 429) {
          const waitTime = Math.min(TIMING.API_RETRY_BASE_DELAY * Math.pow(2, attempt), TIMING.API_RETRY_MAX_DELAY);
          console.log(`Rate limited. Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          lastError = new Error(USER_FRIENDLY_ERRORS.API_RATE_LIMIT);
          continue;
        } else if (response.status >= 500) {
          const waitTime = TIMING.API_RETRY_BASE_DELAY * attempt;
          console.log(`Server error (${response.status}). Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          lastError = new Error(USER_FRIENDLY_ERRORS.API_SERVER_ERROR);
          continue;
        } else {
          // Log detailed error for debugging but show generic message
          console.error('[API Error]', response.status, errorData);
          throw new Error(USER_FRIENDLY_ERRORS.API_INVALID_RESPONSE);
        }
      }

      const data: AnthropicResponse = await response.json();

      if (!data.content || !data.content[0] || !data.content[0].text) {
        console.error('[API Error] Incomplete response structure');
        throw new Error(USER_FRIENDLY_ERRORS.API_INVALID_RESPONSE);
      }

      // Check if response was truncated due to max_tokens limit
      if (data.stop_reason === 'max_tokens') {
        throw new Error(USER_FRIENDLY_ERRORS.API_RESPONSE_TOO_LONG);
      }

      let content = data.content[0].text;

      // Strip markdown code fences if present (```json ... ``` or ``` ... ```)
      content = content.trim();
      if (content.startsWith('```')) {
        // Remove opening fence (```json or ```)
        content = content.replace(/^```(?:json)?\s*\n?/, '');
        // Remove closing fence (```)
        content = content.replace(/\n?```\s*$/, '');
        content = content.trim();
      }

      // Parse the JSON response from Claude
      try {
        const fills: FillsResponse = JSON.parse(content);

        // Validate response structure
        if (!fills.fills || !Array.isArray(fills.fills)) {
          throw new Error('Claude returned data in an unexpected format. The form suggestions could not be generated. Please try again.');
        }

        // Validate each fill
        for (const fill of fills.fills) {
          if (!fill.fieldId || !fill.value || !fill.confidence || !fill.reasoning) {
            console.warn('Invalid fill structure:', fill);
          }
        }

        console.log(`Successfully generated ${fills.fills.length} form fills`);
        console.log('DEBUG: Generated fills:', fills.fills.map(f => ({ fieldId: f.fieldId, value: f.value?.substring(0, 50) })));

        // DEBUG: Check if EEO fields were generated
        const eeoFields = ['gender', 'race', 'veteran', 'disability'];
        const generatedEEO = fills.fills.filter(f => eeoFields.includes(f.fieldId));
        if (generatedEEO.length > 0) {
          console.log('DEBUG: EEO fields generated:', generatedEEO);
        } else {
          console.log('DEBUG: WARNING - No EEO fields were generated by Claude!');
        }

        return fills;

      } catch (parseError) {
        // Re-throw if it's already our custom error
        if (parseError instanceof Error && parseError.message.includes('Claude returned data')) {
          throw parseError;
        }
        console.error('[Parse Error] Failed to parse AI response');

        // Check if response looks like truncated JSON
        const trimmedContent = content.trim();
        const looksLikeJson = trimmedContent.startsWith('{') || trimmedContent.startsWith('[');
        const incompleteClosure = !trimmedContent.endsWith('}') && !trimmedContent.endsWith(']');

        if (looksLikeJson && incompleteClosure) {
          throw new Error(USER_FRIENDLY_ERRORS.API_RESPONSE_TOO_LONG);
        }

        throw new Error(USER_FRIENDLY_ERRORS.API_INVALID_RESPONSE);
      }

    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error occurred');
      
      // Don't retry for certain errors
      if (lastError.message.includes('Invalid API key. Please check your Anthropic API key in settings.') ||
          lastError.message.includes('Claude returned data in an unexpected format. The form suggestions could not be generated. Please try again.') ||
          lastError.message.includes("Could not understand Claude's response format. This is likely a temporary issue. Please try again.") ||
          lastError.message.includes('Received an incomplete response from Claude API') ||
          lastError.message.includes('The AI response was too long and was cut off') ||
          lastError.message.includes('The AI response appears to be incomplete')) {
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
  throw new Error(`Unable to complete the request after ${maxRetries} attempts. Last error: ${lastError.message}`);
}

/**
 * Fetch with timeout
 */
export async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
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
      throw new Error('The request took too long and timed out after 30 seconds. Please check your internet connection and try again.');
    }
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Could not connect to the Anthropic API. Please check your internet connection and try again.');
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
  const safeGender = sanitizeForPrompt(profile.gender || 'Not specified');
  const safeRace = sanitizeForPrompt(profile.race || 'Not specified');
  const safeVeteranStatus = sanitizeForPrompt(profile.veteranStatus || 'Not specified');
  const safeDisabilityStatus = sanitizeForPrompt(profile.disabilityStatus || 'Not specified');

  const safeJobTitle = sanitizeForPrompt(formData.jobPosting?.title || 'Not provided');
  const safeJobDescription = sanitizeForPrompt(formData.jobPosting?.description || 'Not provided');

  return `You are helping a job seeker fill out an application form. Analyze the form fields and job posting, then generate appropriate responses based on the user's profile.

<user_profile>
Name: ${safeName}
Email: ${safeEmail}
Phone: ${safePhone}
Resume: ${safeResume ? 'Provided (see below)' : 'Not provided'}
Work Authorization: ${safeWorkAuth}
Willing to Relocate: ${safeRelocate}
Gender: ${safeGender}
Race/Ethnicity: ${safeRace}
Veteran Status: ${safeVeteranStatus}
Disability Status: ${safeDisabilityStatus}
</user_profile>

${safeResume ? `<resume>\n${safeResume}\n</resume>\n` : ''}
<job_posting>
Title: ${safeJobTitle}
Description: ${safeJobDescription}
</job_posting>

<form_fields>
${formData.fields.map((field, idx) => {
  const safeLabel = sanitizeForPrompt(field.label);
  const safeFieldId = sanitizeForPrompt(field.id);
  const safeOptions = field.options ? field.options.map(opt => sanitizeForPrompt(opt)).join(', ') : '';
  return `${idx + 1}. ID: "${safeFieldId}" - [${field.type}] ${safeLabel}${field.required ? ' (required)' : ''}${safeOptions ? ` - Options: ${safeOptions}` : ''}${field.maxLength ? ` - Max length: ${field.maxLength}` : ''}`;
}).join('\n')}
</form_fields>

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
10. Keep reasoning VERY concise (max 10 words each)

FIELD TYPE SPECIFIC INSTRUCTIONS:
- DATE inputs: Use YYYY-MM-DD format (e.g., "2020-03-15"). Generate realistic dates based on context:
  * Employment start/end dates: Use past dates that align with career timeline from resume
  * Education graduation dates: Reasonable dates based on typical degree timelines
  * Start date availability: Use a reasonable future date (2-4 weeks from now)
  * Leave end dates empty for current positions
- NUMBER inputs: Use numeric values only (no commas, currency symbols, or text):
  * GPA: Use decimal between 0.0-4.0 (e.g., "3.75")
  * Salary: Use whole numbers (e.g., "120000" not "$120,000")
  * Years: Use integers (e.g., "5" not "5 years")
  * Respect min/max constraints if visible in field definition
- URL inputs: Use complete URLs with protocol:
  * LinkedIn: "https://linkedin.com/in/[profile-name]"
  * Portfolio: "https://[name].com" or relevant domain
  * GitHub: "https://github.com/[username]"
  * If profile doesn't include URLs, generate reasonable placeholder or skip optional URL fields
- Multi-field scenarios (employment/education history):
  * Fill multiple entries chronologically (most recent first)
  * Ensure dates don't overlap incorrectly
  * Be consistent across related fields (e.g., employer-1, job-title-1, start-date-1 should all relate to same job)

Respond with ONLY a valid JSON object in this exact format:
{
  "fills": [
    {
      "fieldId": "exact-field-id-from-list-above",
      "value": "your generated response",
      "confidence": "high|medium|low",
      "reasoning": "very concise reason (max 10 words)"
    }
  ]
}

CRITICAL:
- Use the exact field ID shown in the field list above (the value after "ID:")
- Return ONLY the raw JSON object
- Do NOT wrap it in markdown code blocks (no \`\`\`json)
- Do NOT include any additional text, explanations, or formatting
- Start directly with { and end with }`;
}

/**
 * Validate an Anthropic API key
 */
async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(API_CONFIG.ANTHROPIC_BASE_URL + API_CONFIG.ENDPOINTS.MESSAGES, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': API_CONFIG.ANTHROPIC_VERSION,
        'anthropic-dangerous-direct-browser-access': 'true',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: API_CONFIG.MODELS.HAIKU, // Use lightweight model for validation
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }],
      }),
    });

    return response.ok || response.status === 429; // 429 = rate limited but valid key
  } catch (error) {
    console.error('API validation error:', error);
    return false;
  }
}

// Expose for E2E testing ONLY in development/test environments
if (typeof process !== 'undefined' && (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development')) {
  (globalThis as any).__generateFormFills = generateFormFills;
  (globalThis as any).__fetchWithTimeout = fetchWithTimeout;
}
