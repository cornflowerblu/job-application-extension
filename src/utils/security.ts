/**
 * Security utilities for the Job Application Assistant extension
 */

import { LIMITS, CRYPTO, TIMING, STORAGE_KEYS, ALLOWED_JOB_SITE_PATTERNS, URL_VALIDATION_MODE } from './constants';

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
    // Remove potential AI instruction patterns (enhanced)
    .replace(/\b(ignore|forget|override|disregard|system|assistant|user|instruction|prompt|role|act as|pretend|you are)\s*[:=]/gi, '[removed]')
    // Remove attempts to break out of context
    .replace(/(```)|(^---|---$)/gm, '')
    // Remove XML-like tags that could confuse the model
    .replace(/<\/?[a-z][^>]*>/gi, '')
    // Trim and limit length
    .trim()
    .slice(0, LIMITS.USER_INPUT_MAX);
}

/**
 * Validate URL against job site allowlist
 */
export function validateJobSiteUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);

    // Must be HTTPS (or HTTP for localhost)
    if (
      parsedUrl.protocol !== 'https:' &&
      (
        parsedUrl.protocol !== 'http:' ||
        (
          !parsedUrl.hostname.includes('localhost') &&
          parsedUrl.hostname !== '127.0.0.1'
        )
      )
    ) {
      return false;
    }

    // In permissive mode, allow all HTTPS URLs
    if (URL_VALIDATION_MODE === 'permissive' && parsedUrl.protocol === 'https:') {
      return true;
    }

    // In strict mode, check against allowlist
    const urlString = parsedUrl.toString();
    return ALLOWED_JOB_SITE_PATTERNS.some(pattern => pattern.test(urlString));
  } catch {
    return false;
  }
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
      if (validateJobSiteUrl(url.toString())) {
        sanitized.url = url.toString();
      } else {
        console.warn('[Security] URL not in allowlist:', url.hostname);
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
 * Sanitize and validate email address (RFC 5322 compliant)
 */
function sanitizeEmail(email: string): string {
  const sanitized = sanitizeUserInput(email);

  // RFC 5322 compliant email validation (simplified)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(sanitized)) {
    return '';
  }

  // Additional checks
  const [localPart, domain] = sanitized.split('@');

  // Local part max 64 chars, domain max 255 chars
  if (localPart.length > LIMITS.EMAIL_LOCAL_MAX || domain.length > LIMITS.EMAIL_DOMAIN_MAX) {
    return '';
  }

  // Domain must have at least one dot
  if (!domain.includes('.')) {
    return '';
  }

  return sanitized.slice(0, LIMITS.EMAIL_MAX); // RFC 5321
}

/**
 * Sanitize and validate phone number
 */
function sanitizePhone(phone: string): string {
  const sanitized = sanitizeUserInput(phone);

  // Remove non-digit characters except +, -, (, ), and spaces
  const cleaned = sanitized.replace(/[^\d+\-() ]/g, '');

  // Count digits only
  const digitCount = cleaned.replace(/[^\d]/g, '').length;

  // Valid phone: 7-15 digits (covers international formats)
  if (digitCount < LIMITS.PHONE_MIN_DIGITS || digitCount > LIMITS.PHONE_MAX_DIGITS) {
    return '';
  }

  return cleaned.slice(0, LIMITS.PHONE_MAX);
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
        iterations: CRYPTO.PBKDF2_ITERATIONS,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: CRYPTO.AES_KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    );
  }

  static async encryptData(data: string, userSalt: string): Promise<string> {
    try {
      const key = await this.deriveKey('job-app-extension', userSalt);
      const iv = crypto.getRandomValues(new Uint8Array(CRYPTO.GCM_IV_LENGTH));
      
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
      const iv = combined.slice(0, CRYPTO.GCM_IV_LENGTH);
      const encrypted = combined.slice(CRYPTO.GCM_IV_LENGTH);

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
 * Helper functions for secure API key storage
 */

/**
 * Store API key securely with encryption
 */
export async function storeApiKeySecurely(apiKey: string): Promise<void> {
  const salt = crypto.randomUUID();
  const encrypted = await SecureStorage.encryptData(apiKey, salt);
  await chrome.storage.local.set({
    [STORAGE_KEYS.API_KEY]: encrypted,
    [STORAGE_KEYS.API_KEY_SALT]: salt
  });
}

/**
 * Retrieve and decrypt API key from storage
 */
export async function retrieveApiKey(): Promise<string | null> {
  const result = await chrome.storage.local.get([STORAGE_KEYS.API_KEY, STORAGE_KEYS.API_KEY_SALT]);
  const encryptedApiKey = result[STORAGE_KEYS.API_KEY];
  const apiKeySalt = result[STORAGE_KEYS.API_KEY_SALT];

  if (!encryptedApiKey || !apiKeySalt) return null;
  return await SecureStorage.decryptData(encryptedApiKey, apiKeySalt);
}

/**
 * Rate limiting utility with automatic cleanup to prevent memory leaks
 */
export class RateLimiter {
  private static requests = new Map<string, number[]>();
  private static cleanupInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Initialize the rate limiter with periodic cleanup
   */
  static initialize(): void {
    if (this.cleanupInterval) return; // Already initialized

    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, TIMING.RATE_LIMIT_CLEANUP_INTERVAL);
  }

  /**
   * Clean up expired entries from the rate limiter
   */
  static cleanup(maxAge: number = TIMING.RATE_LIMIT_MAX_AGE): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.requests.forEach((timestamps, key) => {
      // Remove timestamps older than maxAge
      const validTimestamps = timestamps.filter(time => now - time < maxAge);

      if (validTimestamps.length === 0) {
        keysToDelete.push(key);
      } else {
        this.requests.set(key, validTimestamps);
      }
    });

    keysToDelete.forEach(key => this.requests.delete(key));

    if (keysToDelete.length > 0) {
      console.debug(`[RateLimiter] Cleaned up ${keysToDelete.length} expired entries`);
    }
  }

  /**
   * Shutdown the rate limiter and clear all data
   */
  static shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.requests.clear();
  }

  static checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];

    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < windowMs);

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

  /**
   * Get statistics for monitoring
   */
  static getStats(): { totalKeys: number; totalRequests: number } {
    let totalRequests = 0;
    this.requests.forEach(timestamps => {
      totalRequests += timestamps.length;
    });
    return {
      totalKeys: this.requests.size,
      totalRequests
    };
  }
}