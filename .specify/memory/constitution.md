<!--
Sync Impact Report - Constitution v1.0.0
----------------------------------------
Version: Initial Creation (v1.0.0)
Ratification Date: 2025-11-09
Last Amended: 2025-11-09

Modified Principles: N/A (initial creation)
Added Sections: All (initial creation)
Removed Sections: None

Templates Status:
- plan-template.md: ⚠️ Not yet created
- spec-template.md: ⚠️ Not yet created
- tasks-template.md: ⚠️ Not yet created

Follow-up TODOs: None
-->

# Project Constitution

**Project:** Job Application Assistant
**Version:** 1.0.0
**Ratification Date:** 2025-11-09
**Last Amended:** 2025-11-09

## Purpose

This constitution establishes the core principles and governance for the Job Application Assistant project - an AI-powered Chrome extension that helps users efficiently complete job application forms using Claude AI.

## Core Principles

### 1. Testing Discipline

All production code MUST have appropriate test coverage:

- Unit tests for business logic and utilities
- Integration tests for API interactions
- E2E tests for critical user flows
- All CI checks must pass before merge

**Rationale:** Balanced quality approach ensures reliability without slowing development velocity. Tests serve as living documentation and prevent regressions.

### 2. Type Safety First

TypeScript strict mode MUST be enabled and enforced:

- All functions have proper type signatures
- Type checking passes in CI before deployment
- External API responses properly typed

**Rationale:** Type safety catches bugs at compile-time, improves IDE support, and makes refactoring safer.

### 3. Security by Design

Security MUST be a primary consideration:

- API keys never committed to repository
- User data (resumes, profiles) handled with care
- Content Security Policy properly configured
- Chrome extension permissions minimized
- No injection vulnerabilities (XSS, command injection, etc.)

**Rationale:** Extension handles sensitive user data (resumes, API keys). Security failures could expose private information or lead to account compromise.

### 4. AI-Assisted Development

AI tools MUST be leveraged appropriately:

- AI code review required before merging
- Claude Code used for complex refactoring
- GitHub Copilot or similar for review feedback
- Human judgment remains final authority

**Rationale:** AI assistance accelerates development and catches issues, but should augment not replace human decision-making.

### 5. Progressive Enhancement

Features MUST be built incrementally:

- Ship small, working iterations
- Feature flags for incomplete work
- Backwards compatibility maintained
- User feedback drives next iteration

**Rationale:** Continuous delivery reduces risk, enables faster feedback loops, and maintains working software at all times.

### 6. User Privacy Protection

User data MUST be protected:

- All personal data stored locally only
- No data sent to third parties (except Claude API for form filling)
- Clear disclosure of data usage
- User can delete all stored data
- Minimal data retention

**Rationale:** Users trust the extension with resumes and personal information. Privacy violations would be catastrophic for user trust.

## Technology Governance

### Approved Stack

- **Frontend:** React 19 with TypeScript
- **Build:** Vite 7
- **Styling:** Tailwind CSS 4
- **Platform:** Chrome Extension Manifest V3
- **AI:** Claude 4.5 Sonnet (Anthropic API)
- **Testing:** Jest (unit), Playwright (E2E)
- **CI/CD:** GitHub Actions

### Dependency Management

- Dependencies MUST be kept reasonably up-to-date
- Security vulnerabilities addressed within 1 week
- Major version upgrades evaluated for breaking changes
- Lock file committed for reproducible builds

## Development Workflow

### Branch Strategy

- `main` - production-ready code, protected
- `feature/AJH-XXX-description` - feature branches from Jira tickets
- All changes via pull requests

### Pull Request Requirements

1. All CI checks pass (type check, build, tests)
2. AI code review completed (GitHub Copilot or similar)
3. No merge conflicts with target branch
4. Meaningful commit messages

### Commit Message Format

```
<type>: <description> (AJH-XXX)

Examples:
Feature: Add real-time progress updates (AJH-63)
Fix: Resolve API key validation error (AJH-45)
Chore: Update dependencies
```

## Quality Standards

### Code Quality

- Follow existing code style and patterns
- Keep functions focused and testable
- Avoid premature optimization
- Document non-obvious decisions
- No commented-out code in commits

### Performance

- Extension startup < 100ms
- Form analysis < 3s for typical forms
- UI remains responsive during API calls
- Bundle size monitored

## Amendment Process

### Version Semantics

- **MAJOR (X.0.0):** Removing principles or backward-incompatible governance changes
- **MINOR (X.Y.0):** Adding new principles or materially expanding guidance
- **PATCH (X.Y.Z):** Clarifications, wording improvements, non-semantic fixes

### Amendment Procedure

1. Propose amendment via project discussion or Jira ticket
2. Update constitution document with sync impact report
3. Propagate changes to affected templates
4. Commit with descriptive message
5. Update version and last amended date

### Compliance Review

Constitution compliance should be reviewed:

- Before major feature releases
- When adding new core technologies
- Quarterly as a team retrospective item
- When principles are repeatedly violated

## Governance Notes

This constitution is a living document that evolves with the project. It reflects current best practices and may be amended as the project matures. When in doubt, consult these principles; when principles conflict, security and user privacy take precedence.
