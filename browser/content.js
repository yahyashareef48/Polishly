(() => {
  let trigger = null;
  let popup = null;
  let resultModal = null;
  let selectedText = '';
  let savedRange = null;
  let savedActiveElement = null;
  let savedSelectionStart = null;
  let savedSelectionEnd = null;

  // ── Create small trigger icon ──
  function createTrigger(x, y) {
    removeTrigger();
    removePopup();

    trigger = document.createElement('div');
    trigger.id = 'polishly-trigger';
    trigger.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`;
    trigger.title = 'Polishly';

    document.body.appendChild(trigger);

    // Position near selection
    trigger.style.position = 'fixed';
    trigger.style.zIndex = '2147483647';
    trigger.style.left = (x + 6) + 'px';
    trigger.style.top = (y - 36) + 'px';

    // Keep within viewport
    const vw = window.innerWidth;
    if (x + 6 + 32 > vw) trigger.style.left = (vw - 40) + 'px';
    if (y - 36 < 4) trigger.style.top = (y + 12) + 'px';

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const rect = trigger.getBoundingClientRect();
      removeTrigger();
      createPopup(rect.left, rect.bottom);
    });

    trigger.addEventListener('mousedown', (e) => e.stopPropagation());
  }

  function removeTrigger() {
    if (trigger) { trigger.remove(); trigger = null; }
  }

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

  function saveSelection() {
    const active = document.activeElement;
    if (active && (active.tagName === 'TEXTAREA' || (active.tagName === 'INPUT' && active.type === 'text'))) {
      savedActiveElement = active;
      savedSelectionStart = active.selectionStart;
      savedSelectionEnd = active.selectionEnd;
      savedRange = null;
    } else {
      const sel = window.getSelection();
      if (sel.rangeCount > 0) {
        savedRange = sel.getRangeAt(0).cloneRange();
      }
      savedActiveElement = active;
      savedSelectionStart = null;
      savedSelectionEnd = null;
    }
  }

  function replaceSelectedText(newText) {
    // Handle input / textarea using execCommand for framework compatibility
    if (savedActiveElement && (savedActiveElement.tagName === 'TEXTAREA' || (savedActiveElement.tagName === 'INPUT' && savedActiveElement.type === 'text'))) {
      savedActiveElement.focus();
      savedActiveElement.selectionStart = savedSelectionStart;
      savedActiveElement.selectionEnd = savedSelectionEnd;

      // execCommand('insertText') triggers proper input events that React/Vue/Angular detect
      if (!document.execCommand('insertText', false, newText)) {
        // Fallback: set value directly and fire InputEvent
        const start = savedSelectionStart;
        const end = savedSelectionEnd;
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          Object.getPrototypeOf(savedActiveElement), 'value'
        )?.set;
        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(savedActiveElement,
            savedActiveElement.value.slice(0, start) + newText + savedActiveElement.value.slice(end)
          );
        } else {
          savedActiveElement.value = savedActiveElement.value.slice(0, start) + newText + savedActiveElement.value.slice(end);
        }
        savedActiveElement.selectionStart = savedActiveElement.selectionEnd = start + newText.length;
        savedActiveElement.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: newText }));
        savedActiveElement.dispatchEvent(new Event('change', { bubbles: true }));
      }
      return;
    }

    // Handle contenteditable using execCommand for undo support and framework compatibility
    if (savedRange) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(savedRange);

      if (savedActiveElement && savedActiveElement.focus) {
        savedActiveElement.focus();
      }

      // execCommand preserves undo history and works with contenteditable frameworks
      if (!document.execCommand('insertText', false, newText)) {
        // Fallback: manual range replacement
        savedRange.deleteContents();
        savedRange.insertNode(document.createTextNode(newText));
        sel.removeAllRanges();
      }
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

  function isEditableElement(el) {
    if (!el) return false;
    if (el.tagName === 'TEXTAREA') return true;
    if (el.tagName === 'INPUT' && el.type === 'text') return true;
    if (el.isContentEditable) return true;
    return false;
  }

  // ── Selection listener ──
  document.addEventListener('mouseup', (e) => {
    // Ignore clicks inside our own UI
    if (e.target.closest('#polishly-popup') || e.target.closest('#polishly-result') || e.target.closest('#polishly-trigger')) return;

    // Only activate in text inputs, textareas, and contenteditable elements
    const active = document.activeElement;
    if (!isEditableElement(active) && !e.target.closest('[contenteditable="true"]')) {
      removeTrigger();
      removePopup();
      return;
    }

    const sel = window.getSelection().toString().trim();
    if (sel.length > 0) {
      selectedText = sel;
      saveSelection();
      createTrigger(e.clientX, e.clientY);
    } else {
      removeTrigger();
      removePopup();
    }
  });

  // ── Keyboard selection listener ──
  document.addEventListener('keyup', (e) => {
    const active = document.activeElement;
    if (!isEditableElement(active)) return;

    const sel = window.getSelection().toString().trim();
    if (sel.length > 0) {
      selectedText = sel;
      saveSelection();

      let x, y;
      if (active.tagName === 'TEXTAREA' || active.tagName === 'INPUT') {
        const rect = active.getBoundingClientRect();
        x = rect.right;
        y = rect.top + rect.height / 2;
      } else {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const rect = selection.getRangeAt(0).getBoundingClientRect();
          x = rect.right;
          y = rect.top;
        } else {
          return;
        }
      }
      createTrigger(x, y);
    } else {
      removeTrigger();
      removePopup();
    }
  });

  // Close popup on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      removeTrigger();
      removePopup();
      removeResult();
    }
  });

  // Close popup when clicking outside
  document.addEventListener('mousedown', (e) => {
    if (trigger && !e.target.closest('#polishly-trigger')) removeTrigger();
    if (popup && !e.target.closest('#polishly-popup')) removePopup();
    if (resultModal && !e.target.closest('#polishly-result')) removeResult();
  });
})();
