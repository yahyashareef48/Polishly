const input = document.getElementById('apiKey');
const saveBtn = document.getElementById('saveBtn');
const status = document.getElementById('status');

// Load existing key
chrome.storage.local.get('geminiApiKey', (data) => {
  if (data.geminiApiKey) {
    input.value = data.geminiApiKey;
  }
});

saveBtn.addEventListener('click', () => {
  const key = input.value.trim();
  if (!key) {
    status.textContent = 'Please enter an API key.';
    status.className = 'status error';
    return;
  }
  chrome.storage.local.set({ geminiApiKey: key }, () => {
    status.textContent = 'Key saved!';
    status.className = 'status success';
  });
});
