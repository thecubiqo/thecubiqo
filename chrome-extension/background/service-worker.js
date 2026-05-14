const CUBIQO_ORIGIN = "https://cubiqo.ai";

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
