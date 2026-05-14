const Polishly = {
  async getSettings() {
    try {
      return await new Promise((resolve, reject) => {
        if (!chrome.runtime?.id) {
          reject(new Error('EXTENSION_RELOADED'));
          return;
        }
        chrome.storage.local.get(['geminiApiKey', 'geminiModel'], (data) => {
          if (chrome.runtime.lastError) {
            reject(new Error('EXTENSION_RELOADED'));
            return;
          }
          resolve({
            apiKey: data.geminiApiKey || null,
            model: data.geminiModel || 'gemini-2.5-flash-lite'
          });
        });
      });
    } catch (e) {
      if (e.message === 'EXTENSION_RELOADED') {
        throw new Error('Extension was updated. Please refresh this page (F5) and try again.');
      }
      throw e;
    }
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
      throw new Error('No API key set. Click the Polishly extension icon to add your Gemini key.');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
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
  }
};
