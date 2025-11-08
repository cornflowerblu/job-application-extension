// ===== STORAGE KEYS =====
export const STORAGE_KEYS = {
  API_KEY: 'encryptedApiKey',
  API_KEY_SALT: 'apiKeySalt',
  PROFILE: 'profile',
  KEYBOARD_SHORTCUTS: 'keyboardShortcutsEnabled'
} as const;

// ===== VALIDATION LIMITS =====
export const LIMITS = {
  // User input
  USER_INPUT_MAX: 10000,
  PROMPT_CONTEXT_MAX: 2000,

  // Profile fields
  NAME_MAX: 100,
  EMAIL_MAX: 254, // RFC 5321
  EMAIL_LOCAL_MAX: 64,
  EMAIL_DOMAIN_MAX: 255,
  PHONE_MAX: 20,
  PHONE_MIN_DIGITS: 7,
  PHONE_MAX_DIGITS: 15,
  RESUME_MAX: 20000,
  WORK_AUTH_MAX: 100,
  RELOCATE_MAX: 100,

  // EEO fields
  GENDER_MAX: 100,
  RACE_MAX: 100,
  VETERAN_STATUS_MAX: 200,
  DISABILITY_STATUS_MAX: 200,

  // Form data
  FIELD_ID_MAX: 100,
  FIELD_LABEL_MAX: 200,
  FIELD_PLACEHOLDER_MAX: 200,
  FIELD_MAX_LENGTH_LIMIT: 10000,
  FIELD_OPTIONS_MAX: 50,
  FIELDS_PER_FORM_MAX: 100,
  JOB_TITLE_MAX: 500,
  JOB_DESCRIPTION_MAX: 5000,

  // API
  API_KEY_DISPLAY_MAX: 200,
  API_MAX_TOKENS: 8000,
} as const;

// ===== TIMING CONSTANTS =====
export const TIMING = {
  // Toasts
  TOAST_DURATION_INFO: 3000,
  TOAST_DURATION_SUCCESS: 3000,
  TOAST_DURATION_ERROR: 4000,
  TOAST_DURATION_SHORT: 2000,
  TOAST_ANIMATION_MS: 300,
  TOAST_MAX_ZINDEX: 2147483647,

  // API
  API_TIMEOUT_DEFAULT: 30000,
  API_TIMEOUT_VALIDATION: 10000,
  API_RETRY_MAX: 3,
  API_RETRY_BASE_DELAY: 1000,
  API_RETRY_MAX_DELAY: 10000,

  // Rate limiting
  RATE_LIMIT_WINDOW: 60000, // 1 minute
  RATE_LIMIT_MAX_REQUESTS: 5,
  RATE_LIMIT_CLEANUP_INTERVAL: 60000,
  RATE_LIMIT_MAX_AGE: 300000, // 5 minutes

  // Form operations
  FORM_FIELD_FILL_DELAY: 50,
  FORM_ANALYSIS_THROTTLE: 1000,

  // Token expiry
  OPERATION_TOKEN_EXPIRY: 60000,
} as const;

// ===== CRYPTO CONSTANTS =====
export const CRYPTO = {
  PBKDF2_ITERATIONS: 100000,
  AES_KEY_LENGTH: 256,
  GCM_IV_LENGTH: 12,
} as const;

// ===== API CONFIGURATION =====
export const API_CONFIG = {
  ANTHROPIC_BASE_URL: 'https://api.anthropic.com',
  ANTHROPIC_VERSION: '2023-06-01',
  ENDPOINTS: {
    MESSAGES: '/v1/messages',
  },
  MODELS: {
    HAIKU: 'claude-3-haiku-20240307',
    SONNET: 'claude-sonnet-4-5',
  },
} as const;

// ===== USER-FRIENDLY ERROR MESSAGES =====
export const USER_FRIENDLY_ERRORS = {
  API_AUTHENTICATION: 'Invalid API key. Please check your settings.',
  API_RATE_LIMIT: 'Too many requests. Please wait a moment and try again.',
  API_SERVER_ERROR: 'The AI service is temporarily unavailable. Please try again in a few moments.',
  API_TIMEOUT: 'The request took too long. Please check your connection and try again.',
  API_NETWORK: 'Unable to connect to the AI service. Please check your internet connection.',
  API_INVALID_RESPONSE: 'Received an unexpected response. Please try again.',
  API_RESPONSE_TOO_LONG: 'The form is too complex. Please try filling it in sections.',
  FORM_NOT_FOUND: 'No form detected on this page. Please navigate to a job application.',
  FORM_ANALYSIS_FAILED: 'Unable to analyze the form. Please try again.',
  GENERIC: 'Something went wrong. Please try again.',
  INVALID_OPERATION_TOKEN: 'Invalid operation token. Please try again.',
} as const;

// ===== JOB SITE URL ALLOWLIST =====
export const ALLOWED_JOB_SITE_PATTERNS = [
  /^https:\/\/(www\.)?linkedin\.com\//,
  /^https:\/\/(www\.)?indeed\.com\//,
  /^https:\/\/(www\.)?glassdoor\.com\//,
  /^https:\/\/(www\.)?monster\.com\//,
  /^https:\/\/(www\.)?ziprecruiter\.com\//,
  /^https:\/\/(www\.)?careerbuilder\.com\//,
  /^https:\/\/(boards\.)?greenhouse\.io\//,
  /^https:\/\/jobs\.lever\.co\//,
  /^https:\/\/.*\.greenhouse\.io\//,
  /^https:\/\/.*\.lever\.co\//,
  /^https:\/\/.*\.applicantstack\.com\//,
  /^https:\/\/.*\.workday\.com\//,
  /^https:\/\/.*\.taleo\.net\//,
  /^https:\/\/.*\.smartrecruiters\.com\//,
  /^https:\/\/.*\.icims\.com\//,
  /^https:\/\/.*\.jobvite\.com\//,
  /^https:\/\/careers\./,  // Company career pages
  /^https:\/\/jobs\./,     // Company job pages
  // Localhost for development
  /^https?:\/\/localhost(:\d+)?\//,
  /^https?:\/\/127\.0\.0\.1(:\d+)?\//,
] as const;

// URL validation mode: 'strict' requires allowlist match, 'permissive' allows any HTTPS
export const URL_VALIDATION_MODE: 'strict' | 'permissive' = 'permissive';
