/**
 * Security utilities for the Job Application Assistant extension
 */

/**
 * Sanitize string to prevent injection attacks in prompts
 */
export function sanitizeUserInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Remove potential prompt injection patterns
  return input
    // Remove control characters
    .replace(/[\x00-\x1F\x7F]/g, '')
    // Limit excessive whitespace
    .replace(/\s+/g, ' ')
    // Remove potential AI instruction patterns
    .replace(/\b(ignore|forget|override|system|assistant|user|instruction|prompt|role)\s*[:=]/gi, '[removed]')
    // Trim and limit length
    .trim()
    .slice(0, 10000); // Reasonable limit for user input
}

/**
 * Validate and sanitize form field data
 */
export function sanitizeFormData(formData: any): any {
  if (!formData || typeof formData !== 'object') {
    throw new Error('Invalid form data');
  }

  const sanitized = {
    fields: [],
    jobPosting: {
      title: '',
      description: ''
    },
    url: ''
  };

  // Sanitize URL
  if (formData.url && typeof formData.url === 'string') {
    try {
      const url = new URL(formData.url);
      // Only allow https URLs
      if (url.protocol === 'https:') {
        sanitized.url = url.toString();
      }
    } catch {
      // Invalid URL, leave empty
    }
  }

  // Sanitize job posting
  if (formData.jobPosting && typeof formData.jobPosting === 'object') {
    sanitized.jobPosting.title = sanitizeUserInput(formData.jobPosting.title || '');
    sanitized.jobPosting.description = sanitizeUserInput(formData.jobPosting.description || '');
  }

  // Sanitize form fields
  if (Array.isArray(formData.fields)) {
    sanitized.fields = formData.fields
      .filter((field: any) => field && typeof field === 'object')
      .map((field: any) => ({
        id: sanitizeUserInput(field.id || ''),
        type: sanitizeFieldType(field.type || 'text'),
        label: sanitizeUserInput(field.label || ''),
        required: Boolean(field.required),
        placeholder: sanitizeUserInput(field.placeholder || ''),
        maxLength: validateMaxLength(field.maxLength),
        options: Array.isArray(field.options) 
          ? field.options.map((opt: any) => sanitizeUserInput(String(opt))).slice(0, 50) // Limit options
          : undefined
      }))
      .slice(0, 100); // Limit number of fields
  }

  return sanitized;
}

/**
 * Sanitize profile data
 */
export function sanitizeUserProfile(profile: any): any {
  if (!profile || typeof profile !== 'object') {
    return {};
  }

  return {
    name: sanitizeUserInput(profile.name || '').slice(0, 100),
    email: sanitizeEmail(profile.email || ''),
    phone: sanitizePhone(profile.phone || ''),
    resume: sanitizeUserInput(profile.resume || '').slice(0, 20000),
    workAuthorization: sanitizeUserInput(profile.workAuthorization || '').slice(0, 100),
    willingToRelocate: sanitizeUserInput(profile.willingToRelocate || '').slice(0, 100),
    // EEO fields (optional)
    gender: sanitizeUserInput(profile.gender || '').slice(0, 100),
    race: sanitizeUserInput(profile.race || '').slice(0, 100),
    veteranStatus: sanitizeUserInput(profile.veteranStatus || '').slice(0, 200),
    disabilityStatus: sanitizeUserInput(profile.disabilityStatus || '').slice(0, 200)
  };
}

/**
 * Validate field type
 */
function sanitizeFieldType(type: string): string {
  const allowedTypes = [
    'text', 'email', 'tel', 'number', 'textarea', 
    'select', 'radio', 'checkbox', 'date', 'url'
  ];
  return allowedTypes.includes(type) ? type : 'text';
}

/**
 * Validate max length
 */
function validateMaxLength(maxLength: any): number | null {
  if (typeof maxLength === 'number' && maxLength > 0 && maxLength <= 10000) {
    return maxLength;
  }
  return null;
}

/**
 * Sanitize email address
 */
function sanitizeEmail(email: string): string {
  const sanitized = sanitizeUserInput(email);
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(sanitized) ? sanitized.slice(0, 254) : '';
}

/**
 * Sanitize phone number
 */
function sanitizePhone(phone: string): string {
  const sanitized = sanitizeUserInput(phone);
  // Remove non-digit characters except +, -, (, ), and spaces
  return sanitized.replace(/[^\d+\-() ]/g, '').slice(0, 20);
}

/**
 * Validate API key format
 */
export function validateApiKeyFormat(apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }
  
  // Anthropic API keys start with 'sk-ant-'
  return apiKey.startsWith('sk-ant-') && apiKey.length >= 20 && apiKey.length <= 200;
}

/**
 * Secure storage encryption/decryption (basic implementation)
 */
export class SecureStorage {
  private static async deriveKey(password: string, salt: string): Promise<CryptoKey> {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode(salt),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  static async encryptData(data: string, userSalt: string): Promise<string> {
    try {
      const key = await this.deriveKey('job-app-extension', userSalt);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        new TextEncoder().encode(data)
      );

      // Combine iv and encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);

      return btoa(String.fromCharCode(...combined));
    } catch {
      // Fallback to plain text if encryption fails
      return data;
    }
  }

  static async decryptData(encryptedData: string, userSalt: string): Promise<string> {
    try {
      const combined = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)));
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      const key = await this.deriveKey('job-app-extension', userSalt);
      
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encrypted
      );

      return new TextDecoder().decode(decrypted);
    } catch {
      // Assume it's plain text if decryption fails
      return encryptedData;
    }
  }
}

/**
 * Rate limiting utility
 */
export class RateLimiter {
  private static requests = new Map<string, number[]>();

  static checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];

    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < windowMs);

    // Clean up empty entries to prevent memory leaks
    if (validRequests.length === 0) {
      this.requests.delete(key);
    }

    if (validRequests.length >= maxRequests) {
      return false; // Rate limit exceeded
    }

    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }

  static getRemainingTime(key: string, windowMs: number): number {
    const requests = this.requests.get(key) || [];
    if (requests.length === 0) return 0;
    
    const oldest = Math.min(...requests);
    return Math.max(0, windowMs - (Date.now() - oldest));
  }
}