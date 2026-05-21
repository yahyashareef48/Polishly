# Polishly

AI-powered text polishing tool. Select text anywhere, fix grammar, change tone, or apply custom instructions via Google Gemini.

## Repository Structure

```
Polishly/
├── README.md / PRIVACY.md     # Root docs — do not move
├── browser/                   # Chrome extension (Manifest v3, vanilla JS)
│   ├── manifest.json
│   ├── content.js             # Injected into every page; handles selection + UI
│   ├── api.js                 # Gemini API calls + prompt builder
│   ├── popup.js / popup.html  # Extension toolbar popup (API key management)
│   ├── settings.js / settings.html
│   ├── styles.css
│   ├── icons/
│   └── store-assets/          # Chrome Web Store promotional images
└── windows/                   # Windows desktop app (Tauri v2 + Rust)
    ├── package.json
    ├── src/                   # Frontend: HTML/CSS/JS (same glassmorphism UI)
    │   ├── icon-window.html   # Floating 36×36 pen icon window
    │   ├── popup.html         # Action menu + result modal
    │   ├── api.js             # Same Gemini logic; uses Tauri IPC for settings
    │   ├── app.js
    │   ├── settings.html/js
    │   └── styles.css
    ├── src-tauri/
    │   ├── src/main.rs        # Tray, Win+Shift+P hotkey, clipboard, Ctrl+C/V
    │   ├── Cargo.toml
    │   └── tauri.conf.json
    └── assets/                # icon.ico + icon.png required before building
```

## Common Commands

### Browser Extension
```bash
# Load unpacked in Chrome: chrome://extensions → Load unpacked → select browser/
# Repack zip for Chrome Web Store:
cd browser && zip -r polishly.zip . --exclude store-assets/\*
```

### Windows App
```bash
cd windows
npm install              # install Tauri CLI
npm run dev              # hot-reload dev build
npm run build            # production build → src-tauri/target/release/bundle/
```

## Tech Stack

| Platform | Language | Framework | API |
|----------|----------|-----------|-----|
| Browser  | Vanilla JS | Chrome Manifest v3 | Google Gemini |
| Windows  | Rust + JS | Tauri v2 + WebView2 | Google Gemini |

## Code Style

- **No build system** in browser/ — plain ES5-compatible JS, no imports
- **No comments** explaining what code does; only add one if the WHY is non-obvious
- **No TypeScript** — keep both platforms in plain JS for the frontend
- Glassmorphism dark theme: background `rgba(20,20,24,0.88)`, accent `#7c6cf0`
- Rust: standard `cargo fmt` formatting

## Key Conventions

- `.md` files always stay in the repo root — never move them into subfolders
- `browser/api.js` and `windows/src/api.js` share identical prompt logic; keep them in sync when changing prompts
- Settings storage: browser uses `chrome.storage.local`; Windows uses `%APPDATA%\Polishly\config.json`
- Text replacement: browser uses `document.execCommand('insertText')`; Windows uses clipboard + `Ctrl+V` simulation via `enigo`
- Gemini model default: `gemini-2.5-flash-lite`

## Before Building Windows App

Place these two files in `windows/assets/` (see `assets/README.txt`):
- `icon.png` — copy from `browser/icons/icon128.png`
- `icon.ico` — convert `browser/icons/icon.svg` using Inkscape or an online converter
