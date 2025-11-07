# Job Application Assistant

AI-powered browser extension to help fill job application forms using Claude.

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

## MVP Features

- ✅ One-time configuration (API key, profile, resume)
- ✅ Manual form detection on job application pages
- ✅ AI-powered form field analysis
- ✅ Review and edit interface before filling
- ✅ Automatic form filling
- ✅ Error handling and state preservation

## License

Private - Not for distribution
