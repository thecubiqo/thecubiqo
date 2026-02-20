// Configure side panel behavior on installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('CubiQo Sidekick installed');
    if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
        chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
            .catch((error) => console.error(error));
    }
});

/**
 * Handle messages from content scripts and side panel.
 * - PAGE_CONTEXT: Content script reports current page URL/title
 * - BROWSER_CONTROL: Side panel requests a browser action on the active tab
 *
 * Security: BROWSER_CONTROL messages originate from the side panel context
 * (sidepanel.js), which is an extension page and therefore trusted.
 * Content scripts only send PAGE_CONTEXT messages.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'PAGE_CONTEXT') {
        // Store latest context and forward to side panel via storage
        chrome.storage.local.set({
            currentContext: {
                url: message.url,
                title: message.title,
                timestamp: message.timestamp,
                tabId: sender.tab ? sender.tab.id : null,
            },
        });
    }

    if (message.type === 'BROWSER_CONTROL') {
        handleBrowserControl(message)
            .then((result) => sendResponse(result))
            .catch((error) => sendResponse({ success: false, error: error.message }));
        return true; // Keep channel open for async response
    }
});

/**
 * Handle browser control requests from the side panel.
 * Routes actions to the appropriate tab's content script or uses Chrome APIs.
 */
async function handleBrowserControl(message) {
    const { action, params } = message;

    switch (action) {
        case 'list_tabs': {
            const tabs = await chrome.tabs.query({});
            return {
                success: true,
                data: tabs.map((t) => ({
                    id: t.id,
                    url: t.url,
                    title: t.title,
                    active: t.active,
                })),
            };
        }

        case 'navigate': {
            const tabId = params.tabId;
            const url = params.url;
            if (!tabId || !url) {
                return { success: false, error: 'navigate requires tabId and url' };
            }
            await chrome.tabs.update(tabId, { url });
            return { success: true };
        }

        case 'close_tab': {
            if (!params.tabId) {
                return { success: false, error: 'close_tab requires tabId' };
            }
            await chrome.tabs.remove(params.tabId);
            return { success: true };
        }

        case 'screenshot': {
            try {
                const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
                return { success: true, data: { screenshot: dataUrl } };
            } catch (err) {
                return { success: false, error: 'Failed to capture screenshot: ' + err.message };
            }
        }

        // Actions that run inside the content script
        case 'click':
        case 'type':
        case 'get_content':
        case 'extract':
        case 'scroll': {
            const targetTabId = params.tabId;
            if (!targetTabId) {
                // Default to active tab
                const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (!activeTab) {
                    return { success: false, error: 'No active tab found' };
                }
                params.tabId = activeTab.id;
            }

            return new Promise((resolve) => {
                chrome.tabs.sendMessage(
                    params.tabId,
                    { type: 'BROWSER_ACTION', action, params },
                    (response) => {
                        if (chrome.runtime.lastError) {
                            resolve({
                                success: false,
                                error: 'Content script not available: ' + chrome.runtime.lastError.message,
                            });
                        } else {
                            resolve(response || { success: false, error: 'No response from content script' });
                        }
                    }
                );
            });
        }

        default:
            return { success: false, error: `Unknown action: ${action}` };
    }
}
