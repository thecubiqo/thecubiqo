/**
 * CubiQo Content Script
 * Injected into web pages to track navigation and enable browser control.
 * Communicates with the service worker to relay page context to the side panel.
 */

(function () {
  'use strict';

  // Avoid double-injection
  if (window.__cubiqoContentScriptLoaded) return;
  window.__cubiqoContentScriptLoaded = true;

  /**
   * Send current page context to the service worker
   */
  function sendPageContext() {
    chrome.runtime.sendMessage({
      type: 'PAGE_CONTEXT',
      url: window.location.href,
      title: document.title,
      timestamp: Date.now(),
    });
  }

  // Send context on initial load
  sendPageContext();

  // Track SPA-style navigation via History API
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function (...args) {
    originalPushState.apply(this, args);
    sendPageContext();
  };

  history.replaceState = function (...args) {
    originalReplaceState.apply(this, args);
    sendPageContext();
  };

  window.addEventListener('popstate', () => {
    sendPageContext();
  });

  // Track hash changes (e.g. single-page apps using hash routing)
  window.addEventListener('hashchange', () => {
    sendPageContext();
  });

  /**
   * Handle browser control commands from the service worker
   */
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'BROWSER_ACTION') {
      handleBrowserAction(message.action, message.params)
        .then((result) => sendResponse(result))
        .catch((error) => sendResponse({ success: false, error: error.message }));
      return true; // Keep message channel open for async response
    }
  });

  /**
   * Execute a browser action on the current page
   */
  async function handleBrowserAction(action, params) {
    switch (action) {
      case 'get_content': {
        const content = document.body.innerText || '';
        return {
          success: true,
          data: {
            text: content.substring(0, 50000), // Limit to 50KB
            title: document.title,
            url: window.location.href,
          },
        };
      }

      case 'click': {
        const el = document.querySelector(params.selector);
        if (!el) {
          return { success: false, error: `Element not found: ${params.selector}` };
        }
        el.click();
        return { success: true };
      }

      case 'type': {
        const input = document.querySelector(params.selector);
        if (!input) {
          return { success: false, error: `Element not found: ${params.selector}` };
        }
        input.focus();
        input.value = params.text;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return { success: true };
      }

      case 'extract': {
        return extractPageData(params.dataType, params.selector);
      }

      case 'scroll': {
        return handleScroll(params.direction, params.amount);
      }

      default:
        return { success: false, error: `Unknown action: ${action}` };
    }
  }

  /**
   * Extract structured data from the page
   */
  function extractPageData(dataType, selector) {
    switch (dataType) {
      case 'text': {
        const el = selector ? document.querySelector(selector) : document.body;
        return {
          success: true,
          data: el ? el.textContent.trim() : '',
        };
      }
      case 'links': {
        const links = Array.from(document.querySelectorAll('a')).map((a) => ({
          text: a.textContent.trim(),
          href: a.href,
        }));
        return { success: true, data: links };
      }
      case 'images': {
        const images = Array.from(document.querySelectorAll('img')).map((img) => ({
          src: img.src,
          alt: img.alt,
        }));
        return { success: true, data: images };
      }
      default:
        return { success: false, error: `Unknown data type: ${dataType}` };
    }
  }

  /**
   * Handle scroll commands
   */
  function handleScroll(direction, amount) {
    const scrollAmount = amount || 500;
    switch (direction) {
      case 'up':
        window.scrollBy(0, -scrollAmount);
        break;
      case 'down':
        window.scrollBy(0, scrollAmount);
        break;
      case 'top':
        window.scrollTo(0, 0);
        break;
      case 'bottom':
        window.scrollTo(0, document.body.scrollHeight);
        break;
    }
    return { success: true };
  }
})();
