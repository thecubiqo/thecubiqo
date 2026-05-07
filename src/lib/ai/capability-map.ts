export type CapabilityDomain = {
  id: string;
  label: string;
  currentV1: string[];
  requiredContext: string[];
  v2ToolsRequired: string[];
  blockedUntilV2: string[];
  safeDefaultStrategy: string;
};

const domains: CapabilityDomain[] = [
  {
    id: 'career_job_hunt',
    label: 'Job Hunt + Career',
    currentV1: [
      'understand target roles, industries, locations, compensation, resume strengths, gaps, and application strategy',
      'draft resumes, cover letters, recruiter messages, LinkedIn summaries, interview prep, and application plans',
      'explain which job-hunt capabilities are present versus missing from the current repo'
    ],
    requiredContext: [
      'resume and work history',
      'target titles, seniority, salary, locations, remote/hybrid preference',
      'preferred job boards and employer sites',
      'visa/work authorization constraints when relevant',
      'application rules: easy apply only, direct site apply, recruiter outreach, or all',
      'approval preference before any submission or message'
    ],
    v2ToolsRequired: [
      'job source connectors or compliant search APIs for fresh postings',
      'job tracker tables for searches, saved jobs, application status, resume versions, and outreach',
      'browser extension or approved browser session for user-visible site applications',
      'resume/profile parser and job-to-resume matching scorer',
      'approval card before every apply, upload, message, or profile update',
      'audit log of every job action and submitted field'
    ],
    blockedUntilV2: [
      'one-button easy apply',
      'LinkedIn, Indeed, Dice, or employer-site submission',
      'browser control across job boards',
      'sending recruiter messages',
      'uploading resumes or changing profiles'
    ],
    safeDefaultStrategy:
      'V1 can plan and prepare. V2 must use approved, user-visible, compliant browser/API actions; do not design stealth or evasion behavior.'
  },
  {
    id: 'ecommerce_pod_business',
    label: 'Ecomm + Fashion Brand + POD',
    currentV1: [
      'reason about brand positioning, niches, product drops, pricing, margins, bundles, ad concepts, and launch sequencing',
      'draft product names, descriptions, design prompts, collection themes, ad copy, email copy, and social calendars',
      'prepare GFXTools-ready creative briefs and Shopify/Printify/Printful setup checklists'
    ],
    requiredContext: [
      'brand name, audience, style direction, price point, and product categories',
      'POD vendor preference: Printify, Printful, Shopify, Etsy, or other',
      'design constraints, trademark exclusions, and asset formats',
      'marketing channels, posting cadence, budget, and target geographies',
      'fulfillment, returns, payment, and customer support preferences'
    ],
    v2ToolsRequired: [
      'connector status and secure token storage for Shopify, Printify/Printful, Stripe, and GFXTools',
      'product/catalog tables for designs, products, variants, listings, campaigns, and sales metrics',
      'approved image/design generation or GFXTools job creation',
      'approved product listing creation/update',
      'approved social/ad scheduling',
      'daily business report and recommendation workflow'
    ],
    blockedUntilV2: [
      'creating live products',
      'publishing listings',
      'posting or scheduling ads',
      'connecting store accounts',
      'processing payments or orders'
    ],
    safeDefaultStrategy:
      'V1 can decide and prepare. V2 must connect real accounts only through server-side secrets, explicit approval, and audit logs.'
  },
  {
    id: 'personal_context',
    label: 'Personal Context + Routine + Memory',
    currentV1: [
      'help structure routines, daily plans, journal reflections, priorities, and lightweight accountability',
      'summarize known context from user-provided conversation and journal content when available',
      'classify RGY signals for current activity context'
    ],
    requiredContext: [
      'routine goals, constraints, energy patterns, sleep/work windows, and focus blockers',
      'what the user wants remembered versus kept session-only',
      'notification/report cadence',
      'boundaries for sensitive topics and external actions'
    ],
    v2ToolsRequired: [
      'explicit user memory model with edit/delete controls',
      'cron/reporting jobs',
      'calendar/email connectors when approved',
      'daily report generator',
      'camera/biometric permissions only through platform-safe prompts'
    ],
    blockedUntilV2: [
      'automatic daily reports',
      'calendar/email changes',
      'camera awareness',
      'biometric-driven personalization',
      'proactive verbal interruption'
    ],
    safeDefaultStrategy:
      'V1 gives guidance and stores only existing journal/RGY flows. V2 can add proactive assistance only with permission, controls, and clear logs.'
  }
];

const matchers: Record<string, RegExp> = {
  career_job_hunt: /\b(job|jobs|career|resume|linkedin|indeed|dice|application|apply|interview|recruiter|salary|role|posting|posted)\b/i,
  ecommerce_pod_business: /\b(ecomm|ecommerce|shopify|printify|printful|pod|fashion|brand|clothing|shirt|hoodie|store|sales|marketing|ads|gfx|gfxtools|product|launch)\b/i,
  personal_context: /\b(routine|habit|journal|memory|daily|schedule|focus|mental|mood|context|personal|reminder|report)\b/i
};

export function capabilityPlanForText(text: string) {
  const matched = domains.filter(domain => matchers[domain.id]?.test(text));
  const selected = matched.length ? matched : domains;

  return {
    mode: 'agentic-readiness-v1',
    summary:
      'CubiQo V1 can understand, plan, draft, classify, and inspect. Real external actions move to V2 with approved tools, browser/API connectors, and audit logs.',
    matchedDomains: selected,
    globalV2Requirements: [
      'approval before every write/action',
      'server-side secret storage only',
      'per-tool feature flags',
      'audit log for submissions/posts/messages/account changes',
      'user-visible browser/session controls where browser automation is used',
      'no stealth, evasion, or hidden automation'
    ]
  };
}
