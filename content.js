(() => {
  let popup = null;
  let resultModal = null;
  let selectedText = '';

  // ── Create floating popup ──
  function createPopup(x, y) {
    removePopup();

    popup = document.createElement('div');
    popup.id = 'polishly-popup';
    popup.innerHTML = `
      <div class="polishly-header">Polishly</div>
      <button class="polishly-btn" data-action="grammar">Fix Spelling & Grammar</button>
      <div class="polishly-tone-row">
        <button class="polishly-btn polishly-btn-tone" data-action="tone">Change Tone</button>
        <select class="polishly-select" id="polishly-tone-select">
          <option value="formal">Formal</option>
          <option value="casual">Casual</option>
          <option value="concise">Concise</option>
          <option value="friendly">Friendly</option>
        </select>
      </div>
      <div class="polishly-custom-row">
        <input type="text" class="polishly-input" id="polishly-custom-input" placeholder="Custom instruction..." />
        <button class="polishly-btn polishly-btn-send" data-action="custom">Go</button>
      </div>
    `;

    document.body.appendChild(popup);
    positionElement(popup, x, y);
    attachPopupListeners();
  }

  function positionElement(el, x, y) {
    el.style.position = 'fixed';
    el.style.zIndex = '2147483647';

    // Temporarily make visible to measure
    el.style.visibility = 'hidden';
    el.style.display = 'block';

    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = x;
    let top = y + 8;

    if (left + rect.width > vw - 8) left = vw - rect.width - 8;
    if (left < 8) left = 8;
    if (top + rect.height > vh - 8) top = y - rect.height - 8;

    el.style.left = left + 'px';
    el.style.top = top + 'px';
    el.style.visibility = 'visible';
  }

  function attachPopupListeners() {
    popup.querySelectorAll('.polishly-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        if (!action) return;

        const tone = popup.querySelector('#polishly-tone-select')?.value || 'formal';
        const custom = popup.querySelector('#polishly-custom-input')?.value || '';

        handleAction(action, tone, custom);
      });
    });

    // Allow Enter key in custom input
    const customInput = popup.querySelector('#polishly-custom-input');
    if (customInput) {
      customInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleAction('custom', '', customInput.value);
        }
      });
    }

    // Stop clicks inside popup from propagating
    popup.addEventListener('mousedown', (e) => e.stopPropagation());
  }

  // ── Handle action ──
  async function handleAction(action, tone, customInstruction) {
    if (!selectedText) return;

    showLoading();

    try {
      const result = await Polishly.polish(action, selectedText, tone, customInstruction);
      showResult(result);
    } catch (err) {
      showResult(err.message, true);
    }
  }

  function showLoading() {
    removePopup();

    resultModal = document.createElement('div');
    resultModal.id = 'polishly-result';
    resultModal.innerHTML = `
      <div class="polishly-header">Polishly</div>
      <div class="polishly-loading">
        <div class="polishly-spinner"></div>
        <span>Polishing...</span>
      </div>
    `;
    document.body.appendChild(resultModal);
    centerModal(resultModal);
  }

  function showResult(text, isError = false) {
    if (resultModal) resultModal.remove();

    resultModal = document.createElement('div');
    resultModal.id = 'polishly-result';
    resultModal.innerHTML = `
      <div class="polishly-header">Polishly</div>
      <div class="polishly-result-text ${isError ? 'polishly-error' : ''}">${escapeHtml(text)}</div>
      <div class="polishly-actions">
        <button class="polishly-btn" id="polishly-copy-btn">Copy</button>
        <button class="polishly-btn polishly-btn-primary" id="polishly-replace-btn">Replace</button>
        <button class="polishly-btn polishly-btn-close" id="polishly-close-btn">Close</button>
      </div>
    `;
    document.body.appendChild(resultModal);
    centerModal(resultModal);

    // Copy
    resultModal.querySelector('#polishly-copy-btn').addEventListener('click', () => {
      navigator.clipboard.writeText(text).then(() => {
        resultModal.querySelector('#polishly-copy-btn').textContent = 'Copied!';
      });
    });

    // Replace — uses execCommand for broad contenteditable support
    resultModal.querySelector('#polishly-replace-btn').addEventListener('click', () => {
      replaceSelectedText(text);
      removeResult();
    });

    // Close
    resultModal.querySelector('#polishly-close-btn').addEventListener('click', removeResult);

    // Stop propagation
    resultModal.addEventListener('mousedown', (e) => e.stopPropagation());
  }

  function centerModal(el) {
    el.style.position = 'fixed';
    el.style.zIndex = '2147483647';
    el.style.top = '50%';
    el.style.left = '50%';
    el.style.transform = 'translate(-50%, -50%)';
  }

  function replaceSelectedText(newText) {
    const active = document.activeElement;

    // Handle input / textarea
    if (active && (active.tagName === 'TEXTAREA' || (active.tagName === 'INPUT' && active.type === 'text'))) {
      const start = active.selectionStart;
      const end = active.selectionEnd;
      active.value = active.value.slice(0, start) + newText + active.value.slice(end);
      active.selectionStart = active.selectionEnd = start + newText.length;
      active.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }

    // Handle contenteditable / regular page text
    const sel = window.getSelection();
    if (sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(newText));
      sel.removeAllRanges();
    }
  }

  // ── Cleanup ──
  function removePopup() {
    if (popup) { popup.remove(); popup = null; }
  }

  function removeResult() {
    if (resultModal) { resultModal.remove(); resultModal = null; }
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ── Selection listener ──
  document.addEventListener('mouseup', (e) => {
    // Ignore clicks inside our own UI
    if (e.target.closest('#polishly-popup') || e.target.closest('#polishly-result')) return;

    const sel = window.getSelection().toString().trim();
    if (sel.length > 0) {
      selectedText = sel;
      createPopup(e.clientX, e.clientY);
    } else {
      removePopup();
    }
  });

  // Close popup on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      removePopup();
      removeResult();
    }
  });

  // Close popup when clicking outside
  document.addEventListener('mousedown', (e) => {
    if (popup && !e.target.closest('#polishly-popup')) removePopup();
    if (resultModal && !e.target.closest('#polishly-result')) removeResult();
  });
})();
