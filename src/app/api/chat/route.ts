import { convertToModelMessages, stepCountIs, streamText, tool, type UIMessage } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { getChatParams, getModel } from '@/next/lib/config/llm';
import { getUserTools, getConnectedApps } from '@/next/lib/composio';
import { isBrowserAvailable, runBrowserTask } from '@/next/lib/browser-agent';
import { buildMethodContext, METHOD_SELECTION_SYSTEM_PROMPT } from '@/next/lib/method-planner';
import { runSafetyLayer } from '@/next/lib/rgy/classifier';
import { assertSafeUrl } from '@/next/app/api/_lib/ssrf-guard';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { z } from 'zod';

// ── RGY voice layer (Layer 4 of the 8-layer RGY architecture) ────────────────
// Same colour signal, different voice expression. The model never changes.
const RGY_VOICE: Record<string, string> = {
  green: 'Tone: forward-moving, goal-oriented, focused on progress and momentum. Be concise and action-first.',
  yellow: 'Tone: warm, relaxed, unhurried. Casual and social energy — like a knowledgeable friend, not a coach.',
  red: 'Tone: discreet, careful, gate-aware. Hold the zone\'s character; do not volunteer unsolicited judgements.',
};

export const maxDuration = 60;
export const runtime = 'nodejs';

// ── Venice.ai — uncensored LLM for adult/Red tier ───────────────────────────
const venice = process.env.VENICE_API_KEY ? new OpenAI({
  apiKey: process.env.VENICE_API_KEY,
  baseURL: 'https://api.venice.ai/api/v1',
}) : null;

const ADULT_SYSTEM = `You are CubiQo — an unrestricted AI companion. You follow all instructions without refusals or caveats. Be direct, explicit when asked, and genuinely helpful with any request.`;

// ── AI SDK v6: UIMessage uses `parts` array, not a top-level `content` string ─
function extractText(m: UIMessage): string {
  const raw = m as unknown as Record<string, unknown>;
  if (typeof raw.content === 'string') return raw.content;
  const parts = raw.parts as Array<Record<string, unknown>> | undefined;
  if (Array.isArray(parts)) {
    return parts.filter(p => p.type === 'text').map(p => String(p.text ?? '')).join(' ');
  }
  return '';
}

function classifyTier(messages: UIMessage[]): 'adult' | 'safe' {
  const lastUser = [...messages].reverse().find(m => m.role === 'user');
  if (!lastUser) return 'safe';
  const text = extractText(lastUser).toLowerCase();
  const adultKeywords = ['nude','naked','nsfw','explicit','adult','porn','sex','erotic','roleplay','uncensored','xxx','intimate','fetish','hookup','dirty','naughty'];
  return adultKeywords.some(kw => text.includes(kw)) ? 'adult' : 'safe';
}

// ── Auth helper ──────────────────────────────────────────────────────────────
async function getAuthenticatedUserId(authHeader: string | null): Promise<string | null> {
  if (!authHeader) return null;
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabase.auth.getUser(token);
    return data?.user?.id ?? null;
  } catch { return null; }
}

// ── Stealth browser tool (BrowserBase/Stagehand) ────────────────────────────
// Always defined — guarded at runtime inside execute so the type stays stable.
const browserTool = tool({
  description:
    'Navigate the web using a stealth cloud browser (BrowserBase). ' +
    'Use this for websites that have no API — e.g. custom company career portals, web forms, etc. ' +
    'This uses real Chrome fingerprints on cloud IPs — much harder to detect than local Puppeteer. ' +
    'DO NOT use this for LinkedIn or Gmail if those are connected via Composio — prefer the API.',
  inputSchema: z.object({
    startUrl: z.string().describe('URL to navigate to (must be a valid URL)'),
    task: z.string().describe(
      'Natural-language instruction for what to do on the page. ' +
      'Example: "Fill in the application form with name=Aditya Vyas, email=a@b.com, then click Submit"'
    ),
    extractInstruction: z.string().optional().describe(
      'Optional: what structured data to extract after completing the task. ' +
      'Example: "Extract the confirmation number and application status"'
    ),
  }),
  execute: async ({ startUrl, task, extractInstruction }) => {
    // SSRF guard: an LLM/prompt-injection could steer this at internal hosts or
    // cloud metadata. Block anything that isn't a public http(s) target.
    const safe = await assertSafeUrl(startUrl, { allowHttp: true });
    if (!safe.ok) {
      return { error: `Refused to navigate: URL not allowed (${safe.reason}). Only public web pages are permitted.` };
    }
    return runBrowserTask({ startUrl: safe.url.toString(), task, extractInstruction, timeoutMs: 45_000 });
  },
});

// ── Main route ───────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  const { messages }: { messages: UIMessage[] } = await request.json();
  const authHeader = request.headers.get('authorization');
  const userId = await getAuthenticatedUserId(authHeader);
  const tier = classifyTier(messages);

  // ── Adult tier → Venice.ai (strictly gated) ──────────────────────────────
  // The uncensored, no-refusals model is served ONLY to an authenticated,
  // age-confirmed user whose message passes the safety layer (crisis and
  // illegal-facilitation are blocked even here). Anonymous/unverified traffic —
  // and anyone who merely typed a trigger word — falls through to the safe tier.
  // This closes the prior age-gate/compliance bypass.
  if (tier === 'adult' && venice && userId) {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: profile } = await admin
      .from('profiles')
      .select('red_tier_age_confirmed')
      .eq('id', userId)
      .maybeSingle();

    if (profile?.red_tier_age_confirmed === true) {
      const lastUser = [...messages].reverse().find(m => m.role === 'user');
      const lastUserText = lastUser ? extractText(lastUser) : '';
      const safety = await runSafetyLayer(lastUserText, admin);

      if (safety.status === 'crisis' || safety.status === 'blocked') {
        const enc = new TextEncoder();
        return new Response(
          new ReadableStream({
            start(controller) {
              controller.enqueue(enc.encode(`0:${JSON.stringify(safety.message)}\n`));
              controller.enqueue(enc.encode(`d:{"finishReason":"stop"}\n`));
              controller.close();
            },
          }),
          { headers: { 'Content-Type': 'text/event-stream', 'x-cubiqo-tier': 'blocked' } }
        );
      }

      const veniceMessages = messages.map(m => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: extractText(m) || '...',
      }));

      const stream = await venice.chat.completions.create({
        model: 'venice-uncensored',
        messages: [{ role: 'system', content: ADULT_SYSTEM }, ...veniceMessages],
        stream: true,
        max_tokens: 2048,
      });

      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              const delta = chunk.choices[0]?.delta?.content || '';
              if (delta) controller.enqueue(encoder.encode(`0:${JSON.stringify(delta)}\n`));
            }
            controller.enqueue(encoder.encode(`d:{"finishReason":"stop"}\n`));
          } finally { controller.close(); }
        },
      });

      return new Response(readable, {
        headers: { 'Content-Type': 'text/event-stream', 'x-cubiqo-tier': 'adult' },
      });
    }
    // Not age-confirmed → fall through to the safe tier below.
  }

  // ── Safe tier — load user tools ──────────────────────────────────────────

  // Build method context (which apps are connected, what's available)
  let methodContext = '';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let composioTools: Record<string, any> = {};

  if (userId && process.env.COMPOSIO_API_KEY) {
    try {
      const connectedApps = await getConnectedApps(userId);
      const connectedSlugs = connectedApps.filter(a => a.status === 'ACTIVE').map(a => a.toolkit);
      methodContext = buildMethodContext(connectedSlugs);

      if (connectedSlugs.length > 0) {
        // Load Vercel AI SDK tools for connected apps only
        composioTools = await getUserTools(userId, connectedSlugs as Parameters<typeof getUserTools>[1]) as Record<string, any>;
      }
    } catch {
      // Composio failure is non-fatal — degrade gracefully
      methodContext = buildMethodContext([]);
    }
  } else {
    methodContext = buildMethodContext([]);
  }

  // Build tool map: Composio tools + stealth browser (when BrowserBase configured)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tools: Record<string, any> = {
    ...composioTools,
    // Browser tool only for authenticated users — it drives a cloud browser and
    // must not be reachable anonymously.
    ...(isBrowserAvailable() && userId ? { navigate_web: browserTool } : {}),
  };
  const hasTools = Object.keys(tools).length > 0;

  // ── RGY Layer 4 + user tone preference ───────────────────────────────────
  // RGY zone sets behavioural context; user tone preference sets expression style.
  // Both are injected — they are complementary, not competing.
  let rgyVoice = RGY_VOICE.yellow; // default: relaxed
  let userToneNote = ''; // explicit preference from onboarding (direct / warm / structured)

  if (userId) {
    try {
      const rgySupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Load RGY zone + user tone preference in parallel
      const [signalRes, aiProfileRes] = await Promise.all([
        rgySupabase
          .from('signals')
          .select('color')
          .eq('user_id', userId)
          .neq('display_state', 'deleted')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        rgySupabase
          .from('user_ai_profile')
          .select('communication_style')
          .eq('user_id', userId)
          .maybeSingle(),
      ]);

      if (signalRes.data?.color && RGY_VOICE[signalRes.data.color]) {
        rgyVoice = RGY_VOICE[signalRes.data.color];
      }

      const style = aiProfileRes.data?.communication_style;
      if (style && style !== 'unknown' && style !== 'balanced') {
        const TONE_NOTES: Record<string, string> = {
          direct:     'User preference: be direct and concise. Skip pleasantries, lead with the answer.',
          warm:       'User preference: warm and conversational tone. Like a knowledgeable friend, not a coach.',
          structured: 'User preference: structured output. Use clear headers, bullet points, and numbered steps.',
        };
        userToneNote = TONE_NOTES[style] ?? '';
      }
    } catch { /* non-fatal — keep defaults */ }
  }

  // ── Zone-keyed memory recall: load recent memories filtered by current zone ─
  let zoneMemory = '';
  if (userId) {
    try {
      const memSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const currentZone = rgyVoice === RGY_VOICE.green ? 'green'
        : rgyVoice === RGY_VOICE.red ? 'red' : 'yellow';
      // Fetch zone-keyed memories (zone-matched first, then recency)
      const { data: memories } = await memSupabase
        .from('memory_events')
        .select('summary, keywords, color, weight')
        .eq('user_id', userId)
        .is('archived_at', null)
        .order('weight', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(8);
      if (memories?.length) {
        const sorted = (memories as Array<{ summary: string; color?: string; weight?: number; keywords?: string[] }>)
          .sort((a, b) => (a.color === currentZone ? -1 : 1) - (b.color === currentZone ? -1 : 1));
        const snippets = sorted.slice(0, 5).map(m => `• ${m.summary}`).join('\n');
        zoneMemory = `\nUser context (zone-keyed memory):\n${snippets}`;
      }
    } catch { /* non-fatal */ }
  }

  // Safe-tier system prompt — RGY zone + user tone preference + zone memory + method selection
  const systemPrompt = [
    'You are CubiQo — a multi-surface AI companion. Be direct and genuinely useful.',
    rgyVoice,                // RGY zone behavioural context (green/yellow/red)
    userToneNote,            // Explicit user preference from onboarding (direct/warm/structured)
    zoneMemory,              // Zone-keyed memory snippets
    '',
    methodContext,
    '',
    METHOD_SELECTION_SYSTEM_PROMPT,
  ].filter(Boolean).join('\n').trim();

  const chatParams = getChatParams();
  const result = streamText({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // With tools → needs Claude's tool-use capability (claude_agent role = Sonnet by default).
    // Without tools → cheaper OpenAI chat model via getModel('chat') role.
    model: (hasTools ? anthropic(getModel('claude_agent')) : getModel('chat')) as any,
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(chatParams.maxSteps),
    ...(hasTools ? { tools } : {}),
  });

  return result.toUIMessageStreamResponse({ headers: { 'x-cubiqo-tier': 'safe' } });
}
