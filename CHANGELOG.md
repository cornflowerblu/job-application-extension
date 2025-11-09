# Changelog

All notable changes to the Agentic Job Hunter extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[unreleased]: https://github.com/yourusername/agentic-job-hunter/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/yourusername/agentic-job-hunter/releases/tag/v0.1.0
