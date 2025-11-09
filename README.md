# Agentic Job Hunter

AI-powered Chrome extension that intelligently fills job application forms using Claude AI. Save time and maintain consistency across applications while keeping your data private and secure.

## Development Setup

1. Install dependencies:

```bash
npm install
```

2. Build the extension:

```bash
npm run build
```

3. Load the extension in Chrome:

   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `dist` folder from this project

4. For development with auto-rebuild:

```bash
npm run dev
```

## Project Structure

```
├── src/
│   ├── popup/              # React UI for extension popup
│   │   ├── App.jsx         # Main popup component
│   │   ├── main.jsx        # React entry point
│   │   └── index.css       # Styles with Tailwind
│   ├── content/            # Content script (injected into pages)
│   │   └── content-script.js
│   └── background/         # Service worker
│       └── service-worker.js
├── public/
│   ├── manifest.json       # Extension manifest
│   └── icons/              # Extension icons
├── dist/                   # Build output (git-ignored)
└── index.html              # Popup HTML
```

## Testing

We have comprehensive test coverage across unit, integration, and E2E tests.

### Unit & Integration Tests (Jest)

```bash
npm test                # Run unit tests (109 tests)
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests with coverage report
```

**Test coverage:**
- API error handling and retry logic
- Form field extraction and analysis
- Form filling with AI responses
- Security (API key encryption, XSS prevention)
- Keyboard shortcuts
- EEO field handling
- Complete form flow integration

### E2E Tests (Playwright)

```bash
npm run test:e2e                # Run E2E tests with mocked API
npm run test:e2e:ui             # Run with Playwright UI
npm run test:e2e:debug          # Run in debug mode
npm run test:e2e:real-api       # Run against real Claude API (requires .env)
```

**E2E test coverage:**
- Form validation detection and error handling
- Real API integration (with actual Anthropic API)
- Cross-browser compatibility

### CI Pipeline

```bash
npm run test:ci        # Run full CI pipeline locally (recommended before pushing)
```

This runs:
1. **TypeScript Check** - Validates both main project and Vite config
2. **Build** - Ensures production build succeeds
3. **Unit Tests** - Runs all 109 Jest tests

💡 **Tip**: Always run `npm run test:ci` before pushing to catch issues early!

### Continuous Integration

This project uses GitHub Actions for automated testing:

- ✅ **Multi-Node Testing**: Tests run on Node.js 18.x and 20.x
- ✅ **Build Validation**: Ensures production builds work
- ✅ **Type Checking**: TypeScript compilation validation
- ✅ **Real API Tests**: E2E tests run against real Anthropic API on main branch pushes
- ✅ **Branch Protection**: All tests must pass before merging to `main`

See [`.github/BRANCH_PROTECTION.md`](.github/BRANCH_PROTECTION.md) for setup instructions.

## Tech Stack

- **React 19** - UI framework
- **Vite 7** - Build tool & bundler
- **Tailwind CSS 4** - Styling
- **TypeScript (strict mode)** - Type safety
- **Chrome Extension Manifest V3** - Extension platform
- **Claude 4.5 Sonnet** - AI model (via Anthropic API)
- **Jest** - Unit & integration testing
- **Playwright** - E2E testing
- **Husky** - Pre-commit hooks
- **GitHub Actions** - CI/CD & automated releases

## Features

- ✅ **Smart Form Detection** - Automatically detects job application forms and extracts all fillable fields
- ✅ **AI-Powered Filling** - Uses Claude 4.5 Sonnet to intelligently generate responses based on your resume and profile
- ✅ **Profile Management** - One-time setup with API key, resume, and biographical information
- ✅ **Preview & Approve** - Review and edit all AI-generated responses before applying to the form
- ✅ **Real-time Progress** - See what's happening as the extension fills your form
- ✅ **EEO Support** - Optionally fill demographic fields based on your preferences
- ✅ **Keyboard Shortcuts** - Quick access with Cmd+Shift+E (Mac) or Ctrl+Shift+E (Windows/Linux)
- ✅ **Validation Handling** - Detects form validation errors (pause-and-notify workflow coming soon)

## Privacy & Security

Your privacy is our top priority:

- **Local-Only Storage** - All your data (API key, resume, profile) is stored locally in Chrome's encrypted storage
- **No Data Collection** - We don't track, log, or collect any of your data
- **No Third-Party Sharing** - Data is only sent to Anthropic's Claude API when you trigger form analysis
- **You Control API Usage** - You use your own Anthropic API key, so you have a direct relationship with Anthropic
- **Open Source** - All code is available for review and audit

📄 **[Read Full Privacy Policy](PRIVACY.md)**

## Installation

### For Users (Coming Soon)

Releases will be available via GitHub Releases. See the [Release Plan](docs/release-plan.md) for details on upcoming distribution options.

### For Developers

See [Development Setup](#development-setup) below.

## Requirements

- **Chrome Browser** (or Chromium-based browser)
- **Anthropic API Key** - Get one at [console.anthropic.com](https://console.anthropic.com)
  - API usage is pay-as-you-go (typically $0.10-0.50 per application)

## Releases & Versioning

This project uses **[Release Please](https://github.com/googleapis/release-please)** for fully automated releases! 🎉

### How It Works

1. **Write commits using Conventional Commits format** (see below)
2. **Push to main** (or merge PRs)
3. **Release Please bot automatically**:
   - Analyzes your commits
   - Calculates the next version
   - Generates CHANGELOG
   - Creates a "Release PR"
4. **Merge the Release PR** → automatic tag + GitHub Release + ZIP file!

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
# Good commits ✅
git commit -m "feat: add pause-on-validation workflow"
git commit -m "fix: correct EEO field mapping"
git commit -m "feat!: redesign profile editor (breaking change)"
git commit -m "docs: update installation instructions"

# Bad commits ❌
git commit -m "updated stuff"
git commit -m "fixes"
git commit -m "WIP"
```

**Multi-line example:**

```bash
git commit -m "feat: add multi-page form support

- Detect pagination controls
- Save progress between pages
- Resume from last completed page

Closes #42"
```

### Release Process (Fully Automated)

```bash
# 1. Make changes and commit with conventional format
git commit -m "feat: add new feature"
git push

# 2. Release Please creates a PR automatically
#    - Reviews commits since last release
#    - Bumps version
#    - Updates CHANGELOG.md
#    - Updates package.json and manifest.json

# 3. Merge the Release PR in GitHub
#    - Automatically tags the release
#    - Runs tests and builds
#    - Creates GitHub Release
#    - Uploads agentic-job-hunter-v{version}.zip
```

**That's it!** No manual version updates, no manual CHANGELOG edits, no manual tagging.

📚 **More info:** See [docs/release-plan.md](docs/release-plan.md) for details on manual release process (if needed)

## Contributing

This project follows the constitution defined in [`.specify/memory/constitution.md`](.specify/memory/constitution.md)

**Quick Guidelines:**
- Use conventional commit format (required for releases!)
- Run `npm run test:ci` before pushing
- Follow TypeScript strict mode
- Add tests for new features
- Security-first approach

## License

MIT License - See [LICENSE](LICENSE) for details

**Note:** This is an open-source project. Use of the Anthropic API requires your own API key and is subject to [Anthropic's Terms of Service](https://www.anthropic.com/legal/consumer-terms).
