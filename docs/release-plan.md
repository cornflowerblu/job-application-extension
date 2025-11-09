# Release Guide: Agentic Job Hunting Chrome Extension

This guide covers the release process for the AJH Chrome extension using **[Release Please](https://github.com/googleapis/release-please)** for fully automated releases.

---

## Table of Contents

1. [Release Process Overview](#release-process-overview)
2. [Phase 1: MVP Release via GitHub](#phase-1-mvp-release-via-github)
3. [Phase 2: Chrome Web Store (Unlisted)](#phase-2-chrome-web-store-unlisted)
4. [Troubleshooting](#troubleshooting)

---

## Release Process Overview

This project uses **Release Please** for completely automated releases! 🎉

### How It Works

1. **Write commits using Conventional Commits format** (see below)
2. **Push to main** (or merge PRs)
3. **Release Please bot automatically**:
   - Analyzes your commits
   - Calculates the next version
   - Generates CHANGELOG
   - Creates a "Release PR"
4. **Merge the Release PR** → automatic tag + GitHub Release + ZIP file!

**No manual version updates, tagging, or changelog editing needed!**

### Conventional Commit Format

**You MUST use this format for commits** (or releases won't work):

```bash
<type>: <description>

[optional body]

[optional footer]
```

**Types:**
- `feat:` - New feature → bumps **minor** version (0.1.0 → 0.2.0)
- `fix:` - Bug fix → bumps **patch** version (0.1.0 → 0.1.1)
- `feat!:` or `BREAKING CHANGE:` - Breaking change → bumps **major** version (0.1.0 → 1.0.0)
- `docs:` - Documentation only
- `test:` - Adding tests
- `chore:` - Maintenance (won't trigger release)
- `refactor:` - Code refactoring
- `perf:` - Performance improvement
- `ci:` - CI/CD changes

**Examples:**

```bash
# Feature (minor version bump)
feat: add support for multi-page forms

# Bug fix (patch version bump)
fix: correct API key validation logic

# Breaking change (major version bump)
feat!: change storage format to encrypted JSON

# Multiple types
fix: resolve form detection on LinkedIn
docs: update installation instructions
```

---

## Phase 1: MVP Release via GitHub

**When to use:** Initial testing, personal use, sharing with trusted testers

**Benefits:**

- No review process or delays
- Complete control over distribution
- Free (no fees)
- Quick iteration cycles
- **Fully automated with Release Please**

**Limitations:**

- No auto-updates
- Users must manually install and update
- Requires Developer Mode in Chrome

### 🤖 Automated Release Workflow

**The process is completely hands-off once you merge PRs!**

#### Step 1: Write Conventional Commits

When developing features or fixes, use conventional commit messages:

```bash
git commit -m "feat: add form field validation"
git commit -m "fix: resolve popup rendering issue"
git commit -m "docs: update README with new features"
```

#### Step 2: Push to Main (or Merge PRs)

```bash
git push origin main
```

Or merge your PRs through GitHub's UI.

#### Step 3: Wait for Release Please

After pushing to main, Release Please will:

1. **Analyze commits** since the last release
2. **Calculate next version** based on conventional commits
3. **Generate/update CHANGELOG** automatically
4. **Create or update a Release PR**

The Release PR will show:
- New version number
- Generated CHANGELOG entries
- Updated `package.json` and `public/manifest.json`

#### Step 4: Review and Merge the Release PR

1. Go to the **Pull Requests** tab
2. Find the Release PR (titled like "chore(main): release 0.2.0")
3. Review the changes:
   - Check version number is correct
   - Review auto-generated CHANGELOG
   - Verify manifest versions are updated
4. **Merge the Release PR**

#### Step 5: Automatic Release Creation

Once you merge the Release PR, the workflow automatically:

1. ✅ Creates a git tag (e.g., `v0.2.0`)
2. ✅ Runs full test suite
3. ✅ Builds the extension
4. ✅ Creates `agentic-job-hunter-v0.2.0.zip`
5. ✅ Creates GitHub Release with CHANGELOG
6. ✅ Uploads ZIP file as release asset
7. ✅ Marks 0.x versions as pre-release

**That's it!** No manual steps needed.

### Installation Instructions for Users

Include these instructions in your release notes or README:

```markdown
## Installation Instructions

Since this extension is not yet on the Chrome Web Store, you'll need to install it manually:

### Steps:

1. **Download the Extension**

   - Download `agentic-job-hunter-v0.1.0.zip` from the Assets section below
   - Extract the ZIP file to a folder on your computer

2. **Enable Developer Mode in Chrome**

   - Open Chrome and go to `chrome://extensions/`
   - Toggle "Developer mode" ON (top-right corner)

3. **Load the Extension**

   - Click "Load unpacked"
   - Select the folder where you extracted the ZIP file
   - The extension should now appear in your extensions list

4. **Configure the Extension**
   - Click the extension icon in your toolbar
   - Add your Anthropic API key
   - Complete your profile and upload resume

### Updating to New Versions

When a new version is released:

1. Download the new ZIP file
2. Extract to a NEW folder (or replace old folder contents)
3. Go to `chrome://extensions/`
4. Click the refresh icon on the AJH extension card
5. Or remove the old version and load the new folder

**Note:** Your configuration data is stored in Chrome's sync storage, so it will persist across updates.
```

### Testing the Installation

Before sharing with others, test the release package yourself:

1. Download the ZIP from GitHub Release
2. Extract to a test folder
3. Install in Chrome (Developer Mode)
4. Verify all features work
5. Check that configuration persists
6. Test a complete form-fill workflow

---

## Phase 2: Chrome Web Store (Unlisted)

**When to use:** After successful MVP testing, ready to share more broadly

**Benefits:**

- Auto-updates work seamlessly
- Professional distribution
- No Developer Mode required for users
- Still private (not searchable in store)
- Easy sharing via direct link

**Cost:** $5 one-time developer registration fee

### Step 1: Prepare Store Assets

Before submitting, gather these materials:

#### 1.1 Required Assets

- **Icon:** 128x128px PNG (already in your extension)
- **Screenshots:** 1280x800px or 640x400px
  - Show extension popup
  - Show form filling in action
  - Show configuration screen
  - (Minimum 1, recommended 3-5)
- **Promotional Images (Optional for Unlisted):**
  - Small: 440x280px
  - Marquee: 1400x560px

#### 1.2 Privacy Policy

You'll need a privacy policy URL. Here's a minimal template:

**File:** `PRIVACY_POLICY.md` (host on GitHub Pages or add to repo)

```markdown
# Privacy Policy for Agentic Job Hunting Extension

**Last Updated:** [Date]

## Data Collection and Storage

The Agentic Job Hunting extension:

- Stores your configuration data locally in Chrome's sync storage
- Sends form data and your configuration to Anthropic's Claude API for analysis
- Does NOT collect or transmit data to any other third parties
- Does NOT track your usage or browsing history

## Data You Provide

You explicitly provide:

- Anthropic API key (stored locally)
- Resume content (stored locally)
- Profile information (stored locally)
- Job application form data (sent to Claude API only when you trigger analysis)

## Third-Party Services

This extension uses:

- **Anthropic Claude API**: Form data and your configuration is sent to Claude for analysis. See [Anthropic's Privacy Policy](https://www.anthropic.com/privacy)

## Data Security

- All data is stored locally in Chrome's secure storage
- API key is stored encrypted by Chrome
- No data is sent to servers we control

## Your Rights

You can:

- Delete all extension data at any time via the extension settings
- Export your data via the extension's backup feature
- Uninstall the extension to remove all local data

## Contact

For questions about this privacy policy: [your-email@example.com]
```

**To host on GitHub Pages:**

```bash
# Create docs folder
mkdir docs
cp PRIVACY_POLICY.md docs/privacy-policy.md

# Commit and push
git add docs/privacy-policy.md
git commit -m "docs: add privacy policy"
git push

# Enable GitHub Pages in repo settings
# Settings > Pages > Source: main branch > /docs folder
# Your policy will be at: https://cornflowerblu.github.io/job-application-extension/privacy-policy.html
```

#### 1.3 Store Description

Prepare your store listing text:

**Short description** (132 characters max):

```
AI-powered job application assistant. Automatically fill forms using Claude AI based on your resume and profile.
```

**Detailed description** (16,000 characters max):

```markdown
Agentic Job Hunting is an intelligent Chrome extension that streamlines the job application process by automatically filling out application forms using AI.

## Key Features

**🤖 AI-Powered Form Filling**
Uses Anthropic's Claude AI to intelligently analyze job application forms and generate appropriate responses based on your resume and profile.

**📋 Smart Form Detection**
Automatically detects job application forms and extracts all fillable fields.

**👤 Profile Management**
Store your biographical information, standard answers to common questions, and multiple resume versions.

**✅ Preview Before Apply**
Review all AI-generated responses before they're applied to the form. Edit any field as needed.

**💰 Cost Monitoring**
Track Claude API usage and costs per application to stay within budget.

**🔒 Privacy-First**
All your data is stored locally in Chrome. Only form data is sent to Claude API when you explicitly trigger analysis.

## How It Works

1. Install the extension and configure your API key
2. Upload your resume and complete your profile
3. Navigate to any job application form
4. Click the extension icon to analyze the form
5. Review AI-generated responses
6. Apply fills with one click

## Requirements

- Anthropic Claude API key (get one at console.anthropic.com)
- API usage is pay-as-you-go (typically $0.10-0.50 per application)

## Use Cases

- Quickly fill out repetitive application forms
- Maintain consistency across applications
- Tailor responses to specific job postings
- Track application history and costs

## Privacy & Security

- No data collection or tracking
- All data stored locally in Chrome
- API key encrypted by Chrome
- Open source (link to repo)

## Support

For issues or questions, visit: [GitHub repo URL]
```

### Step 2: Create Developer Account

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
2. Sign in with your Google account
3. Pay the one-time $5 registration fee
4. Accept the developer agreement

### Step 3: Submit Extension

#### 3.1 Upload Package

1. In the Developer Dashboard, click **"New Item"**
2. Upload your `ajh-extension-v0.1.0.zip`
3. Click **"Upload"**

#### 3.2 Fill Out Store Listing

**Product details:**

- Extension name: `Agentic Job Hunting`
- Summary: (Short description from above)
- Detailed description: (Detailed description from above)
- Category: `Productivity`
- Language: `English (United States)`

**Privacy:**

- Privacy policy URL: `https://cornflowerblu.github.io/job-application-extension/privacy-policy.html`
- Permissions justification:
  - `storage`: "Store user configuration, resume, and profile data locally"
  - `activeTab`: "Detect and analyze job application forms on the current tab"

**Graphic assets:**

- Upload screenshots (drag and drop)
- Upload 128x128 icon (should auto-detect from manifest)

**Visibility:**

- Select **"Unlisted"**
- This means: Not searchable in store, but accessible via direct link

#### 3.3 Submit for Review

1. Review all information
2. Click **"Submit for review"**
3. Wait for review (typically 1-3 business days)

**Common rejection reasons:**

- Missing or inadequate privacy policy
- Insufficient permission justifications
- Misleading screenshots or descriptions
- Code obfuscation or minification without source code

### Step 4: After Approval

Once approved, you'll receive:

- **Store URL:** `https://chrome.google.com/webstore/detail/[extension-id]`
- Email notification

**Share this URL** with users. They can:

1. Click the link
2. Click "Add to Chrome"
3. Extension installs with one click
4. Auto-updates when you publish new versions

### Step 5: Update Installation Instructions

Update your GitHub README:

```markdown
## Installation

### Option 1: Chrome Web Store (Recommended)

Install directly from the Chrome Web Store:
[Install Agentic Job Hunting](https://chrome.google.com/webstore/detail/[your-extension-id])

Auto-updates are enabled - you'll always have the latest version.

### Option 2: Manual Installation (Latest Development Version)

For the latest unreleased features:

1. Download the latest release from [GitHub Releases](https://github.com/cornflowerblu/job-application-extension/releases)
2. Extract the ZIP file
3. Go to `chrome://extensions/`
4. Enable "Developer mode"
5. Click "Load unpacked" and select the extracted folder
```

### Step 6: Publishing Updates to Chrome Web Store

When you want to release a new version to the Chrome Web Store:

1. **Develop and commit** using conventional commits (as described in the Release Process Overview)
2. **Merge the Release PR** that Release Please creates
3. **Download the ZIP** from the automatic GitHub Release
4. **Upload to Chrome Web Store**:
   - Go to [Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
   - Click on your extension
   - Click **"Package"** tab
   - Click **"Upload new package"**
   - Select the ZIP file from the GitHub Release
   - Click **"Submit for review"**
5. **Wait for approval** (typically 1-3 business days)

**Users will auto-update** within a few hours of approval. Chrome checks for updates automatically.



---

## Troubleshooting

### Release Please Issues

**No Release PR Created:**

- Check that you're using conventional commit format (`feat:`, `fix:`, etc.)
- Non-release commits like `docs:`, `chore:`, `test:` won't trigger releases
- Check the Actions tab for Release Please workflow runs
- Make sure you've pushed to the `main` branch

**Release PR Not Updating:**

- Ensure new commits use conventional format
- Release Please only tracks commits since the last release
- Check `.github/workflows/release-please.yml` configuration

**Wrong Version Number:**

- Release Please calculates versions based on commit types:
  - `feat:` → minor version (0.1.0 → 0.2.0)
  - `fix:` → patch version (0.1.0 → 0.1.1)  
  - `feat!:` or `BREAKING CHANGE:` → major version (0.1.0 → 1.0.0)
- If the version is wrong, check your commit message types

**Release Failed After Merging Release PR:**

- Check Actions tab for error details
- Common causes: test failures, build errors
- Fix the issue and push a new commit to trigger another release attempt

### Package Won't Upload to Chrome Web Store

**Error: "Package is invalid"**

- Check manifest.json syntax (use JSON validator)
- Ensure all required fields are present
- Verify manifest version is 3

**Error: "Icons missing"**

- Ensure `icons` directory is included in ZIP
- Verify icon sizes match manifest.json declarations

**Error: "Cannot load extension"**

- Make sure ZIP contains files at root level, not nested in folder
- When you unzip, manifest.json should be in the root

### Users Can't Install from GitHub Release

**"Package is invalid" when loading unpacked:**

- User needs to extract ZIP first (can't load ZIP directly)
- Files must be in a folder, manifest.json at root

**Changes not appearing:**

- Click refresh icon on extension card in `chrome://extensions/`
- Or remove and re-add the extension

### Chrome Web Store Rejection

**"Privacy policy insufficient":**

- Must be accessible URL (not downloadable file)
- Must clearly state data collection practices
- Must mention third-party services (Claude API)

**"Permission justification unclear":**

- Be specific about why each permission is needed
- Link permissions to specific features

**"Misleading content":**

- Ensure screenshots show actual extension functionality
- Description must accurately reflect what extension does

### Testing Issues

**Extension works locally but not from release package:**

- Check for hardcoded paths that don't work in packaged extension
- Verify all resources are included in ZIP
- Test the actual release ZIP, not your dev directory

**Configuration doesn't persist:**

- Verify you're using `chrome.storage.sync` or `chrome.storage.local`
- Check for errors in background service worker console

---

## Quick Reference

### Conventional Commit Examples

```bash
# Feature additions (minor version bump)
git commit -m "feat: add support for LinkedIn forms"
git commit -m "feat: implement auto-save for profile data"

# Bug fixes (patch version bump)
git commit -m "fix: correct form field detection on Indeed"
git commit -m "fix: resolve API key validation issue"

# Breaking changes (major version bump)
git commit -m "feat!: migrate to new storage format"
git commit -m "feat: remove deprecated API

BREAKING CHANGE: The old API endpoints are no longer supported"

# Non-release commits (don't trigger version bumps)
git commit -m "docs: update installation guide"
git commit -m "test: add form detection test cases"
git commit -m "chore: update dependencies"
```

### Release Workflow Summary

1. **Develop** → Write code with conventional commits
2. **Push/Merge** → Push to main or merge PRs
3. **Wait** → Release Please creates/updates Release PR
4. **Review** → Check the Release PR for version and CHANGELOG
5. **Merge** → Merge Release PR to trigger automatic release

---

## Checklist: Working with Releases

### For Each Feature/Fix

- [ ] Use conventional commit format (`feat:`, `fix:`, etc.)
- [ ] Write clear, descriptive commit messages
- [ ] Test changes locally before pushing
- [ ] All tests pass: `npm run test:ci`

### When Release PR Appears

- [ ] Review auto-generated version number
- [ ] Review auto-generated CHANGELOG entries
- [ ] Verify manifest versions are updated correctly
- [ ] Check that all changes are documented
- [ ] Merge Release PR when ready

### After Release is Created

- [ ] Download and test the ZIP file
- [ ] Install in Chrome (Developer Mode)
- [ ] Verify all features work
- [ ] Test a complete form-fill workflow
- [ ] (Optional) Notify users about new release

### For Chrome Web Store (Phase 2)

- [ ] Privacy policy written and published
- [ ] Screenshots captured
- [ ] Store description written
- [ ] Developer account created ($5 fee)
- [ ] Extension submitted for review

---

## Tips for Success

1. **Trust Release Please** - It handles versioning, changelogs, and releases automatically
2. **Use conventional commits** - This is the ONLY manual step; the format determines everything
3. **Merge frequently** - Small, focused changes are easier to review and release
4. **Version conservatively** - Stay in 0.x.x until you're confident in stability  
5. **Test before merging** - Make sure tests pass locally before pushing to main
6. **Review Release PRs carefully** - This is your chance to catch issues before release
7. **Document known issues** - Be upfront about limitations in commit messages
8. **Start with GitHub Releases** - Get comfortable with automation before submitting to Web Store

---

## Next Steps

1. **Phase 1**: Release v0.1.0 via GitHub, use it yourself
2. **Iterate**: Fix bugs, add features based on real usage
3. **Phase 2**: After 2-3 stable releases, submit to Chrome Web Store (Unlisted)
4. **Grow**: Share the store link, gather feedback
5. **Phase 3**: Eventually consider going Public on the store (or keep Unlisted)

Good luck with your releases!
