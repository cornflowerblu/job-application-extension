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

## Tech Stack

- **React 19** - UI framework
- **Vite 7** - Build tool
- **Tailwind CSS 4** - Styling
- **Chrome Extension Manifest V3** - Extension platform
- **Claude 3.5 Sonnet** - AI model (via Anthropic API)

## MVP Features

- ✅ One-time configuration (API key, profile, resume)
- ✅ Manual form detection on job application pages
- ✅ AI-powered form field analysis
- ✅ Review and edit interface before filling
- ✅ Automatic form filling
- ✅ Error handling and state preservation

## License

Private - Not for distribution
