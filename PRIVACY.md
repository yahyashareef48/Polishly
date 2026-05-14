# Privacy Policy — Polishly

**Last updated:** May 14, 2026

## Overview

Polishly is a browser extension that helps you polish text in editable fields using AI. Your privacy is important — Polishly is designed to keep your data local and minimal.

## Data Collection

Polishly does **not** collect, store, or transmit any personal data. Specifically:

- No analytics or tracking of any kind
- No user accounts or sign-ups
- No browsing history access
- No cookies

## Data Storage

Polishly stores the following data **locally** in your browser using `chrome.storage.local`:

- **API Key** — Your Google Gemini API key, used to authenticate requests to Google's API
- **Model preference** — Your preferred Gemini model name (e.g., `gemini-2.5-flash-lite`)

This data never leaves your browser except when making API calls to Google.

## Data Transmission

When you use Polishly to polish text, the **selected text only** is sent to:

- **Google Generative Language API** (`generativelanguage.googleapis.com`) — to process your text and return the polished result

No other external services are contacted. The text is sent directly from your browser to Google's API — Polishly does not operate any intermediate servers.

## Permissions

- **storage** — To save your API key and model preference locally
- **activeTab** — To access the current page so the content script can detect text selection and replace text
- **Host permissions (all URLs)** — The content script runs on all pages to detect text selection in editable fields. No page content is read, stored, or transmitted beyond the text you explicitly select and choose to polish.

## Third-Party Services

Polishly relies on the [Google Gemini API](https://ai.google.dev/). Your use of the Gemini API is subject to [Google's Terms of Service](https://policies.google.com/terms) and [Privacy Policy](https://policies.google.com/privacy).

## Changes

If this privacy policy is updated, the changes will be reflected in this document with an updated date.

## Contact

If you have questions about this privacy policy, please open an issue on the [GitHub repository](https://github.com/nicholasyahya/Polishly).
