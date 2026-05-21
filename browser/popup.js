const apiKeyInput = document.getElementById('apiKeyInput');
const modelInput = document.getElementById('modelInput');
const saveBtn = document.getElementById('saveBtn');
const toggleBtn = document.getElementById('toggleBtn');
const saveStatus = document.getElementById('saveStatus');
const statusBadge = document.getElementById('statusBadge');
const statusText = document.getElementById('statusText');

// Load existing settings
chrome.storage.local.get(['geminiApiKey', 'geminiModel'], (data) => {
  if (data.geminiApiKey) {
    apiKeyInput.value = data.geminiApiKey;
    setConnected(true);
  }
  if (data.geminiModel) {
    modelInput.value = data.geminiModel;
  }
});

// Save key + model
saveBtn.addEventListener('click', () => {
  const key = apiKeyInput.value.trim();
  if (!key) {
    saveStatus.textContent = 'Please enter an API key.';
    saveStatus.className = 'save-status error';
    return;
  }
  const model = modelInput.value.trim();
  chrome.storage.local.set({
    geminiApiKey: key,
    geminiModel: model || ''
  }, () => {
    saveStatus.textContent = 'Saved!';
    saveStatus.className = 'save-status success';
    setConnected(true);
    setTimeout(() => { saveStatus.textContent = ''; }, 2000);
  });
});

// Toggle visibility
toggleBtn.addEventListener('click', () => {
  const isPassword = apiKeyInput.type === 'password';
  apiKeyInput.type = isPassword ? 'text' : 'password';
  toggleBtn.textContent = isPassword ? '🙈' : '👁';
});

function setConnected(connected) {
  if (connected) {
    statusBadge.className = 'status-badge connected';
    statusText.textContent = 'API key set';
  } else {
    statusBadge.className = 'status-badge missing';
    statusText.textContent = 'No API key';
  }
}
