<p align="center">
  <img src="icons/icon.svg" width="80" height="80" alt="Polishly icon" />
</p>

<h1 align="center">Polishly</h1>

<p align="center">
  <strong>AI-powered text polishing, right where you type.</strong><br/>
  Select text in any input field — fix grammar, change tone, or apply custom instructions instantly.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/manifest-v3-blue" alt="Manifest V3" />
  <img src="https://img.shields.io/badge/powered%20by-Gemini%20AI-8b5cf6" alt="Powered by Gemini" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="MIT License" />
</p>

---

## Features

- **Fix Spelling & Grammar** — One-click correction for typos, grammar, and punctuation
- **Change Tone** — Rewrite in Formal, Casual, Concise, or Friendly tone
- **Custom Instructions** — Type any instruction: simplify, expand, translate, rewrite for a specific audience, and more
- **Non-intrusive** — A small icon appears only when you select text in editable fields. Click it to open the menu
- **Works everywhere** — Gmail, Notion, Slack, Twitter/X, LinkedIn, Google Docs, and any website with text inputs
- **Framework-safe** — Smart text replacement that works correctly with React, Vue, Angular, and contenteditable editors
- **Privacy-first** — Your API key stays in your browser. No data is collected or sent to any server except Google's Gemini API
- **Glassmorphism UI** — Frosted glass design with smooth animations

## How It Works

1. **Select text** in any input, textarea, or rich text editor
2. **Click the Polishly icon** that appears near your selection
3. **Choose an action** — grammar fix, tone change, or type a custom instruction
4. **Review the result**, then click **Replace** to update the text or **Copy** to clipboard

## Installation

### From Chrome Web Store

> Coming soon

### Manual Installation (Developer Mode)

1. Clone or download this repository
2. Open `chrome://extensions/` in Chrome
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked** and select the `Polishly` folder
5. Click the Polishly icon in your toolbar and enter your Gemini API key

## Setup

1. Get a free API key from [Google AI Studio](https://aistudio.google.com/apikey)
2. Click the Polishly extension icon in your browser toolbar
3. Paste your API key and click **Save**
4. Start selecting text in any editable field

## Project Structure

```
Polishly/
├── manifest.json      # Extension manifest (v3)
├── content.js         # Content script — selection detection, UI, text replacement
├── api.js             # Gemini API integration
├── styles.css         # Glassmorphism UI styles
├── popup.html/js      # Extension popup — API key management
├── settings.html/js   # Settings page
├── icons/             # Extension icons (SVG + PNG)
└── PRIVACY.md         # Privacy policy
```

## Privacy

Polishly does not collect any data. Your API key is stored locally in your browser. Selected text is sent directly to Google's Gemini API for processing. See [PRIVACY.md](PRIVACY.md) for full details.

## License

MIT
