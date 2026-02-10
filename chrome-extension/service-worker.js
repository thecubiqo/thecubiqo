// Configure side panel behavior on installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('CubiQo Sidekick installed');
    if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
        chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
            .catch((error) => console.error(error));
    }
});

// Allow content scripts to send messsages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'URL_CHANGED') {
        // Forward to side panel if open?
        // Actually sidepanel.js can listen directly or poll active tab.
    }
});
