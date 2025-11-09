# Privacy Policy for Agentic Job Hunter Extension

**Last Updated:** November 9, 2025

## Overview

Agentic Job Hunter is a privacy-first Chrome extension designed to help you fill job application forms using AI. We believe your personal data should remain yours, and we've designed this extension with that principle at its core.

## Data Collection and Storage

The Agentic Job Hunter extension:

- **Stores ALL data locally** in Chrome's secure storage (sync storage for cross-device availability)
- **Does NOT** send data to any servers we control
- **Does NOT** track your usage, browsing history, or behavior
- **Does NOT** collect analytics or telemetry
- **Does NOT** share your data with third parties (except as noted below)

## Data You Provide

You explicitly provide the following data through the extension settings:

### Stored Locally in Chrome

- **Anthropic API Key**: Encrypted and stored in Chrome's secure storage
- **Resume Content**: Full text of your resume (up to 20,000 characters)
- **Profile Information**:
  - Name, email, phone number
  - Work authorization status
  - Willingness to relocate
  - Optional EEO/demographic information (gender, race, veteran status, disability status)
- **User Preferences**: Keyboard shortcut settings and other configuration

### What Happens to This Data

- All data remains on your device in Chrome's encrypted storage
- If Chrome Sync is enabled, data syncs across your Chrome browsers
- Data is ONLY sent externally when you click "Analyze Form" or "Fill Form"

## Third-Party Services

### Anthropic Claude API

When you trigger form analysis or filling:

- Form field data (labels, types, requirements) is sent to Anthropic's Claude API
- Your profile information and resume are sent to provide context for AI responses
- Job posting information (title, description) is sent for tailoring responses

**What Anthropic receives:**
- The form structure and job posting details
- Your profile and resume content
- Your API requests and prompts

**What Anthropic does NOT receive:**
- Your browsing history
- Forms you haven't explicitly analyzed
- Your API key (only you use it to authenticate)

**Anthropic's Privacy Policy:**
Please review [Anthropic's Privacy Policy](https://www.anthropic.com/privacy) for details on how they handle API requests.

**Important Notes:**
- We use your API key, meaning YOU have a direct relationship with Anthropic
- API calls are pay-as-you-go through your Anthropic account
- We do not proxy, store, or log your API requests

## Data Security

### Local Storage Security

- Chrome's storage API uses encryption at rest
- API keys are stored using Chrome's secure storage mechanisms
- Data is isolated per Chrome profile (standard browser security)

### Transmission Security

- All API calls to Anthropic use HTTPS/TLS encryption
- No data is transmitted to our servers
- Content scripts only access pages where you explicitly trigger the extension

## Your Rights and Controls

### You Can:

- **Access your data**: View all stored data in the extension settings
- **Export your data**: Copy your profile and resume at any time
- **Delete your data**:
  - Remove individual profile fields
  - Clear all extension data via extension settings
  - Uninstall the extension (removes all local data)
- **Control API usage**: You control when the extension sends data to Claude
- **Opt out of EEO fields**: All demographic fields are optional

### You Cannot (by design):

- We cannot access your data (it's only on your device)
- We cannot recover your data if you delete it
- We cannot see what forms you've filled or which jobs you've applied to

## Permissions Explained

The extension requests the following Chrome permissions:

### `storage`
**Why:** Store your API key, profile, and resume locally in Chrome
**Data stored:** All configuration and personal data (encrypted, local-only)

### `activeTab`
**Why:** Detect and analyze job application forms on the current tab when you click the extension
**What it can do:** Read page content only when you trigger analysis
**What it cannot do:** Track browsing, access tabs you haven't activated it on

### `scripting`
**Why:** Fill form fields with AI-generated responses after your approval
**What it can do:** Modify form fields on pages where you've approved fills
**What it cannot do:** Modify pages without your explicit action

### `host_permissions: https://*/*`
**Why:** Allow the extension to work on any HTTPS job application site
**Limitation:** Only activated on tabs where you click the extension icon

## Data Retention

- **Local storage**: Persists until you delete it or uninstall the extension
- **Chrome Sync**: If enabled, data persists across devices until you sign out
- **API calls**: We don't log or store these; refer to Anthropic's data retention policy

## Changes to This Policy

We will update this privacy policy as needed. Changes will be:

- Documented in the CHANGELOG.md file
- Included in release notes
- Dated with "Last Updated" at the top of this document

## Children's Privacy

This extension is not intended for use by anyone under the age of 18. We do not knowingly collect data from children.

## Open Source Transparency

This extension is open source. You can:

- Review the source code to verify our privacy claims
- See exactly what data is collected and where it goes
- Audit the API calls being made
- Report privacy concerns via GitHub Issues

**Source code:** https://github.com/cornflowerblue/agentic-job-hunter

## Contact

For questions, concerns, or privacy-related issues:

- **GitHub Issues**: https://github.com/cornflowerblue/agentic-job-hunter/issues
- **Email**: agentic-job-hunter@protonmail.com

## California Privacy Rights (CCPA)

Under the California Consumer Privacy Act (CCPA):

- We do not "sell" personal information (as defined by CCPA)
- We do not collect personal information for commercial purposes beyond the stated functionality
- You have the right to request deletion of your data (handled via extension settings)

## European Privacy Rights (GDPR)

Under the General Data Protection Regulation (GDPR):

- **Legal basis for processing**: Consent (you explicitly provide data and trigger API calls)
- **Data controller**: You are the data controller for data sent to Anthropic via your API key
- **Right to deletion**: Delete data anytime via extension settings
- **Right to portability**: Export your data from extension settings
- **Right to access**: View all stored data in extension settings

## Summary: Your Privacy, Your Control

1. All your data stays on your device unless you trigger an API call
2. No tracking, no analytics, no data collection by us
3. You control when data is sent to Anthropic
4. You can delete everything at any time
5. Open source = verifiable privacy claims

Your job search is personal. We designed this extension to keep it that way.
