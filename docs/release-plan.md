# Release Guide: Agentic Job Hunting Chrome Extension

This guide covers the release process for the AJH Chrome extension using **[Release Please](https://github.com/googleapis/release-please)** for fully automated releases.

---

## Table of Contents

1. [Phase 1: MVP Release via GitHub](#phase-1-mvp-release-via-github)
2. [Phase 2: Chrome Web Store (Unlisted)](#phase-2-chrome-web-store-unlisted)
3. [Updating Existing Releases](#updating-existing-releases)
4. [Release Process Overview](#release-process-overview)
5. [Troubleshooting](#troubleshooting)

---

## Phase 1: MVP Release via GitHub

**When to use:** Initial testing, personal use, sharing with trusted testers

**Benefits:**

- No review process or delays
- Complete control over distribution
- Free (no fees)
- Quick iteration cycles
- **Automated via GitHub Actions** - Just push a tag!

**Limitations:**

- No auto-updates
- Users must manually install and update
- Requires Developer Mode in Chrome

### 🤖 Automated Release Process

**TL;DR:** Update versions, update CHANGELOG, commit, tag, push. CI does the rest!

The release process is **fully automated** via GitHub Actions (`.github/workflows/release.yml`):
- Triggered when you push a version tag (e.g., `v0.1.0`)
- Runs full test suite, builds, packages, and creates GitHub Release
- No manual ZIP creation or release drafting needed

**Quick Release:**
```bash
# 1. Update versions
# Edit: public/manifest.json and package.json

# 2. Update CHANGELOG.md

# 3. Commit and tag
git add public/manifest.json package.json CHANGELOG.md
git commit -m "chore: release v0.1.0"
git tag -a v0.1.0 -m "Release v0.1.0"
git push origin main --tags

# 4. Watch it build! (check Actions tab on GitHub)
```

The sections below provide detailed step-by-step instructions.

### Step 1: Prepare the Release

#### 1.1 Update Version Number

Edit **both** version files:

**`public/manifest.json`**:
```json
{
  "version": "0.1.0",
  ...
}
```

**`package.json`**:
```json
{
  "version": "0.1.0",
  ...
}
```

**Important:** Keep both versions in sync!

**Version numbering guide:**

- `0.1.0` - Initial MVP
- `0.2.0` - Minor feature additions
- `0.2.1` - Bug fixes
- `1.0.0` - First stable release

#### 1.2 Update CHANGELOG.md

Add release notes at the top:

```markdown
## [0.1.0] - 2025-11-09

### Added

- Initial MVP release
- Form detection and analysis
- AI-powered form filling
- Configuration management
- Basic error handling

### Known Issues

- Does not support multi-page forms yet
- Limited to single active application
```

#### 1.3 Commit Version Changes

```bash
git add public/manifest.json package.json CHANGELOG.md
git commit -m "chore: release v0.1.0"
git push origin main
```

### Step 2: Build the Extension

#### 2.1 Create Production Build

```bash
# Run your build process (adjust command as needed)
npm run build

# Or if you don't have a build process yet:
# Just make sure you have a clean directory structure
```

#### 2.2 Create Release Package

**Using npm script (recommended):**

```bash
npm run release:package
```

This creates `agentic-job-hunter-v0.1.0.zip` in the project root.

**Manual method:**

```bash
# Build first
npm run build

# Navigate to build output
cd dist

# Create zip (dist/ already contains only production files)
zip -r ../agentic-job-hunter-v0.1.0.zip .

# Return to root
cd ..
```

**Note:** The `dist/` directory already excludes development files, so no need for complex exclusions.

**Required files in the ZIP:**

- `manifest.json`
- All `.js` files (background, content scripts, popup)
- All `.html` files
- All `.css` files
- `icons/` directory
- Any other assets (images, fonts, etc.)

**Exclude from ZIP:**

- `.git/`
- `node_modules/`
- Test files
- Documentation (README.md, etc.)
- Development configs
- `package.json` and `package-lock.json` (unless needed for build)

### Step 3: Create and Push Git Tag

**⚡ This triggers the automated release workflow!**

```bash
# Create annotated tag
git tag -a v0.1.0 -m "Release v0.1.0 - Initial MVP"

# Push tag to GitHub (this triggers the release workflow)
git push origin v0.1.0
```

**What happens automatically:**
1. ✅ CI runs full test suite (`npm run test:ci`)
2. ✅ Verifies version consistency (tag, manifest.json, package.json)
3. ✅ Builds the extension
4. ✅ Creates `agentic-job-hunter-v0.1.0.zip`
5. ✅ Extracts release notes from CHANGELOG.md
6. ✅ Creates GitHub Release
7. ✅ Uploads ZIP file as release asset
8. ✅ Marks 0.x versions as pre-release automatically

**Monitor the release:**
- Go to **Actions** tab on GitHub to watch the workflow
- Release appears in **Releases** section when complete
- Typically takes 2-3 minutes

### Step 4: Manual Release (Optional / Fallback)

If you need to create a release manually (e.g., if CI is down):

#### Via GitHub Web Interface:

1. Go to your repository on GitHub
2. Click **"Releases"** (right sidebar)
3. Click **"Draft a new release"**
4. Fill out the form:
   - **Tag:** Select `v0.1.0` (or create new if not pushed yet)
   - **Release title:** `v0.1.0 - Initial MVP`
   - **Description:** Copy from CHANGELOG.md or write summary:

     ```markdown
     ## Initial MVP Release

     This is the first working version of the Agentic Job Hunter extension.

     ### Features

     - Form detection and field extraction
     - AI-powered form filling with Claude
     - Configuration management (API key, resume, profile)
     - Preview before applying fills

     ### Installation Instructions

     See below for how to install this extension.

     ### Known Issues

     - Multi-page forms not yet supported
     - Limited to single active application at a time
     ```

   - **Attach files:** Drag and drop `agentic-job-hunter-v0.1.0.zip`
   - **Pre-release:** Check this for MVP versions (< 1.0.0)
5. Click **"Publish release"**

#### Via GitHub CLI (if installed):

```bash
gh release create v0.1.0 \
  agentic-job-hunter-v0.1.0.zip \
  --title "v0.1.0 - Initial MVP" \
  --notes-file CHANGELOG.md \
  --prerelease
```

### Step 5: Installation Instructions for Users

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

### Step 6: Test the Installation

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

# 4. Build and package (only if testing manually)
npm run build
cd dist && zip -r ../agentic-job-hunter-v0.2.0.zip . && cd ..


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

### Build and Package (for local testing only)

**Note:** Release Please automation handles this automatically. Only use these for local testing.

```bash
npm run build
cd dist
zip -r ../agentic-job-hunter-v$(node -p "require('../package.json').version").zip .
cd ..
```
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

1. **Trust the automation** - Release Please handles testing, building, and releasing automatically
2. **Use Conventional Commits** - Required for Release Please to work correctly
3. **Version conservatively** - Stay in 0.x.x until you're confident in stability
4. **Keep CHANGELOG updated** - Release Please generates this automatically from commits
5. **Watch the Actions tab** - Monitor your release build in real-time
6. **Test locally first** - Use `npm run test:ci` to catch issues before merging
7. **Test the package** - Always test the actual ZIP from GitHub Releases
8. **Document known issues** - Be upfront about limitations in release notes
9. **Unlisted is your friend** - Use Unlisted store listing until you're ready for public discovery

## Available npm Scripts for Releases

**For local testing/validation:**
- `npm run test:ci` - Runs full CI test suite (typecheck, build, tests)
- Manual build and ZIP creation (see commands above)

**Note:** Release Please automation handles testing, building, and packaging automatically when you merge a Release PR. These manual steps are only needed for local testing.
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
