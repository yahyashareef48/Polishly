// Polishly API module — same prompt logic as browser/api.js,
// but reads settings via Tauri IPC instead of chrome.storage.

const PolishlyAPI = {
  async getSettings() {
    const { invoke } = window.__TAURI__.core;
    const config = await invoke('get_settings');
    return {
      apiKey: config.geminiApiKey || null,
      model: config.geminiModel || 'gemini-2.5-flash-lite',
    };
  },

  buildPrompt(action, text, tone, customInstruction) {
    if (action === 'grammar') {
      return `Fix the spelling and grammar of the following text. Return ONLY the corrected text, nothing else.\n\n${text}`;
    }
    if (action === 'tone') {
      return `Rewrite the following text in a ${tone} tone. Return ONLY the rewritten text, nothing else.\n\n${text}`;
    }
    if (action === 'custom') {
      return `${customInstruction}\n\nApply the above instruction to the following text. Return ONLY the result, nothing else.\n\n${text}`;
    }
    return text;
  },

  async callGemini(prompt) {
    const { apiKey, model } = await this.getSettings();
    if (!apiKey) {
      throw new Error('No API key set. Right-click the Polishly tray icon → Settings to add your Gemini key.');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `API error (${res.status})`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
  },

  async polish(action, text, tone, customInstruction) {
    const prompt = this.buildPrompt(action, text, tone, customInstruction);
    return this.callGemini(prompt);
  },
};
