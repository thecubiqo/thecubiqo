import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getBearerToken, getSupabaseAdmin } from "../../_lib/supabase-admin";

type OnboardingAnswer = {
  id?: string;
  question?: string;
  answer: string;
};

type OnboardingBody = {
  message?: string;
  step?: 0 | 1 | 2 | 3;
  accumulated?: {
    goal?: string;
    product_type?: string;
    blocker?: string;
  };
  answers?: OnboardingAnswer[] | string[];
  messages?: Array<{ role: string; content: string }>;
  current_answer?: string;
  currentAnswer?: string;
  complete?: boolean;
};

const onboardingBodySchema = z.object({
  message: z.string().max(2000).optional(),
  step: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]).optional(),
  accumulated: z.object({
    goal: z.string().max(2000).optional(),
    product_type: z.string().max(2000).optional(),
    blocker: z.string().max(2000).optional(),
  }).optional(),
  answers: z.array(z.union([
    z.string().max(2000),
    z.object({
      id: z.string().max(120).optional(),
      question: z.string().max(500).optional(),
      answer: z.string().max(2000),
    }),
  ])).max(3).optional(),
  messages: z.array(z.object({
    role: z.string().max(40),
    content: z.string().max(2000),
  })).max(10).optional(),
  current_answer: z.string().max(2000).optional(),
  currentAnswer: z.string().max(2000).optional(),
  complete: z.boolean().optional(),
});

const QUESTIONS = [
  "What is your main focus right now?",
  "What kind of result are you trying to create from that?",
  "What is the biggest thing blocking you?",
];

const DOMAIN_TERMS: Array<{ domain: string; terms: string[] }> = [
  { domain: "ecommerce", terms: ["shopify", "store", "printify", "etsy", "product", "brand", "pod", "dropship"] },
  { domain: "career", terms: ["job", "career", "cv", "resume", "interview", "hiring", "role"] },
  { domain: "marketing", terms: ["marketing", "content", "social", "ads", "seo", "launch", "audience"] },
  { domain: "learning", terms: ["learn", "course", "study", "skill", "certification"] },
  { domain: "finance", terms: ["money", "income", "revenue", "profit", "budget", "invest"] },
  { domain: "health", terms: ["health", "fitness", "weight", "sleep", "stress"] },
];

function trimForDb(value: string, max = 800) {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

function normalizeAnswers(body: OnboardingBody): string[] {
  const answers: string[] = [];

  if (body.accumulated) {
    if (body.accumulated.goal?.trim()) answers.push(trimForDb(body.accumulated.goal));
    if (body.accumulated.product_type?.trim()) answers.push(trimForDb(body.accumulated.product_type));
    if (body.accumulated.blocker?.trim()) answers.push(trimForDb(body.accumulated.blocker));
  }

  if (Array.isArray(body.answers)) {
    for (const item of body.answers) {
      const answer = typeof item === "string" ? item : item?.answer;
      if (answer && answer.trim()) answers.push(trimForDb(answer));
    }
  }

  if (Array.isArray(body.messages)) {
    for (const message of body.messages) {
      if (message.role === "user" && message.content?.trim()) {
        answers.push(trimForDb(message.content));
      }
    }
  }

  const current = body.current_answer ?? body.currentAnswer;
  if (current?.trim()) answers.push(trimForDb(current));

  if (body.message?.trim()) answers.push(trimForDb(body.message));

  return Array.from(new Set(answers)).slice(0, 3);
}

function nextOnboardingReply(answers: string[]) {
  if (answers.length === 0) {
    return {
      reply: QUESTIONS[0],
      nextStep: 1 as const,
    };
  }

  if (answers.length === 1) {
    return {
      reply: "Tell me a little more - what stage are you at with that?",
      nextStep: 2 as const,
    };
  }

  return {
    reply: QUESTIONS[2],
    nextStep: 3 as const,
  };
}

function inferDomain(answers: string[]) {
  const text = answers.join(" ").toLowerCase();
  for (const candidate of DOMAIN_TERMS) {
    if (candidate.terms.some((term) => text.includes(term))) {
      return candidate.domain;
    }
  }
  return "general";
}

function extractKeywords(answers: string[]) {
  const stop = new Set([
    "about",
    "after",
    "again",
    "being",
    "biggest",
    "block",
    "blocking",
    "create",
    "focus",
    "from",
    "have",
    "into",
    "main",
    "need",
    "right",
    "result",
    "that",
    "thing",
    "this",
    "trying",
    "want",
    "with",
  ]);

  const counts = new Map<string, number>();
  for (const word of answers.join(" ").toLowerCase().match(/[a-z0-9][a-z0-9-]{2,}/g) ?? []) {
    if (stop.has(word)) continue;
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 10)
    .map(([word]) => word);
}

async function getAuthedUser(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { supabase: null, user: null, error: "Supabase admin client is not configured" };
  }

  const token = getBearerToken(request);
  if (!token) {
    return { supabase, user: null, error: "Missing bearer token" };
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return { supabase, user: null, error: "Invalid bearer token" };
  }

  return { supabase, user: data.user, error: null };
}

export async function POST(request: NextRequest) {
  const { supabase, user, error: authError } = await getAuthedUser(request);
  if (!supabase) {
    return NextResponse.json({ error: authError }, { status: 500 });
  }
  if (!user) {
    return NextResponse.json({ error: authError }, { status: 401 });
  }

  const parsed = onboardingBodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid onboarding payload", issues: parsed.error.flatten() }, { status: 400 });
  }
  const body = parsed.data as OnboardingBody;
  const answers = normalizeAnswers(body);

  if (answers.length < 3 && !body.complete) {
    const next = nextOnboardingReply(answers);
    return NextResponse.json({
      reply: next.reply,
      nextStep: next.nextStep,
      complete: false,
      done: false,
      step: next.nextStep,
      remaining: 3 - answers.length,
      question: next.reply,
      answers,
    });
  }

  const [focus = "", desiredResult = "", blocker = ""] = answers;
  const primaryGoal = trimForDb(focus, 180) || "Get clearer on the next move";
  const goalDomain = inferDomain(answers);
  const keywords = extractKeywords(answers);
  const onboardingSummary = trimForDb(
    `Main focus: ${primaryGoal}. Desired result: ${desiredResult || "not stated"}. Biggest blocker: ${blocker || "not stated"}.`,
    800,
  );

  const profileUpdate = {
    display_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
    primary_goal: primaryGoal,
    goal_domain: goalDomain,
    onboarding_done: true,
    onboarding_summary: onboardingSummary,
    last_seen_at: new Date().toISOString(),
  };

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({ id: user.id, ...profileUpdate }, { onConflict: "id" });

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const { error: aiProfileError } = await supabase.from("user_ai_profile").upsert(
    {
      user_id: user.id,
      primary_drive: desiredResult || primaryGoal,
      what_blocks: blocker || null,
      current_phase: goalDomain,
      open_loops: [primaryGoal, blocker].filter(Boolean),
      session_count: 1,
      last_updated: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (aiProfileError) {
    return NextResponse.json({ error: aiProfileError.message }, { status: 500 });
  }

  const { data: memoryEvent, error: memoryError } = await supabase
    .from("memory_events")
    .insert({
      user_id: user.id,
      event_type: "goal_update",
      summary: onboardingSummary,
      keywords,
      weight: 3,
      signal_ids: null,
    })
    .select("id")
    .single();

  if (memoryError) {
    return NextResponse.json({ error: memoryError.message }, { status: 500 });
  }

  return NextResponse.json({
    reply: `Got it. I will keep ${primaryGoal} as the main thread and use that context from here.`,
    nextStep: 3,
    complete: true,
    done: true,
    next: "normal_agent",
    profile: {
      primary_goal: primaryGoal,
      goal_domain: goalDomain,
      onboarding_summary: onboardingSummary,
    },
    memory_event_id: memoryEvent?.id ?? null,
    message: `Got it. I will keep ${primaryGoal} as the main thread and use that context from here.`,
  });
}
