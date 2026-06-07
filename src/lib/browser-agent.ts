/**
 * Stealth browser automation via Stagehand + BrowserBase.
 *
 * WHY BROWSERBASE instead of local Puppeteer:
 *  - BrowserBase runs real Chrome on cloud infrastructure with rotating residential IPs
 *  - Browser fingerprints match real user sessions — NOT the headless signatures
 *    that LinkedIn, Google, and Cloudflare detect and block
 *  - Local Puppeteer/Playwright with default settings have known fingerprints
 *    that major platforms actively block and ban accounts for
 *
 * Usage: call runBrowserTask({ task, startUrl }) from any API route.
 * Stagehand uses Claude/GPT to drive the browser — pass a natural-language task.
 */

export interface BrowserTaskInput {
  startUrl: string;
  /** Natural-language instruction: "Fill the job application form with name=Aditya, email=..." */
  task: string;
  /** Optional: extract structured data after performing the task */
  extractInstruction?: string;
  /** Max milliseconds before giving up (default 50s — leave headroom for route timeout) */
  timeoutMs?: number;
}

export interface BrowserTaskResult {
  success: boolean;
  /** Extracted data if extractInstruction was provided */
  extracted?: unknown;
  /** Human-readable summary of what was done */
  summary: string;
  error?: string;
}

export function isBrowserAvailable(): boolean {
  return !!(process.env.BROWSERBASE_API_KEY && process.env.BROWSERBASE_PROJECT_ID);
}

export async function runBrowserTask(input: BrowserTaskInput): Promise<BrowserTaskResult> {
  const apiKey = process.env.BROWSERBASE_API_KEY;
  const projectId = process.env.BROWSERBASE_PROJECT_ID;

  if (!apiKey || !projectId) {
    return {
      success: false,
      summary: 'Stealth browser not configured',
      error: 'BROWSERBASE_API_KEY and BROWSERBASE_PROJECT_ID are required',
    };
  }

  const { Stagehand } = await import('@browserbasehq/stagehand');
  const stagehand = new Stagehand({
    env: 'BROWSERBASE',
    apiKey,
    projectId,
    verbose: 0,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

  const deadline = Date.now() + (input.timeoutMs ?? 50_000);

  try {
    await stagehand.init();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const page = (stagehand as any).page;

    await page.goto(input.startUrl, {
      waitUntil: 'domcontentloaded',
      timeout: Math.min(20_000, deadline - Date.now()),
    });

    // Perform the task using Stagehand's AI-powered act()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (stagehand as any).act(input.task);

    let extracted: unknown = undefined;
    if (input.extractInstruction && Date.now() < deadline) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      extracted = await (stagehand as any).extract(input.extractInstruction);
    }

    return {
      success: true,
      extracted,
      summary: `Completed: "${input.task}" at ${input.startUrl}`,
    };
  } catch (err) {
    return {
      success: false,
      summary: `Browser task failed: ${String(err)}`,
      error: String(err),
    };
  } finally {
    try { await stagehand.close(); } catch { /* ignore */ }
  }
}
