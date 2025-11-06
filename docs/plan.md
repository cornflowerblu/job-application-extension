# Job Application Assistant - Development Plan

**Project:** Agentic Job Hunting (AJH)
**Version:** 0.1.0 (MVP)
**Last Updated:** November 6, 2025

---

## Project Overview

The Job Application Assistant is a browser extension that uses Claude AI to help job seekers fill out online application forms faster and more effectively. By leveraging Claude AI from Anthropic, the extension analyzes job postings, understands form requirements, and intelligently populates fields with personalized responses based on the user's profile, resume, and career goals.

### Problem Statement

Job seekers spend 2-4 hours per application manually filling out repetitive forms. Many applications ask the same questions (contact info, work history, standard questions), leading to application fatigue and reduced quality of responses.

### Solution

An AI-powered browser extension that:

- Detects job application forms on any website
- Extracts and analyzes form fields and job descriptions
- Generates personalized, contextual responses using Claude AI
- Allows users to review and edit AI-generated content before submission
- Saves time while maintaining quality and personalization

---

## Technology Stack

### Current Versions (Latest as of Nov 2025)

- **React 19.0.0** - UI framework
- **Vite 7.2.1** - Build tool
- **Tailwind CSS 4.1.17** - Styling
- **Chrome Extension Manifest V3** - Extension platform
- **Claude 4.5 Sonnet** - AI model (via Anthropic API)

### Architecture

- **Popup UI:** React-based settings and control interface
- **Content Script:** Vanilla JS for form detection and filling
- **Service Worker:** API integration and state coordination
- **Storage:** Chrome storage API for configuration persistence

---

## Project Setup Complete

### What's Been Built

✅ React 19 + Vite 7 + Tailwind CSS 4 build system
✅ Chrome Extension Manifest V3 configuration
✅ Basic popup UI with configuration check
✅ Content script for form detection and extraction
✅ Service worker for Claude API integration
✅ Project structure and build pipeline
✅ Git repository initialized with initial commit

### Current State

- Extension loads successfully in Chrome
- Basic shell for all major components created
- Development workflow established (`npm run dev` for watch mode)
- Ready for feature development

---

## MVP Scope (v0.1 - 6 Weeks)

### MVP Goals

Enable a user to install the extension, configure it once, and successfully use AI to fill job application forms with the ability to review and edit before submission.

### In Scope for MVP

#### Epic 1: Extension Setup & Configuration (PARTIAL)

- ✅ Configure Anthropic API Key
- ✅ Configure Biographical Data (name, email, phone)
- ✅ Upload Resume (PDF only)
- ✅ Configure Standard Answers (work authorization & relocation)
- ❌ Configure Positioning Guide (POST-MVP)

#### Epic 2: Form Detection & Analysis (FULL)

- ✅ Manual Form Detection
- ✅ Extract Form Fields (all types)
- ✅ Extract Job Posting Information

#### Epic 3: AI-Powered Form Filling (FULL)

- ✅ Generate Form Fill Data via Claude API
- ✅ Review Fill Preview
- ✅ Apply Form Fills

#### Epic 4: Error Handling & Edge Cases (PARTIAL)

- ✅ Handle Missing Configuration
- ✅ Handle API Errors
- ✅ Basic Form Complexity Handling

#### Epic 5: User Experience & Convenience (CRITICAL SUBSET)

- ✅ Extension State Persistence
- ✅ Visual Feedback (loading, error)
- ✅ **Preserve fill preview on error** (no data loss!)
- ✅ **Preserve edited values in preview**

### Out of Scope (Post-MVP)

- ❌ Positioning Guide support
- ❌ Application History & Tracking (Epic 6)
- ❌ API Usage & Cost Monitoring (Epic 7)
- ❌ Advanced form complexity (multi-page, dynamic fields)
- ❌ Data export/backup features

---

## Development Roadmap

### Sprint 0: Foundation (Weeks 1-2) - IN PROGRESS

**Goal:** Extension shell + basic configuration

**Deliverables:**

- ✅ Browser extension manifest and basic structure
- ✅ Basic popup UI shell
- ⏳ Settings page UI
- ⏳ API key configuration
- ⏳ Biographical data form
- ⏳ Resume upload (PDF)
- ⏳ Standard answers configuration
- ⏳ Local storage persistence

**Definition of Done:**

- User can install extension
- User can configure settings
- Settings persist after browser restart

---

### Sprint 1: Form Detection (Week 3)

**Goal:** Detect and extract form fields

**Deliverables:**

- Manual trigger button
- Field extraction for all types (text, textarea, select, radio, checkbox)
- Job posting extraction
- Basic error messaging

**Definition of Done:**

- Extension can identify forms on page
- Extension can extract all field types
- Extension can extract job description

---

### Sprint 2: AI Integration (Weeks 4-5)

**Goal:** Claude API integration + form filling

**Deliverables:**

- Claude API prompt engineering
- Preview modal UI
- Form population logic
- Missing config handlers
- API error handlers

**Definition of Done:**

- Extension calls Claude API successfully
- User can review fills in modal
- User can edit values
- Form gets populated correctly
- Errors are handled gracefully

---

### Sprint 3: Polish & Testing (Week 6)

**Goal:** Error handling + UX improvements

**Deliverables:**

- Loading states, error feedback
- Preserve preview on error
- Preserve edited values
- Basic form complexity handling
- End-to-end testing on real job boards
- Bug fixes

**Definition of Done:**

- No data loss during errors
- Clear feedback for all operations
- Extension works on 5+ major job boards
- All P0 bugs fixed

---

## Post-MVP Roadmap

### v0.2 - Enhanced UX (Weeks 7-8)

- Complete Epic 5 (remaining UX features)
- Add positioning guide support
- Advanced form complexity handling
- UI/UX polish based on user feedback

### v0.3 - Application Management (Weeks 9-11)

- Implement Epic 6
- Application history and tracking
- Context switching between applications
- Application lifecycle management

### v0.4 - Cost Optimization (Weeks 12-13)

- Implement Epic 7
- Usage tracking and monitoring
- Budget alerts
- Cost optimization insights

### v1.0 - Production Ready (Week 14+)

- All features complete
- Full test coverage
- Documentation
- Marketing site
- Chrome/Firefox store submission

---

## Key Design Decisions

### 1. Browser Support

**Decision:** Chrome only for MVP
**Rationale:** Focus on single platform for faster iteration; Firefox support can be added post-MVP

### 2. Resume Format

**Decision:** PDF only for MVP
**Rationale:** Most common format; text/DOCX can be added later

### 3. Hybrid Architecture

**Decision:** React for UI, vanilla JS for content scripts
**Rationale:** React provides better DX for complex UI; vanilla JS keeps content scripts lightweight

### 4. User-Provided API Keys

**Decision:** Users provide their own Anthropic API keys
**Rationale:** Simplifies billing, no backend required, users control costs

### 5. No Job Board Targeting

**Decision:** Generic form detection, user manually triggers
**Rationale:** Simpler than detecting specific job boards; works universally

---

## Success Metrics

### MVP Success Criteria

A user can:

1. ✅ Install extension and complete one-time setup (< 5 minutes)
2. ✅ Navigate to a job application form
3. ✅ Click the extension button to trigger form analysis
4. ✅ Review AI-generated form fills in a preview modal
5. ✅ Edit any values they want to change
6. ✅ Apply the fills to the form with one click
7. ✅ Submit the application successfully
8. ✅ Not lose their work if an error occurs during filling
9. ✅ Use the extension again without reconfiguring

### Target Metrics

- Time to complete first form fill: < 10 minutes (including setup)
- Time to complete subsequent fills: < 2 minutes
- Error rate: < 5% of form fills result in errors
- Data loss rate: 0% (critical requirement)

---

## Development Workflow

### Building & Testing

```bash
# Install dependencies
npm install

# Development mode (watch for changes)
npm run dev

# Production build
npm run build

# Load in Chrome
# 1. Go to chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the dist/ folder
```

### After Code Changes

1. Save your changes
2. Build completes automatically (if using `npm run dev`)
3. Go to `chrome://extensions/`
4. Click refresh icon on the extension card
5. Test changes

---

## Next Immediate Steps

### Priority 1: Settings Page (Current Sprint)

Build the configuration UI that allows users to set up:

- Anthropic API key (with validation)
- Personal information (name, email, phone)
- Resume upload (PDF)
- Standard answers (work authorization, relocation)

### Priority 2: Form Detection Enhancement

Improve the form detection logic and test on real job boards:

- LinkedIn
- Indeed
- Workday
- Greenhouse
- Lever

### Priority 3: Preview Modal

Build the UI where users review and edit AI-generated fills before applying them to the form.

---

## References

### Confluence Documentation

- [Project Overview](https://rurich.atlassian.net/wiki/spaces/AJH/pages/6520846)
- [MVP Plan](https://rurich.atlassian.net/wiki/spaces/AJH/pages/6553601)
- [JIRA Plan](https://rurich.atlassian.net/wiki/spaces/AJH/pages/6455299)

### JIRA Project

- Project: [AJH (Agentic Job Hunting)](https://rurich.atlassian.net/jira/software/projects/AJH/summary)
- Epics: AJH-1 through AJH-7
- Tasks: AJH-8 through AJH-173

### External Resources

- [Anthropic API Docs](https://docs.anthropic.com/)
- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [React 19 Docs](https://react.dev/)
- [Vite 7 Docs](https://vite.dev/)
- [Tailwind CSS 4 Docs](https://tailwindcss.com/)

---

## Notes & Considerations

### Critical Requirements

- **No data loss:** Must preserve user edits if errors occur
- **User control:** User must review and approve all AI-generated content
- **Privacy:** All data stored locally, only sent to Anthropic API during use
- **Transparency:** Clear about what data is sent to Claude

### Known Limitations (MVP)

- Chrome only
- PDF resume only
- Single-page forms only
- Manual trigger required
- No application history/tracking
- No cost monitoring

### Future Enhancements (Post-MVP)

- Firefox support
- Multi-page form handling
- Auto-detection of application forms
- Application tracking dashboard
- Usage analytics and cost monitoring
- Resume format support (text, DOCX)
- Cover letter generation
- Interview preparation features

---

**Document Status:** Active Development Plan
**Last Updated:** November 6, 2025
**Next Review:** After Sprint 0 completion
