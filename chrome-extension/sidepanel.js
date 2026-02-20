// Logic for the sidepanel context
const iframe = document.getElementById('app-frame');
const urlSpan = document.getElementById('current-url');

// Determine the target origin for postMessage security
const iframeSrc = iframe.getAttribute('src');
const TARGET_ORIGIN = new URL(iframeSrc).origin;

// Listen for tab updates to update context
chrome.tabs.onActivated.addListener(activeInfo => {
    updateContext(activeInfo.tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tab.active && changeInfo.status === 'complete') {
        updateContext(tabId);
    }
});

// Also listen for context updates from content scripts via storage
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.currentContext) {
        const context = changes.currentContext.newValue;
        if (context) {
            updateDisplay(context.url, context.title);
        }
    }
});

async function updateContext(tabId) {
    try {
        const tab = await chrome.tabs.get(tabId);
        if (tab.url) {
            updateDisplay(tab.url, tab.title);
        }
    } catch (e) {
        console.error('Context update failed', e);
    }
}

/**
 * Update the status bar display and notify the iframe app
 */
function updateDisplay(url, title) {
    try {
        urlSpan.textContent = new URL(url).hostname;
    } catch (_e) {
        urlSpan.textContent = url;
    }

    // Post message to iframe app so CubiQo knows where we are looking
    iframe.contentWindow.postMessage({
        type: 'EXTENSION_CONTEXT_UPDATE',
        url: url,
        title: title,
    }, TARGET_ORIGIN);
}

/**
 * Listen for browser control requests from the iframe app
 */
window.addEventListener('message', (event) => {
    // Only accept messages from the expected origin
    if (event.origin !== TARGET_ORIGIN) return;

    if (event.data?.type === 'BROWSER_CONTROL') {
        chrome.runtime.sendMessage({
            type: 'BROWSER_CONTROL',
            action: event.data.action,
            params: event.data.params || {},
        }, (response) => {
            // Send result back to iframe
            iframe.contentWindow.postMessage({
                type: 'BROWSER_CONTROL_RESULT',
                requestId: event.data.requestId,
                result: response,
            }, TARGET_ORIGIN);
        });
    }
});

// Initial update
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) updateContext(tabs[0].id);
});
