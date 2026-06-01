import { Language, PLazy } from './vendor/harper/BinaryModule-DmMIV9F-.js';
import { binary } from './vendor/harper/binary.js';

let linterPromise = null;

class LocalHarperLinter {
  constructor(binaryModule) {
    this.binary = binaryModule;
    this.binary.setup();
    this.inner = this.createInner();
  }

  createInner() {
    return PLazy.from(async () => {
      await this.binary.setup();
      return this.binary.createLinter();
    });
  }

  async setup() {
    await this.lint('');
    const ignored = await this.exportIgnoredLints();
    await this.importIgnoredLints(ignored);
  }

  async lint(text) {
    const inner = await this.inner;
    return inner.lint(text, Language.Plain, false);
  }

  async applySuggestion(text, lint, suggestion) {
    const inner = await this.inner;
    return inner.apply_suggestion(text, lint, suggestion);
  }

  async exportIgnoredLints() {
    const inner = await this.inner;
    return inner.export_ignored_lints();
  }

  async importIgnoredLints(json) {
    const inner = await this.inner;
    inner.import_ignored_lints(json);
  }
}

function getLinter() {
  if (!linterPromise) {
    linterPromise = (async () => {
      const linter = new LocalHarperLinter(binary);
      await linter.setup();
      return linter;
    })();
  }
  return linterPromise;
}

async function fixGrammar(text) {
  const linter = await getLinter();
  const lints = await linter.lint(text);
  const fixes = [];

  for (const lint of lints) {
    const suggestions = lint.suggestions();
    if (suggestions.length > 0) {
      const span = lint.span();
      fixes.push({
        lint,
        suggestion: suggestions[0],
        suggestions,
        start: span.start
      });
      span.free();
    }
  }

  fixes.sort((a, b) => b.start - a.start);

  let result = text;
  try {
    for (const fix of fixes) {
      result = await linter.applySuggestion(result, fix.lint, fix.suggestion);
    }
  } finally {
    for (const fix of fixes) {
      for (const suggestion of fix.suggestions) {
        suggestion.free();
      }
    }
    for (const lint of lints) {
      lint.free();
    }
  }

  return result;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.type !== 'POLISHLY_INSTANT_FIX') return;

  fixGrammar(message.text || '')
    .then((result) => sendResponse({ result }))
    .catch((err) => sendResponse({ error: err.message || 'Harper failed to fix grammar.' }));

  return true;
});
