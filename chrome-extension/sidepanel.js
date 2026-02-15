// Logic for the sidepanel context
const iframe = document.getElementById('app-frame');
const urlSpan = document.getElementById('current-url');

// Listen for tab updates to update context
chrome.tabs.onActivated.addListener(activeInfo => {
    updateContext(activeInfo.tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tab.active && changeInfo.status === 'complete') {
        updateContext(tabId);
    }
});

async function updateContext(tabId) {
    try {
        const tab = await chrome.tabs.get(tabId);
        if (tab.url) {
            urlSpan.textContent = new URL(tab.url).hostname;

            // Post message to iframe app so CubiQo knows where we are looking
            iframe.contentWindow.postMessage({
                type: 'EXTENSION_CONTEXT_UPDATE',
                url: tab.url,
                title: tab.title
            }, '*');
        }
    } catch (e) {
        console.error('Context update failed', e);
    }
}

// Initial update
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) updateContext(tabs[0].id);
});
