# Changelog

All notable changes to the Agentic Job Hunter extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.0 (2025-11-09)


### ⚠ BREAKING CHANGES

* Release process now fully automated using Release Please. All commits MUST follow Conventional Commit format going forward.
* Release process now fully automated using Release Please. All commits MUST follow Conventional Commit format going forward.

### Features

* Add automated release infrastructure with Release Please ([#24](https://github.com/cornflowerblu/job-application-extension/issues/24)) ([c0825aa](https://github.com/cornflowerblu/job-application-extension/commit/c0825aa386d56c2b8eda94a30421e88d943b2bf9))
* Add EEO (Equal Employment Opportunity) fields to profile settings ([2c367dc](https://github.com/cornflowerblu/job-application-extension/commit/2c367dcf6f8f6fa1de3a6d7d70c082884b4049c2))
* Add release infrastructure ([#17](https://github.com/cornflowerblu/job-application-extension/issues/17)) ([1c1ad28](https://github.com/cornflowerblu/job-application-extension/commit/1c1ad288f5280e18105e406dfbc50c9c7dd34085))
* automate releases with Release Please ([#18](https://github.com/cornflowerblu/job-application-extension/issues/18)) ([e19d83b](https://github.com/cornflowerblu/job-application-extension/commit/e19d83b4e0560629cca74bf747f40588d9884571))
* Complete form analysis UX polish (AJH-63, AJH-67, AJH-40, AJH-52, AJH-68) ([#9](https://github.com/cornflowerblu/job-application-extension/issues/9)) ([19f7d8b](https://github.com/cornflowerblu/job-application-extension/commit/19f7d8b2032548f9b66c46b7aff0e6d4b93de82d))
* Enhance API error handling and add comprehensive tests (AJH-71) ([#1](https://github.com/cornflowerblu/job-application-extension/issues/1)) ([9f47498](https://github.com/cornflowerblu/job-application-extension/commit/9f4749838cc49dc182b5379a6fb1b5b7388a33be))
* Manual form detection with keyboard shortcuts and comprehensive security hardening (AJH-35) ([#6](https://github.com/cornflowerblu/job-application-extension/issues/6)) ([100867d](https://github.com/cornflowerblu/job-application-extension/commit/100867dfc1a6a02a59d6dab3383f9e8cbf9cf356))


### Bug Fixes

* Add CORS header and update Claude model configuration ([605d518](https://github.com/cornflowerblu/job-application-extension/commit/605d51820f9666d940ea8c3968e4e8ad5bda13ec))
* E2E tests now work in headless mode (CI compatible) ([13880b1](https://github.com/cornflowerblu/job-application-extension/commit/13880b1111f3ea5d2e71f3584f3f89790a783927))
* Remove chrome:// navigation in real-API test for CI compatibility ([b463a24](https://github.com/cornflowerblu/job-application-extension/commit/b463a24765a644e088d23ed07812dd47e801901f))
* remove duplicate Release Please step causing workflow error ([133d1be](https://github.com/cornflowerblu/job-application-extension/commit/133d1bed75b0ffee18900ca3f5e706e3cc5e0e29))
* Use Playwright event API to wait for service worker ([d8959c7](https://github.com/cornflowerblu/job-application-extension/commit/d8959c7ea052890b426fe7c8d2cb6b0e99da70e7))
* Wait for service worker to load in real-API test ([7732236](https://github.com/cornflowerblu/job-application-extension/commit/7732236d3cda98016b180b0fd2e93190501bb90e))

## [Unreleased]

## [0.1.0] - 2025-11-09

### Added

- Initial MVP release
- Form detection and field extraction using content scripts
- AI-powered form filling with Claude 4.5 Sonnet
- Configuration management (API key, resume, user profile)
- Profile editor with support for:
  - Basic information (name, email, phone)
  - Resume upload and storage
  - Work authorization preferences
  - EEO/demographic information (optional)
- Preview and approve fills before applying to form
- Real-time progress updates during form filling
- Keyboard shortcut support (Cmd+Shift+E / Ctrl+Shift+E)
- Fill summary with detailed results
- Comprehensive test coverage:
  - Unit tests for core functionality
  - Integration tests for API interactions
  - E2E tests for critical user flows
  - Validation handling tests

### Known Issues

- Multi-page application forms not yet supported
- Validation error detection works, but no pause-and-notify workflow (AJH-67)
- Limited to single active application at a time
- Some job sites with complex JavaScript frameworks may have compatibility issues

### Technical Details

- Built with React 19, TypeScript, Vite 7
- Uses Chrome Extension Manifest V3
- Tailwind CSS 4 for styling
- Playwright for E2E testing
- All data stored locally in Chrome storage
- Encrypted API key storage

[unreleased]: https://github.com/cornflowerblu/job-application-extension/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/cornflowerblu/job-application-extension/releases/tag/v0.1.0
