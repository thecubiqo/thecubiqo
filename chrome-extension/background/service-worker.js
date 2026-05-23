const CUBIQO_ORIGIN = "https://cubiqo.ai";
const POLL_INTERVAL_MS = 3000;

const CHECKOUT_PATTERNS = [
  "/order-confirmed",
  "/order/confirmation",
  "/checkout/thank-you",
  "/thank-you",
  "/success",
  "/receipt",
  "/checkout/complete",
  "/order/success",
  "/order-complete",
  "/purchase/complete",
  "/payment/success",
];

async function getAttribution() {
  try {
    const cookie = await chrome.cookies.get({
      name: "cubiqo_ext_aff",
      url: CUBIQO_ORIGIN,
    });
    if (!cookie) return null;
    const val = JSON.parse(decodeURIComponent(cookie.value));
    if (!val?.eventId || !val?.merchant) return null;
    if (Date.now() > val.expiresAt) return null;
    return val;
  } catch {
    return null;
  }
}

chrome.webNavigation.onCompleted.addListener(
  async ({ url, frameId }) => {
    if (frameId !== 0) return;

    const attribution = await getAttribution();
    if (!attribution) return;

    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      return;
    }

    const currentDomain = parsed.hostname.replace(/^www\./, "");
    const merchantDomain = attribution.merchant.replace(/^www\./, "");
    if (!currentDomain.includes(merchantDomain)) return;

    const isCheckout = CHECKOUT_PATTERNS.some((pattern) =>
      parsed.pathname.toLowerCase().includes(pattern),
    );
    if (!isCheckout) return;

    fetch(`${CUBIQO_ORIGIN}/api/attribution/conversion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recommendationEventId: attribution.eventId,
        merchant: currentDomain,
        urlPath: parsed.pathname,
        extensionVersion: chrome.runtime.getManifest().version,
      }),
    }).catch(() => {});
  },
  { url: [{ schemes: ["https"] }] },
);

let extensionToken = null;

chrome.storage.local.get(["extensionToken"], (result) => {
  extensionToken = result.extensionToken || null;
});

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "SET_EXTENSION_TOKEN") {
    extensionToken = message.token || null;
    chrome.storage.local.set({ extensionToken });
  }
});

async function pollForInstructions() {
  if (!extensionToken) return;
  try {
    const res = await fetch(`${CUBIQO_ORIGIN}/api/connectors/extension/instructions`, {
      headers: { "x-cubiqo-extension-token": extensionToken },
    });
    if (!res.ok || !res.body) return;

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
    }

    const lines = buffer.split("\n").filter((line) => line.startsWith("data: "));
    for (const line of lines) {
      const instruction = JSON.parse(line.replace("data: ", ""));
      if (instruction?.id && Array.isArray(instruction.actions)) {
        await executeInstruction(instruction);
      }
    }
  } catch {
    // Keep the extension quiet; the server heartbeat will show stale if polling fails.
  }
}

async function executeInstruction(instruction) {
  const results = {};
  let failed = false;
  let errorMsg = null;

  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    let tabId = activeTab?.id;

    for (const action of instruction.actions) {
      switch (action.type) {
        case "navigate": {
          if (!action.url) throw new Error("navigate action missing url");
          if (!tabId) {
            const newTab = await chrome.tabs.create({ url: action.url });
            tabId = newTab.id;
          } else {
            await chrome.tabs.update(tabId, { url: action.url });
          }
          await waitForTabLoad(tabId);
          break;
        }
        case "fill": {
          await chrome.scripting.executeScript({
            target: { tabId },
            func: (selector, value) => {
              const el = document.querySelector(selector);
              if (el) {
                el.focus();
                el.value = value;
                el.dispatchEvent(new Event("input", { bubbles: true }));
                el.dispatchEvent(new Event("change", { bubbles: true }));
              }
            },
            args: [action.selector, action.value],
          });
          break;
        }
        case "click": {
          await chrome.scripting.executeScript({
            target: { tabId },
            func: (selector) => {
              const el = document.querySelector(selector);
              if (el) el.click();
            },
            args: [action.selector],
          });
          break;
        }
        case "extract": {
          const [result] = await chrome.scripting.executeScript({
            target: { tabId },
            func: (selector) => document.querySelector(selector)?.textContent?.trim() || null,
            args: [action.selector],
          });
          if (action.extractKey) results[action.extractKey] = result?.result;
          break;
        }
        case "read": {
          const [pageText] = await chrome.scripting.executeScript({
            target: { tabId },
            func: () => document.body.innerText,
            args: [],
          });
          if (action.extractKey) results[action.extractKey] = pageText?.result;
          break;
        }
        case "wait": {
          await new Promise((resolve) => setTimeout(resolve, action.timeoutMs || 1000));
          break;
        }
        case "scroll": {
          await chrome.scripting.executeScript({
            target: { tabId },
            func: () => window.scrollBy({ top: window.innerHeight * 0.75, behavior: "smooth" }),
            args: [],
          });
          break;
        }
        default:
          throw new Error(`Unsupported action ${action.type}`);
      }
    }
  } catch (err) {
    failed = true;
    errorMsg = err?.message || "Extension instruction failed";
  }

  await fetch(`${CUBIQO_ORIGIN}/api/connectors/extension/result`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-cubiqo-extension-token": extensionToken,
    },
    body: JSON.stringify({
      instructionId: instruction.id,
      status: failed ? "failed" : "completed",
      extractedData: results,
      error: errorMsg,
    }),
  }).catch(() => {});
}

async function waitForTabLoad(tabId) {
  return new Promise((resolve) => {
    if (!tabId) {
      resolve();
      return;
    }
    const timeout = setTimeout(resolve, 10000);
    chrome.tabs.onUpdated.addListener(function listener(id, info) {
      if (id === tabId && info.status === "complete") {
        clearTimeout(timeout);
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    });
  });
}

setInterval(pollForInstructions, POLL_INTERVAL_MS);
