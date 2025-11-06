# Job Application Assistant - AI Coding Agent Instructions

## Project Overview

This is a Chrome Extension (Manifest V3) that uses Claude AI to automatically fill job application forms. It's built with React 19, Vite 7, TypeScript, and Tailwind CSS 4.

## Architecture Overview

### Three-Component Extension Architecture

1. **Popup UI** (`src/popup/`): React app for user interaction and configuration
2. **Content Script** (`src/content/content-script.ts`): Injected into job pages, handles form detection/filling
3. **Service Worker** (`src/background/service-worker.ts`): Background process for Claude AI API calls

### Key Data Flow

- Popup triggers form analysis → Content script extracts form data → Service worker calls Claude API → Content script fills forms
- All communication uses `chrome.runtime.sendMessage()` and message listeners

## Development Workflows

### Build & Test

```bash
npm run dev     # Watch mode with auto-rebuild
npm run build   # Production build to dist/
```

Load extension: Chrome → `chrome://extensions/` → Developer mode → Load unpacked → select `dist/` folder

### Critical Build Configuration

- **Vite config** (`vite.config.ts`): Custom rollup options for extension entry points
- Service worker and content script MUST build as `[name].js` (no hash) to match `manifest.json`
- Popup builds normally with hash for cache busting

## Project-Specific Patterns

### Type-Safe Extension Communication

All message passing uses strict TypeScript interfaces (see `service-worker.ts` lines 5-40):

```typescript
interface FormField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  // ...
}
```

### Form Detection Strategy

Content script (`content-script.ts`) uses DOM query selectors to find forms and extract metadata:

- Targets first form on page (MVP simplification)
- Extracts field types, labels, requirements from DOM attributes
- Job posting info extracted from page context

### Chrome Storage Pattern

Uses `chrome.storage.local` for user configuration (API keys, profile data):

```typescript
chrome.storage.local.get(["apiKey", "profile"], callback);
chrome.storage.local.set({ key: value });
```

### Claude AI Integration

Service worker handles all external API calls (content scripts can't make external requests in MV3):

- Anthropic API calls with structured prompts
- Error handling for rate limits and API failures
- Response parsing for form fill suggestions

## File Structure Conventions

### Source Organization

- `src/popup/`: React components (use `.tsx` for JSX)
- `src/content/`: DOM manipulation logic (`.ts` files)
- `src/background/`: API and message handling (`.ts` files)

### Styling Approach

- Tailwind CSS 4 with PostCSS
- Popup uses utility classes extensively
- Content script styling should avoid conflicts with host pages

## Integration Points

### Manifest V3 Requirements

- Service worker replaces background pages (no DOM access)
- Content scripts handle all page interaction
- `host_permissions` required for `<all_urls>` access

### External Dependencies

- **Anthropic Claude API**: Requires user-provided API key
- **Chrome Extension APIs**: `storage`, `activeTab`, `scripting` permissions
- **React 19**: Uses new JSX transform, concurrent features

## Development Guidelines

### Adding New Features

1. Define TypeScript interfaces for new data structures
2. Update message types in both sender and receiver files
3. Test extension loading in Chrome after manifest changes
4. Use Chrome DevTools extension debugging (background page + content script consoles)

### Form Field Support

When adding new field types, update:

- `FormField` interface type definitions
- Content script field extraction logic
- Service worker Claude prompt templates
- Form filling logic in content script

### Error Handling Pattern

Extension uses structured error responses:

```typescript
interface ContentResponse {
  success: boolean;
  data?: ExtractedFormData;
  error?: string;
}
```

Always provide user-friendly error messages in the popup UI for API failures, permission issues, or form detection problems.

## Testing Strategies for Chrome Extensions

### Manual Testing Workflow

1. **Build & Load**: `npm run build` → Load unpacked in `chrome://extensions/`
2. **Test Each Component**:
   - Popup: Open extension popup, verify UI states
   - Content Script: Navigate to job sites, check console for injection
   - Service Worker: Monitor background page console in DevTools
3. **Cross-Site Testing**: Test on different job boards (LinkedIn, Indeed, company sites)
4. **Edge Cases**: Empty forms, complex forms, permission denials

### Extension-Specific Testing

- **Permissions**: Test `host_permissions` on various domains
- **Storage**: Verify `chrome.storage.local` persistence across browser restarts
- **Message Passing**: Test communication between all three components
- **Build Validation**: Ensure service worker and content script have correct filenames

## Debugging Workflows Across Components

### Chrome DevTools Setup

1. **Popup**: Right-click extension icon → Inspect popup
2. **Content Script**: F12 on any webpage → Console shows injected script logs
3. **Service Worker**: `chrome://extensions/` → Service worker → inspect
4. **Background Logs**: Check service worker console for API call debugging

### Common Debug Scenarios

- **Message Passing**: Add `console.log` in both sender/receiver with message types
- **Form Detection**: Log `document.querySelectorAll('form')` in content script
- **API Failures**: Check service worker console for Anthropic API responses
- **Storage Issues**: Use `chrome.storage.local.get()` in any component console

### Cross-Component Tracing

Use consistent log prefixes to trace data flow:

```typescript
console.log("[POPUP] Sending analyze request");
console.log("[CONTENT] Received analyze request");
console.log("[WORKER] Processing form data");
```

## Claude Prompt Engineering Patterns

### Structured Prompt Template (lines 150-180 in `service-worker.ts`)

1. **Context Setting**: "You are helping a job seeker..."
2. **Data Sections**: USER PROFILE → RESUME → JOB POSTING → FORM FIELDS
3. **Clear Instructions**: Numbered list of requirements
4. **Output Format**: Strict JSON schema specification
5. **Response Constraint**: "Return ONLY the JSON object"

### Key Prompt Engineering Techniques

- **Field Mapping**: Each form field includes type, label, required status, options
- **Context Awareness**: Job posting context influences response personalization
- **Confidence Scoring**: Claude provides high/medium/low confidence for each fill
- **Reasoning Chain**: Each response includes explanation for transparency

### Prompt Maintenance Patterns

- Keep field formatting consistent: `[type] label (required)`
- Always specify max_tokens (currently 4000) for cost control
- Use latest Claude model (`claude-3-5-sonnet-20241022`)
- Include error handling for malformed JSON responses

## Detailed Error Handling Scenarios

### API Error Categories

```typescript
// Network/Auth errors (service-worker.ts)
if (!response.ok) {
  const error: AnthropicError = await response.json();
  throw new Error(error.error?.message || "API call failed");
}

// JSON parsing errors
try {
  const fills: FillsResponse = JSON.parse(content);
} catch (error) {
  throw new Error("Failed to parse AI response");
}
```

### Extension-Specific Error Handling

- **Missing Permissions**: Content script fails to inject → Check `host_permissions`
- **Storage Failures**: API key retrieval fails → Graceful degradation to setup flow
- **Form Detection**: No forms found → User-friendly message in popup
- **Rate Limiting**: Anthropic 429 errors → Implement retry with exponential backoff

### Error Recovery Patterns

1. **Graceful Degradation**: Show manual form filling option when AI fails
2. **State Preservation**: Save partial form data in `chrome.storage.local`
3. **User Guidance**: Specific error messages guide users to solutions
4. **Retry Logic**: Implement for transient API failures (network, rate limits)

### Component-Specific Error Boundaries

- **Popup**: Show error states for configuration and API issues
- **Content Script**: Handle DOM access failures and form detection edge cases
- **Service Worker**: Robust API error handling with detailed logging
