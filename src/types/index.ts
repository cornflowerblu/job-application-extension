/**
 * Shared type definitions for the Job Application Extension
 */

// ===== FORM TYPES =====

export interface FormField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  placeholder?: string;
  maxLength?: number | null;
  options?: string[];
}

export interface JobPosting {
  title: string;
  description: string;
}

export interface ExtractedFormData {
  fields: FormField[];
  jobPosting: JobPosting;
  url: string;
}

// ===== USER PROFILE TYPES =====

export interface UserProfile {
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

// ===== FILL TYPES =====

export interface Fill {
  fieldId: string;
  value: string;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
}

export interface FillsResponse {
  fills: Fill[];
}

export interface FillResult {
  filled: Array<{ fieldId: string; value: string | boolean }>;
  skipped: Array<{ fieldId: string; reason: string }>;
  errors: Array<{ fieldId: string; error: string }>;
}

// ===== STORAGE TYPES =====

export interface StoredData {
  encryptedApiKey?: string;
  apiKeySalt?: string;
  profile?: UserProfile;
  keyboardShortcutsEnabled?: boolean;
}

// ===== MESSAGE TYPES =====

export interface AnalyzeFormMessage {
  type: 'ANALYZE_FORM';
}

export interface FillFormMessage {
  type: 'FILL_FORM';
  fills: Array<{ fieldId: string; value: string | boolean }>;
}

export interface GenerateFillsMessage {
  type: 'GENERATE_FILLS';
  formData: ExtractedFormData;
  profile: UserProfile;
  apiKey: string;
}

export interface ValidateApiKeyMessage {
  type: 'VALIDATE_API_KEY';
  apiKey: string;
}

export type Message =
  | AnalyzeFormMessage
  | FillFormMessage
  | GenerateFillsMessage
  | ValidateApiKeyMessage;

// ===== RESPONSE TYPES =====

export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
}

export interface ErrorResponse {
  success: false;
  error: string;
}

export type Response<T = unknown> = SuccessResponse<T> | ErrorResponse;

export interface AnalyzeFormResponse {
  success: boolean;
  data?: ExtractedFormData;
  error?: string;
}

export interface GenerateFillsResponse {
  success: boolean;
  fills?: FillsResponse;
  error?: string;
}

export interface ValidateApiKeyResponse {
  success: boolean;
  isValid?: boolean;
  error?: string;
}

// ===== API TYPES =====

export interface AnthropicError {
  type?: string;
  message?: string;
}

export interface AnthropicResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  model: string;
  stop_reason: string;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

// ===== UTILITY TYPES =====

export type ToastType = 'info' | 'success' | 'error';

export type ConfidenceLevel = 'high' | 'medium' | 'low';
