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

Run the test suite:

```bash
npm test                # Run tests once
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests with coverage report
npm run test:ci        # Run full CI pipeline locally (recommended before pushing)
```

### Individual CI Steps

```bash
npm run typecheck      # TypeScript type checking
npm run lint           # ESLint code style checks (when configured)
npm run build          # Production build validation
```

The `npm run test:ci` command runs the same checks as our GitHub Actions CI pipeline:
1. **TypeScript Check** - Validates both main project and Vite config
2. **Build** - Ensures production build succeeds
3. **Tests** - Runs the full Jest test suite

💡 **Tip**: Always run `npm run test:ci` before pushing to catch issues early!

### Continuous Integration

This project uses GitHub Actions for automated testing:

- ✅ **Multi-Node Testing**: Tests run on Node.js 18.x and 20.x
- ✅ **Build Validation**: Ensures production builds work
- ✅ **Type Checking**: TypeScript compilation validation
- ✅ **Branch Protection**: All tests must pass before merging to `main`

See [`.github/BRANCH_PROTECTION.md`](.github/BRANCH_PROTECTION.md) for setup instructions.

## Tech Stack

- **React 19** - UI framework
- **Vite 7** - Build tool
- **Tailwind CSS 4** - Styling
- **Chrome Extension Manifest V3** - Extension platform
- **Claude 4.5 Sonnet** - AI model (via Anthropic API)
- **Jest** - Testing framework

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

## Development & Releases

- **Development Guide** - See [Development Setup](#development-setup) section below
- **Release Guide** - See [docs/release-plan.md](docs/release-plan.md) for creating releases
- **Contributing** - This project follows the constitution defined in [.specify/memory/constitution.md](.specify/memory/constitution.md)

## License

MIT License - See [LICENSE](LICENSE) for details

**Note:** This is an open-source project. Use of the Anthropic API requires your own API key and is subject to [Anthropic's Terms of Service](https://www.anthropic.com/legal/consumer-terms).
