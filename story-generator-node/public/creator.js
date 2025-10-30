
document.addEventListener('DOMContentLoaded', () => {
    const apiKeySection = document.getElementById('apiKeySection');
    const apiKeyDisplay = document.getElementById('apiKeyDisplay');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
    const clearApiKeyBtn = document.getElementById('clearApiKeyBtn');
    const apiKeyStatus = document.getElementById('apiKeyStatus');

    async function checkApiKey() {
        let apiKey = localStorage.getItem('apiKey');

        if (apiKey) {
            showMaskedKey(apiKey);
        } else {
            showInput();
        }
    }

    function showMaskedKey(apiKey) {
        apiKeyDisplay.textContent = '***' + apiKey.slice(-4);
        apiKeySection.classList.add('key-saved');
        apiKeyStatus.textContent = 'API Key is set';
        apiKeyStatus.style.color = '#4ade80';
    }

    function showInput() {
        apiKeySection.classList.remove('key-saved');
        apiKeyStatus.textContent = 'API Key not set';
        apiKeyStatus.style.color = '#f97316';
    }

    saveApiKeyBtn.addEventListener('click', () => {
        const apiKey = apiKeyInput.value.trim();
        if (apiKey) {
            localStorage.setItem('apiKey', apiKey);
            showMaskedKey(apiKey);
            apiKeyInput.value = '';
        }
    });

    clearApiKeyBtn.addEventListener('click', () => {
        localStorage.removeItem('apiKey');
        showInput();
    });

    checkApiKey();
});
