/**
 * Method planner — CubiQo goal decomposition + execution method selection.
 *
 * When CubiQo receives a goal, it evaluates ALL available methods to achieve it
 * and picks the optimal one based on: detectability risk, cost, reliability, speed.
 *
 * METHOD REGISTRY (ordered best → worst by default score):
 * ─────────────────────────────────────────────────────────────────────────────────
 * composio:gmail       → detectability=0   cost=free  reliable=✓ (official OAuth API)
 * composio:linkedin    → detectability=0   cost=free  reliable=✓ (official OAuth API)
 * composio:github      → detectability=0   cost=free  reliable=✓ (official OAuth API)
 * composio:googledrive → detectability=0   cost=free  reliable=✓ (official OAuth API)
 * direct:rest_api      → detectability=0   cost=free  reliable=✓ (target has open API)
 * tavily:search        → detectability=0   cost=low   reliable=✓ (dedicated search API)
 * stagehand:browserbase→ detectability=low cost=med   reliable=✓ (cloud stealth browser)
 * ─────────────────────────────────────────────────────────────────────────────────
 * BLOCKED (never use):
 * local:puppeteer      → detectability=HIGH (easily blocked by LinkedIn, Google, etc.)
 * local:playwright     → detectability=HIGH (same — standard browser signatures)
 * ─────────────────────────────────────────────────────────────────────────────────
 *
 * This module exports:
 *  - METHOD_SELECTION_SYSTEM_PROMPT: inject into any agent's system prompt
 *  - buildMethodContext(connectedApps): summarise what's available for a user
 */

export interface AvailableMethod {
  id: string;
  label: string;
  detectability: 'none' | 'low' | 'medium' | 'high';
  costTier: 'free' | 'low' | 'medium' | 'high';
  available: boolean;
  requiresAuth: string | null;
}

/**
 * Build the method context string that tells the agent what tools are usable.
 * Pass the list of connected Composio app slugs for the current user.
 */
export function buildMethodContext(connectedApps: string[]): string {
  const connected = new Set(connectedApps.map(a => a.toLowerCase()));

  const methods: AvailableMethod[] = [
    {
      id: 'composio:gmail',
      label: 'Gmail via Composio (official OAuth API)',
      detectability: 'none',
      costTier: 'free',
      available: connected.has('gmail'),
      requiresAuth: 'gmail OAuth — user must connect in /settings/connections',
    },
    {
      id: 'composio:linkedin',
      label: 'LinkedIn via Composio (official OAuth API)',
      detectability: 'none',
      costTier: 'free',
      available: connected.has('linkedin'),
      requiresAuth: 'linkedin OAuth — user must connect in /settings/connections',
    },
    {
      id: 'composio:googledrive',
      label: 'Google Drive via Composio (official OAuth API)',
      detectability: 'none',
      costTier: 'free',
      available: connected.has('googledrive'),
      requiresAuth: 'googledrive OAuth — user must connect in /settings/connections',
    },
    {
      id: 'composio:github',
      label: 'GitHub via Composio (official OAuth API)',
      detectability: 'none',
      costTier: 'free',
      available: connected.has('github'),
      requiresAuth: 'github OAuth — user must connect in /settings/connections',
    },
    {
      id: 'tavily:search',
      label: 'Tavily real-time web search',
      detectability: 'none',
      costTier: 'low',
      available: !!process.env.TAVILY_API_KEY,
      requiresAuth: null,
    },
    {
      id: 'stagehand:browserbase',
      label: 'Stealth cloud browser (BrowserBase + Stagehand)',
      detectability: 'low',
      costTier: 'medium',
      available: !!(process.env.BROWSERBASE_API_KEY && process.env.BROWSERBASE_PROJECT_ID),
      requiresAuth: null,
    },
  ];

  const avail = methods.filter(m => m.available);
  const unavail = methods.filter(m => !m.available);

  const lines: string[] = [];

  if (avail.length) {
    lines.push('AVAILABLE EXECUTION METHODS (pick optimal):');
    avail.forEach(m => {
      lines.push(`  ✓ ${m.id} — ${m.label}`);
      lines.push(`    detectability=${m.detectability}  cost=${m.costTier}`);
    });
  }

  if (unavail.length) {
    lines.push('');
    lines.push('NOT YET CONNECTED (inform user if needed):');
    unavail.forEach(m => {
      lines.push(`  ✗ ${m.id} — ${m.requiresAuth ?? 'not configured'}`);
    });
  }

  lines.push('');
  lines.push('BLOCKED METHODS — NEVER USE:');
  lines.push('  ✗ local:puppeteer — HIGH detectability, gets accounts banned (LinkedIn, Google block it)');
  lines.push('  ✗ local:playwright — HIGH detectability, same fingerprint issues as Puppeteer');

  return lines.join('\n');
}

/**
 * Core system-prompt section on method selection.
 * Inject this into any agent system prompt that may need to take actions on the web.
 */
export const METHOD_SELECTION_SYSTEM_PROMPT = `
## HOW TO ACHIEVE GOALS — METHOD SELECTION PROTOCOL

For every goal that requires action in the world (send email, post to LinkedIn, browse web, apply for jobs, etc.):

1. DECOMPOSE: Break the goal into atomic sub-tasks
2. ENUMERATE: List ALL possible methods for each sub-task
3. SCORE each method on:
   - Detectability risk (0=API/none → HIGH=will get account banned)
   - Cost (free → high)
   - Reliability (does it break often?)
   - Speed
4. SELECT the method with the best score — prioritise LOW detectability above all else
5. EXECUTE using the selected method
6. If method requires a connection the user hasn't set up, explain clearly and ask them to connect it first

PRIORITY ORDER (always follow):
  1st → Official API via Composio (detectability=0, official OAuth, can never be banned)
  2nd → Dedicated web search APIs (Tavily)
  3rd → Stealth cloud browser via Stagehand/BrowserBase (cloud IPs, real Chrome fingerprints)
  NEVER → Local Puppeteer or local Playwright (easily detected, accounts get banned)

EXAMPLE — "Apply for 10 Software Engineer jobs":
  LinkedIn Easy Apply → use composio:linkedin (official API, 0 detection risk) ✓
  Email application  → use composio:gmail (official API, 0 detection risk) ✓
  Company portal form → use stagehand:browserbase (stealth cloud browser) ✓
  NEVER use Puppeteer to log into LinkedIn — will ban the account ✗

Always tell the user which method you chose and why.
`.trim();
