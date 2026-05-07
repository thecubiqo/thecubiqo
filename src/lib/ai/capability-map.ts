export type CapabilityDomain = {
  id: string;
  label: string;
  currentV1: string[];
  requiredContext: string[];
  preferredV2Path: string[];
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
    preferredV2Path: [
      'use job/search APIs or approved partner connectors first',
      'use browser/extension only when a target site has no suitable API and the user approves the visible session',
      'store only job tracker state in CubiQo; do not custom-build a job-board crawler'
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
    id: 'startup_business_growth',
    label: 'Startup + Revenue + Business Growth',
    currentV1: [
      'reason about market need, customer segments, positioning, offers, pricing, revenue paths, investor narratives, and go-to-market sequencing',
      'brainstorm startup ideas, validate business assumptions, map competitors, and turn rough ideas into experiments',
      'draft product names, landing copy, sales scripts, investor blurbs, campaign ideas, email copy, social calendars, and AI-app workflows',
      'prepare POD/ecomm-specific creative briefs and Shopify/Printify/Printful/GFXTools setup checklists when the business is fashion or merchandise'
    ],
    requiredContext: [
      'business idea, target customer, pain point, market, geography, budget, and current assets',
      'revenue goal, pricing assumptions, sales channel, distribution channel, and timeline',
      'competitors, substitutes, investor/funding needs, and proof already collected',
      'AI tools the user already has or wants to leverage for research, design, marketing, sales, support, or operations',
      'for POD/ecomm: brand name, audience, style direction, product categories, vendor preference, trademark exclusions, fulfillment, returns, and customer support preferences'
    ],
    preferredV2Path: [
      'use search/research APIs for market validation instead of custom crawling',
      'use CRM/email/calendar APIs for outreach and follow-up instead of building a CRM first',
      'use Shopify, Printify/Printful, Stripe, GFXTools, and selected AI app APIs for execution'
    ],
    v2ToolsRequired: [
      'live market/search connector and source ledger for market validation',
      'CRM or lead tracker for prospects, outreach, sales pipeline, and customer discovery',
      'business experiment tables for hypotheses, campaigns, offers, metrics, and learnings',
      'connector status and secure token storage for Shopify, Printify/Printful, Stripe, GFXTools, email, calendar, and selected AI apps',
      'product/catalog tables for designs, products, variants, listings, campaigns, and sales metrics when ecomm/POD is used',
      'approved image/design generation or GFXTools job creation',
      'approved product listing, outreach, ad, email, or social publishing',
      'daily business report and recommendation workflow'
    ],
    blockedUntilV2: [
      'claiming fresh market research without a live source tool',
      'sending investor/customer outreach',
      'creating live products',
      'publishing listings',
      'posting or scheduling ads',
      'connecting store accounts',
      'processing payments or orders'
    ],
    safeDefaultStrategy:
      'V1 can research from provided context, decide, draft, and prepare strategy. V2 must connect live sources/accounts only through server-side secrets, explicit approval, and audit logs.'
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
    preferredV2Path: [
      'use managed cron/workflow for reminders and reports',
      'use calendar/email connectors only after approval',
      'keep CubiQo storage limited to user-owned memory, preferences, and audit records'
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
  },
  {
    id: 'research_knowledge',
    label: 'Research + Knowledge Work',
    currentV1: [
      'break research questions into source, comparison, and decision plans',
      'summarize user-provided context and explain what live data/tools are still missing',
      'prepare research briefs, buying criteria, competitor lists, and decision matrices'
    ],
    requiredContext: [
      'research question and expected output',
      'recency needs and acceptable sources',
      'decision criteria, budget, geography, and deadlines',
      'whether web search, documents, email, or browser inspection is needed'
    ],
    preferredV2Path: [
      'use live search/research APIs before browser extraction',
      'use document/email connectors only when the user explicitly connects them',
      'save source ledgers and decisions in CubiQo rather than building a custom research crawler'
    ],
    v2ToolsRequired: [
      'live web/search connector',
      'browser page reader with citation capture',
      'document/email connectors when approved',
      'saved research workspace and source ledger',
      'source quality scoring and final recommendation template'
    ],
    blockedUntilV2: [
      'claiming fresh web results without a live search/browser tool',
      'reading private documents or email',
      'saving source ledgers outside approved storage'
    ],
    safeDefaultStrategy:
      'V1 can structure research and work from provided material. V2 adds live source lookup and citations.'
  },
  {
    id: 'browser_extension_actions',
    label: 'Browser + Extension Actions',
    currentV1: [
      'explain when a browser or extension is required',
      'plan multi-site workflows and identify approval points',
      'prepare form-field maps for later browser sessions'
    ],
    requiredContext: [
      'target sites and accounts',
      'exact task: read, click, type, upload, submit, buy, book, or message',
      'which steps require user confirmation',
      'data that may be entered into forms'
    ],
    preferredV2Path: [
      'use provider APIs first where available',
      'use managed browser sessions or a user-visible extension only for API gaps',
      'avoid hidden browser automation and avoid custom stealth/evasion behavior'
    ],
    v2ToolsRequired: [
      'approved browser session runtime',
      'browser extension for user-visible cross-site context',
      'domain allowlist and session isolation',
      'screenshot/log redaction',
      'approval card before click/type/upload/submit/payment'
    ],
    blockedUntilV2: [
      'controlling websites',
      'submitting forms',
      'uploading files',
      'following the user across browser tabs',
      'booking or purchasing'
    ],
    safeDefaultStrategy:
      'V1 plans browser work. V2 performs only visible, approved browser actions with logs.'
  },
  {
    id: 'social_affiliate_growth',
    label: 'Social Growth + Affiliate Marketing',
    currentV1: [
      'plan campaigns, content calendars, hooks, captions, offers, and affiliate positioning',
      'draft 10/10/10 style campaign plans without posting',
      'prepare creative briefs for GFXTools or design generation'
    ],
    requiredContext: [
      'brand, offer, audience, platforms, accounts, cadence, and region',
      'affiliate products, payout rules, disclosure requirements, and link tracking',
      'creative style, compliance rules, and approval flow'
    ],
    preferredV2Path: [
      'use social platform APIs where available',
      'use GFXTools or image-generation APIs for creative work',
      'use managed scheduler/cron only after explicit account connection and approval'
    ],
    v2ToolsRequired: [
      'social account connectors or approved browser sessions',
      'GFXTools integration',
      'campaign/task/report tables',
      'scheduler/cron runner',
      'approval and audit log before every post'
    ],
    blockedUntilV2: [
      'posting to social accounts',
      'running the 10/10/10 automation',
      'creating public ads',
      'publishing affiliate links'
    ],
    safeDefaultStrategy:
      'V1 drafts and plans. V2 schedules or posts only after account connection and approval.'
  },
  {
    id: 'shopping_connectors_life_ops',
    label: 'Shopping + Life Connectors',
    currentV1: [
      'plan shopping, food, taxi, calendar, email, and smart-home tasks',
      'compare options from user-provided details',
      'prepare instructions and checklists for later connectors'
    ],
    requiredContext: [
      'service provider, account, location, budget, timing, and preferences',
      'approval rules before booking, ordering, sending, or changing devices',
      'privacy boundaries for calendar/email/home data'
    ],
    preferredV2Path: [
      'use provider APIs or official connectors first',
      'use browser sessions only when the provider has no suitable API',
      'keep booking/payment actions behind approve/cancel cards'
    ],
    v2ToolsRequired: [
      'email and calendar connectors',
      'shopping/food/taxi provider connectors or browser sessions',
      'smart-home connector',
      'payment/booking approval cards',
      'notification and cancellation handling'
    ],
    blockedUntilV2: [
      'placing orders',
      'booking rides',
      'sending email',
      'changing calendar events',
      'controlling smart-home devices'
    ],
    safeDefaultStrategy:
      'V1 can advise and prepare. V2 acts only through approved connectors and visible confirmations.'
  },
  {
    id: 'cq_friend_messenger',
    label: 'CQ-to-CQ Friend Messenger',
    currentV1: [
      'explain CQ identity, friend/contact adding, and private friend-to-friend messaging requirements',
      'plan a simple contact list and direct-message experience',
      'keep CQ messenger separate from RGY matching and Signal/intent features'
    ],
    requiredContext: [
      'CQ identity rules and handle/number format',
      'friend/contact add rules',
      'message privacy, notification, block/report, and account recovery expectations',
      'whether presence/read receipts are wanted'
    ],
    preferredV2Path: [
      'use Supabase auth and realtime for the first CQ messenger implementation',
      'keep it as simple friend/contact messaging',
      'defer calls until signaling/TURN and abuse controls are designed'
    ],
    v2ToolsRequired: [
      'CQ profiles, contacts, messages, and presence tables',
      'Supabase realtime channels',
      'friend request/add/remove flow',
      'block/report controls',
      'TURN/signaling design before calls'
    ],
    blockedUntilV2: [
      'creating real CQ friend connections',
      'sending CQ messages',
      'voice/video calls'
    ],
    safeDefaultStrategy:
      'V1 can plan CQ messenger. V2 enables friend connections and messages after auth, realtime, privacy, and abuse controls exist.'
  },
  {
    id: 'money_wallet_payments',
    label: 'Money + Wallet + Payments',
    currentV1: [
      'reason about payment flows, QR release concepts, pricing, margin, and business models',
      'prepare non-custodial versus custodial decision notes',
      'identify compliance and risk questions before build'
    ],
    requiredContext: [
      'payment type, custody model, amount, recipient, release rules, refund/dispute model',
      'Stripe versus crypto separation',
      'jurisdiction and compliance constraints'
    ],
    preferredV2Path: [
      'use Stripe APIs first for conventional payments',
      'defer crypto movement until legal/compliance and custody decisions are complete',
      'store only ledger/audit state in CubiQo unless a regulated provider is selected'
    ],
    v2ToolsRequired: [
      'Stripe connector',
      'wallet/ledger schema',
      'QR release lifecycle tables',
      'approval and dispute workflow',
      'compliance review before live funds'
    ],
    blockedUntilV2: [
      'moving money',
      'creating payment links',
      'crypto transfer',
      'QR release of funds'
    ],
    safeDefaultStrategy:
      'V1 can design the flow. V2 needs compliance, approvals, and a real ledger before money moves.'
  },
  {
    id: 'ops_self_reporting_security',
    label: 'Ops + Self-Report + Security',
    currentV1: [
      'inspect current repo/runtime facts through read-only tools',
      'explain diagnostics and regression boundaries',
      'prepare daily report and self-heal requirements'
    ],
    requiredContext: [
      'report cadence and recipient',
      'which checks matter: build, Supabase, Vercel, voice, routes, uptime',
      'what is allowed as automatic repair versus recommendation only'
    ],
    preferredV2Path: [
      'use Vercel/Supabase status APIs and managed cron/workflow',
      'recommend fixes before mutation',
      'require explicit approval before any repair action'
    ],
    v2ToolsRequired: [
      'cron/reporting scheduler',
      'diagnostic_reports table',
      'health check endpoints',
      'Vercel/Supabase status connectors',
      'repair approval flow and kill switch'
    ],
    blockedUntilV2: [
      'automatic repair',
      'antivirus claims',
      'daily reports sent without setup',
      'production changes'
    ],
    safeDefaultStrategy:
      'V1 reports truthfully. V2 can notify and recommend fixes; automatic repair needs explicit controls.'
  },
  {
    id: 'coder_studio_builder',
    label: 'Coder + Studio + Builder',
    currentV1: [
      'inspect repo files read-only and explain implementation state',
      'plan code changes and test strategy',
      'identify where Codex-level engineering is still required'
    ],
    requiredContext: [
      'target repo/workspace',
      'file and terminal permissions',
      'sandbox model',
      'deployment approval rules'
    ],
    preferredV2Path: [
      'use managed sandbox/API tool execution first',
      'avoid a custom unrestricted terminal',
      'keep file writes, tests, and deploys behind approval and audit'
    ],
    v2ToolsRequired: [
      'API or managed sandbox path first, such as Vercel Sandbox/SDK-style tool execution instead of a custom raw terminal product',
      'file write and patch tools with approval inside isolated workspaces',
      'allowlisted test runner and deploy proposal flow',
      'audit log for code actions'
    ],
    blockedUntilV2: [
      'editing files',
      'running arbitrary terminal commands',
      'deploying',
      'opening raw production terminal'
    ],
    safeDefaultStrategy:
      'V1 explains and plans code. V2 should use a managed API/sandbox/tooling layer before CubiQo writes code; avoid building a custom unrestricted coder terminal.'
  },
  {
    id: 'camera_biometrics_voice',
    label: 'Camera + Biometrics + Proactive Voice',
    currentV1: [
      'explain permission needs and safe user experience',
      'support browser speech recognition in journal where available',
      'plan camera/biometric/proactive voice requirements'
    ],
    requiredContext: [
      'camera use case and whether images are stored or session-only',
      'biometric auth provider',
      'when CubiQo may speak first or interrupt',
      'DND, volume, consent, and privacy rules'
    ],
    preferredV2Path: [
      'use browser/platform permission APIs',
      'use WebAuthn/passkeys for biometrics instead of custom biometric handling',
      'keep sensor usage visible and session-scoped unless the user explicitly saves context'
    ],
    v2ToolsRequired: [
      'browser camera permission flow',
      'platform-safe passkey/WebAuthn auth',
      'voice activity and interruption settings',
      'media retention controls',
      'clear visual indicator when sensors are active'
    ],
    blockedUntilV2: [
      'camera awareness',
      'biometric personalization',
      'proactive verbal interruption',
      'recording or storing media'
    ],
    safeDefaultStrategy:
      'V1 can plan and ask permission. V2 needs explicit sensor indicators and privacy controls.'
  }
];

const matchers: Record<string, RegExp> = {
  career_job_hunt: /\b(job|jobs|career|resume|linkedin|indeed|dice|application|apply|interview|recruiter|salary|role|posting|posted)\b/i,
  startup_business_growth: /\b(startup|business|market|revenue|investor|investors|funding|idea|ideas|brainstorm|validate|validation|customer|customers|sales|marketing|growth|gtm|go-to-market|competitor|competitors|offer|offers|ai apps|automation|ecomm|ecommerce|shopify|printify|printful|pod|fashion|brand|clothing|shirt|hoodie|store|ads|gfx|gfxtools|product|launch)\b/i,
  personal_context: /\b(routine|habit|journal|memory|daily|schedule|focus|mental|mood|context|personal|reminder|report)\b/i,
  research_knowledge: /\b(research|compare|analysis|analyze|lookup|look up|source|sources|news|market|competitor|recommendation|decision)\b/i,
  browser_extension_actions: /\b(browser|extension|tab|website|site|click|type|upload|submit|form|book|booking|headless|playwright)\b/i,
  social_affiliate_growth: /\b(social|affiliate|campaign|content|post|posts|10\/10\/10|101010|instagram|facebook|threads|tiktok|ad|ads|gfxtools)\b/i,
  shopping_connectors_life_ops: /\b(shopping|shop|buy|food|taxi|uber|ride|calendar|email|gmail|outlook|smart-home|smart home|device|order)\b/i,
  cq_friend_messenger: /\b(cq|cq-to-cq|message|messaging|messenger|friend|friends|contact|contacts|presence|call)\b/i,
  money_wallet_payments: /\b(wallet|crypto|payment|payments|stripe|qr|release|escrow|ledger|refund|money|price|pricing|margin)\b/i,
  ops_self_reporting_security: /\b(self-heal|self heal|self-report|self report|diagnostic|noc|security|antivirus|health|uptime|cron|reporting|regression)\b/i,
  coder_studio_builder: /\b(coder|studio|code|build|repo|repository|file|terminal|sandbox|deploy|deployment|pr|github)\b/i,
  camera_biometrics_voice: /\b(camera|biometric|biometrics|passkey|webauthn|voice|speak|speaking|interrupt|microphone|sensor)\b/i
};

export function isCapabilityPlanningRequest(text: string) {
  return Object.values(matchers).some(matcher => matcher.test(text));
}

export function capabilityPlanForText(text: string) {
  const matched = domains.filter(domain => matchers[domain.id]?.test(text));
  const selected = matched.length ? matched : domains;

  return {
    mode: 'agentic-readiness-v1',
    summary:
      'CubiQo V1 can understand, plan, draft, classify, and inspect. Real external actions move to V2 with API/provider integrations first, custom engineering only as fallback, approved tools, and audit logs.',
    matchedDomains: selected,
    globalV2Requirements: [
      'API/provider path first; custom engineering only when no suitable API or managed tool exists',
      'approval before every write/action',
      'server-side secret storage only',
      'per-tool feature flags',
      'audit log for submissions/posts/messages/account changes',
      'user-visible browser/session controls where browser automation is used',
      'no hidden automation'
    ]
  };
}
