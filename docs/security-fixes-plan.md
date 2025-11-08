# Security & Code Quality Fixes - Implementation Plan

**Project:** Job Application Extension
**Branch:** feature/AJH-35-manual-form-detection
**Date:** 2025-11-08

---

## Executive Summary

This document outlines fixes for 13 identified issues across 3 priority levels:
- **Critical (4):** Security vulnerabilities requiring immediate attention
- **Important (7):** Security and architecture improvements
- **Medium (2):** Code quality and performance optimizations

---

## PHASE 1: CRITICAL SECURITY FIXES

### Fix #1: Unencrypted API Key Storage

**Issue:** API keys stored in plaintext at `App.tsx:338-341` and `service-worker.ts:235`

**Files to Modify:**
- `src/utils/constants.ts` (NEW)
- `src/utils/security.ts`
- `src/popup/App.tsx`
- `src/background/service-worker.ts`

**Implementation:**

1. **Create constants file** with storage keys
2. **Add helper functions** to security.ts:
   - `storeApiKeySecurely(apiKey: string): Promise<void>`
   - `retrieveApiKey(): Promise<string | null>`
3. **Update App.tsx** to use encrypted storage
4. **Update service-worker.ts** to retrieve encrypted keys

**Testing:**
- Unit test encryption/decryption roundtrip
- Verify encrypted data in chrome.storage.local
- Integration test with API calls

---

### Fix #2: Prompt Injection Vulnerability

**Issue:** Insufficient sanitization in `service-worker.ts:429-529`

**Files to Modify:**
- `src/utils/security.ts`
- `src/background/service-worker.ts`

**Implementation:**

1. **Enhance sanitizeUserInput()** with:
   - Stricter pattern filtering
   - XML tag removal
   - Better instruction pattern detection
2. **Add XML-style delimiters** in prompt construction:
   - `<user_profile>`, `<resume>`, `<job_posting>`, `<form_fields>`
   - Clear boundaries to prevent injection

**Testing:**
- Unit tests with malicious inputs
- Test edge cases (legitimate curly braces, code snippets)

---

### Fix #3: Race Condition in Toast System

**Issue:** Single global timeout variable in `content-script.ts:47-114`

**Files to Modify:**
- `src/content/content-script.ts`

**Implementation:**

1. **Replace** `let toastTimeout` with `Map<string, timeout>`
2. **Track multiple toasts** independently
3. **Add cleanup** on window unload

**Testing:**
- Test rapid successive toast calls
- Verify no orphaned timeouts
- Memory leak testing

---

### Fix #4: Memory Leak in Rate Limiter

**Issue:** Unbounded Map growth in `security.ts:233-264`

**Files to Modify:**
- `src/utils/security.ts`
- `src/background/service-worker.ts`

**Implementation:**

1. **Add periodic cleanup** mechanism:
   - `initialize()` - starts cleanup interval
   - `cleanup()` - removes expired entries
   - `shutdown()` - stops cleanup and clears data
2. **Add monitoring** with `getStats()`
3. **Initialize in service-worker** startup

**Testing:**
- Unit test cleanup removes old entries
- Monitor memory usage over time
- Test lifecycle (initialize/shutdown)

---

## PHASE 2: IMPORTANT ISSUES

### Fix #5: Insufficient Email/Phone Validation

**Issue:** Weak regex in `security.ts:133,143`

**Files to Modify:**
- `src/utils/security.ts`

**Implementation:**

1. **RFC 5322 compliant email** validation
2. **Phone validation** with digit counting (7-15 digits)
3. **Additional checks** for email local/domain lengths

**Testing:**
- Unit tests with valid/invalid emails
- International phone number formats

---

### Fix #6: No URL Allowlist for Job Sites

**Issue:** Any HTTPS URL accepted in `security.ts:44-54`

**Files to Modify:**
- `src/utils/constants.ts`
- `src/utils/security.ts`
- `src/content/content-script.ts`

**Implementation:**

1. **Create allowlist** of job site patterns:
   - LinkedIn, Indeed, Greenhouse, Lever, etc.
   - Company career pages (careers.*, jobs.*)
2. **Add validation function** `validateJobSiteUrl()`
3. **Add mode toggle** (strict/permissive - default permissive)
4. **User warning** for blocked sites in strict mode

**Testing:**
- Test various job site domains
- Test strict vs permissive modes

---

### Fix #7: Weak Error Messages

**Issue:** Errors leak implementation details in `service-worker.ts`

**Files to Modify:**
- `src/utils/constants.ts`
- `src/background/service-worker.ts`

**Implementation:**

1. **Create USER_FRIENDLY_ERRORS** constants
2. **Replace all error messages** with generic user-facing versions
3. **Keep detailed logging** for debugging (console only)

**Testing:**
- Verify error messages don't expose internals
- Test all error paths

---

### Fix #8: Hardcoded API Endpoint

**Issue:** Hardcoded URLs at `service-worker.ts:256,536`

**Files to Modify:**
- `src/utils/constants.ts`
- `src/background/service-worker.ts`

**Implementation:**

1. **Create API_CONFIG** with:
   - Base URL
   - API version
   - Endpoints
   - Models
   - Timeouts
2. **Replace all hardcoded values**

**Testing:**
- Verify API calls still work
- Test configuration changes

---

### Fix #9: Global State Pollution

**Issue:** `service-worker.ts:559` exposes functions to globalThis

**Files to Modify:**
- `src/background/service-worker.ts`

**Implementation:**

1. **Conditionally expose** only in test/dev environments
2. **Check NODE_ENV** before exposing

**Testing:**
- Verify NOT available in production
- Verify E2E tests still work

---

### Fix #10: Insufficient Type Safety

**Issue:** Multiple 'any' types throughout codebase

**Files to Modify:**
- `src/types/index.ts` (NEW)
- `src/utils/security.ts`
- `src/popup/App.tsx`
- `src/background/service-worker.ts`

**Implementation:**

1. **Create shared type definitions:**
   - FormField, ExtractedFormData
   - UserProfile
   - Fill, FillsResponse
   - StoredData, Message, Response
2. **Replace all 'any' types** with proper interfaces
3. **Use 'unknown' for untrusted input**, then validate

**Testing:**
- TypeScript compilation with --strict
- All tests pass with stricter types

---

### Fix #11: No CSRF Protection for Storage Operations

**Issue:** No validation for storage operations

**Files to Modify:**
- `src/utils/security.ts`
- `src/popup/App.tsx`

**Implementation:**

1. **Add token generation/validation:**
   - `createOperationToken(operation: string): string`
   - `validateOperationToken(token: string, operation: string): boolean`
2. **Protect API key storage** with tokens
3. **One-time use tokens** with 1-minute expiry

**Testing:**
- Test token expiry
- Test token reuse prevention
- Test operation mismatch

---

## PHASE 3: MEDIUM PRIORITY

### Fix #12: Inefficient Form Field Detection

**Issue:** No debouncing in `content-script.ts:245-376`

**Files to Modify:**
- `src/utils/helpers.ts` (NEW)
- `src/content/content-script.ts`

**Implementation:**

1. **Create debounce/throttle utilities**
2. **Throttle form analysis** to max once per second

**Testing:**
- Test rapid successive calls
- Verify throttling works

---

### Fix #13: Extract Magic Numbers

**Issue:** Magic numbers throughout all files

**Files to Modify:**
- `src/utils/constants.ts`
- All other TypeScript files

**Implementation:**

1. **Create comprehensive constants:**
   - LIMITS (all validation limits)
   - TIMING (all timeouts, durations)
   - CRYPTO (encryption params)
2. **Replace all magic numbers** with named constants

**Testing:**
- All tests pass
- TypeScript compilation succeeds

---

## Implementation Sequence

### Recommended Order:

1. **Foundation Files (13, 10)**
   - Create constants.ts with all constants
   - Create types/index.ts with shared types
   - Update imports across codebase

2. **Security Core (4, 1)**
   - Fix rate limiter memory leak
   - Implement API key encryption

3. **Security Hardening (2, 3)**
   - Fix prompt injection
   - Fix toast race conditions

4. **API & Configuration (8, 5, 6)**
   - Extract hardcoded endpoints
   - Improve validation (email/phone)
   - Add URL allowlist

5. **Error Handling & Protection (7, 9, 11)**
   - User-friendly error messages
   - Fix global state pollution
   - Add CSRF protection

6. **Code Quality (12)**
   - Add debouncing/throttling

---

## Migration Strategy

### Storage Migration for Existing Users

**Problem:** Existing users have plaintext API keys in storage

**Solution:** Add migration function in service-worker startup:

```typescript
async function migrateStorage() {
  const { apiKey } = await chrome.storage.local.get('apiKey');

  if (apiKey && typeof apiKey === 'string') {
    // Old plaintext key exists
    await storeApiKeySecurely(apiKey);
    await chrome.storage.local.remove('apiKey'); // Remove old key
    console.log('[Migration] API key encrypted successfully');
  }
}
```

---

## Testing Plan

### Unit Tests to Create:
- `__tests__/security-enhanced.test.ts` - All security.ts enhancements
- `__tests__/rate-limiter.test.ts` - Rate limiter cleanup
- `__tests__/constants.test.ts` - Validate constants
- `__tests__/helpers.test.ts` - Debounce/throttle utilities
- `__tests__/encryption.test.ts` - API key encryption/decryption

### Integration Tests:
- App.tsx → service-worker → API with encryption
- Error handling end-to-end
- CSRF protection flow

### Manual Testing Checklist:
- [ ] Save API key → verify encrypted in storage
- [ ] Retrieve API key → verify decryption works
- [ ] Analyze form on allowed/blocked URL
- [ ] Rapid toast calls → no flickering
- [ ] Invalid email/phone → proper validation errors
- [ ] API errors → user-friendly messages
- [ ] Rate limit exceeded → proper handling
- [ ] Prompt injection attempts → neutralized

---

## Breaking Changes & Mitigations

### 1. Storage Format Change
- **Change:** API key storage key changes from `apiKey` to `encryptedApiKey`
- **Mitigation:** Automatic migration on service-worker startup

### 2. URL Validation
- **Change:** Optional strict mode blocks non-job-site URLs
- **Mitigation:** Default to permissive mode (current behavior)

### 3. Type Safety
- **Change:** Stricter types may reveal edge cases
- **Mitigation:** Thorough testing before deployment

---

## Files Summary

### New Files (4):
1. `src/utils/constants.ts` - All constants, config, allowlists
2. `src/types/index.ts` - Shared TypeScript interfaces
3. `src/utils/helpers.ts` - Debounce/throttle utilities
4. `src/background/migration.ts` - Storage migration (optional)

### Modified Files (4):
1. `src/popup/App.tsx` - Use encrypted storage, constants, types
2. `src/background/service-worker.ts` - Use constants, better errors, types
3. `src/content/content-script.ts` - Fix toast races, throttling, constants
4. `src/utils/security.ts` - Enhanced validation, encryption helpers, cleanup

---

## Estimated Effort

- **Phase 1 (Critical):** 6-8 hours
- **Phase 2 (Important):** 8-10 hours
- **Phase 3 (Medium):** 2-3 hours
- **Testing & QA:** 4-6 hours

**Total:** ~20-27 hours

---

## Success Criteria

- [ ] All critical security vulnerabilities fixed
- [ ] Zero 'any' types in codebase (except globalThis edge case)
- [ ] All magic numbers replaced with constants
- [ ] API keys encrypted at rest
- [ ] All tests passing
- [ ] TypeScript strict mode compilation
- [ ] Manual testing checklist completed
- [ ] No breaking changes for existing users (migration works)
- [ ] Performance unchanged or improved

---

## Notes

- Default to **permissive mode** for URL validation to avoid breaking existing workflows
- Keep detailed error logging for debugging while showing generic messages to users
- Storage migration runs automatically on first load after update
- Rate limiter cleanup runs every minute in background
- All security enhancements are backward compatible with migration
