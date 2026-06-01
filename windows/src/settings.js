(() => {
  const { invoke } = window.__TAURI__.core;
  const { open } = window.__TAURI__.shell;

  const keyInput = document.getElementById('api-key');
  const modelSelect = document.getElementById('model-select');
  const hotkeySelect = document.getElementById('hotkey-select');
  const statusEl = document.getElementById('status');
  const statusText = document.getElementById('status-text');
  const saveBtn = document.getElementById('save-btn');
  const toggleBtn = document.getElementById('toggle-key');

  // ── Load saved settings ───────────────────────────────────────────────────

  async function loadSettings() {
    const config = await invoke('get_settings');
    if (config.geminiApiKey) {
      keyInput.value = config.geminiApiKey;
      setStatus(true);
    }
    if (config.geminiModel) {
      modelSelect.value = config.geminiModel;
    }
    if (config.hotkey) {
      hotkeySelect.value = config.hotkey;
    }
  }

  function setStatus(hasKey) {
    if (hasKey) {
      statusEl.className = 'status connected';
      statusText.textContent = 'API key saved';
    } else {
      statusEl.className = 'status missing';
      statusText.textContent = 'No key saved';
    }
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  saveBtn.addEventListener('click', async () => {
    const apiKey = keyInput.value.trim();
    const model = modelSelect.value;
    const hotkey = hotkeySelect.value;
    try {
      await invoke('save_settings', { apiKey, model, hotkey });
      setStatus(!!apiKey);
      saveBtn.textContent = 'Saved!';
      setTimeout(() => { saveBtn.textContent = 'Save Settings'; }, 1500);
    } catch (err) {
      saveBtn.textContent = 'Error saving';
      setTimeout(() => { saveBtn.textContent = 'Save Settings'; }, 2000);
      return;
    }
    try {
      await invoke('reregister_hotkey', { hotkey });
    } catch (_) {
      // hotkey conflict — app will surface its own dialog
    }
  });

  // ── Toggle key visibility ─────────────────────────────────────────────────

  toggleBtn.addEventListener('click', () => {
    keyInput.type = keyInput.type === 'password' ? 'text' : 'password';
  });

  // ── Open AI Studio link in default browser ────────────────────────────────

  document.getElementById('ai-studio-link').addEventListener('click', async (e) => {
    e.preventDefault();
    await open('https://aistudio.google.com/app/apikey');
  });

  loadSettings();
})();
