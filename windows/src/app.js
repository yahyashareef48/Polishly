(() => {
  const { invoke } = window.__TAURI__.core;
  const { getCurrentWindow } = window.__TAURI__.window;
  const root = document.getElementById('root');

  const PEN_ICON = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 20h9"/>
    <path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4L16.5 3.5z"/>
  </svg>`;

  function header() {
    return `<div class="header">${PEN_ICON} Polishly</div>`;
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  // ── Resize window to fit content ──────────────────────────────────────────

  async function fitWindow() {
    const win = getCurrentWindow();
    const h = document.body.scrollHeight + 2;
    await win.setSize(new window.__TAURI__.dpi.PhysicalSize(290, Math.max(h, 60)));
  }

  // ── Views ─────────────────────────────────────────────────────────────────

  function showActionMenu() {
    root.innerHTML = `
      ${header()}
      <button class="btn" id="btn-grammar">Fix Spelling &amp; Grammar</button>
      <div class="tone-row">
        <button class="btn" id="btn-tone">Change Tone</button>
        <select id="tone-select">
          <option value="formal">Formal</option>
          <option value="casual">Casual</option>
          <option value="concise">Concise</option>
          <option value="friendly">Friendly</option>
        </select>
      </div>
      <div class="custom-row">
        <input type="text" id="custom-input" placeholder="Custom instruction…" />
        <button class="btn btn-send" id="btn-custom">Go</button>
      </div>
    `;

    document.getElementById('btn-grammar').addEventListener('click', () => runAction('grammar'));
    document.getElementById('btn-tone').addEventListener('click', () => {
      const tone = document.getElementById('tone-select').value;
      runAction('tone', tone);
    });
    document.getElementById('btn-custom').addEventListener('click', () => {
      const instruction = document.getElementById('custom-input').value.trim();
      if (instruction) runAction('custom', 'formal', instruction);
    });
    document.getElementById('custom-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const instruction = document.getElementById('custom-input').value.trim();
        if (instruction) runAction('custom', 'formal', instruction);
      }
    });

    fitWindow();
  }

  function showLoading() {
    root.innerHTML = `
      ${header()}
      <div class="loading">
        <div class="spinner"></div>
        <span>Polishing…</span>
      </div>
    `;
    fitWindow();
  }

  function showResult(text, isError = false) {
    root.innerHTML = `
      ${header()}
      <div class="result-text ${isError ? 'error' : ''}">${escapeHtml(text)}</div>
      <div class="actions">
        <button class="btn" id="btn-copy">Copy</button>
        <button class="btn btn-primary" id="btn-replace">Replace</button>
        <button class="btn btn-close" id="btn-close">Close</button>
      </div>
    `;

    document.getElementById('btn-copy').addEventListener('click', () => {
      navigator.clipboard.writeText(text).then(() => {
        document.getElementById('btn-copy').textContent = 'Copied!';
      });
    });

    document.getElementById('btn-replace').addEventListener('click', async () => {
      await invoke('hide_all_windows');
      // Small delay so window is hidden before Ctrl+V fires
      setTimeout(() => invoke('replace_text', { text }), 120);
    });

    document.getElementById('btn-close').addEventListener('click', () => {
      invoke('hide_all_windows');
    });

    fitWindow();
  }

  // ── Action runner ─────────────────────────────────────────────────────────

  async function runAction(action, tone = 'formal', customInstruction = '') {
    showLoading();
    try {
      const selectedText = await invoke('get_selected_text');
      const result = await PolishlyAPI.polish(action, selectedText, tone, customInstruction);
      showResult(result);
    } catch (err) {
      showResult(err.message, true);
    }
  }

  // ── Keyboard shortcuts ────────────────────────────────────────────────────

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') invoke('hide_all_windows');
  });

  // ── Init ──────────────────────────────────────────────────────────────────

  showActionMenu();
})();
