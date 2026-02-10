// Open side panel on action click
chrome.action.onClicked.addListener((tab) => {
    chrome.sidePanel.open({ tabId: tab.id });
});

// Allow content scripts to send messsages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'URL_CHANGED') {
        // Forward to side panel if open?
        // Actually sidepanel.js can listen directly or poll active tab.
    }
});
