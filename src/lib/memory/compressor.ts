import type { SupabaseClient } from "@supabase/supabase-js";

export type CompressInput = {
  conversation: Array<{ role: string; content: string }>;
  signalIds?: string[];
};

export type CompressOutput = {
  summary: string;
  keywords: string[];
  eventType: "session_summary" | "commitment" | "episode";
  weight: 1 | 2 | 3;
};

export async function compressSession(input: CompressInput): Promise<CompressOutput> {
  const text = input.conversation
    .map((item) => `${item.role}: ${item.content}`)
    .join("\n")
    .slice(0, 8000);

  if (!process.env.OPENAI_API_KEY) {
    return fallbackCompress(text);
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_UTILITY_MODEL || "gpt-4o-mini",
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "Compress a CubiQo session into JSON: summary max 300 chars, keywords array max 8, eventType session_summary|commitment|episode, weight 1|2|3.",
          },
          { role: "user", content: text },
        ],
      }),
    });
    const data = await res.json().catch(() => null);
    const parsed = JSON.parse(data?.choices?.[0]?.message?.content || "{}");
    const weight = Number(parsed.weight);
    return {
      summary: String(parsed.summary || "").slice(0, 300) || fallbackCompress(text).summary,
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords.map(String).slice(0, 8) : [],
      eventType: ["commitment", "episode"].includes(parsed.eventType) ? parsed.eventType : "session_summary",
      weight: weight === 2 || weight === 3 ? weight : 1,
    };
  } catch {
    return fallbackCompress(text);
  }
}

export async function pruneMemory(supabase: SupabaseClient, userId: string): Promise<void> {
  const { data } = await supabase
    .from("memory_events")
    .select("id,weight,created_at")
    .eq("user_id", userId)
    .is("archived_at", null)
    .order("weight", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(200);

  const routine = (data || []).filter((item: any) => item.weight === 1);
  if ((data || []).length <= 50 || routine.length <= 10) return;

  await supabase
    .from("memory_events")
    .update({ archived_at: new Date().toISOString() })
    .in("id", routine.slice(0, Math.min(10, routine.length - 40)).map((item: any) => item.id));
}

function fallbackCompress(text: string): CompressOutput {
  const words = text.toLowerCase().match(/[a-z0-9][a-z0-9-]{2,}/g) || [];
  const keywords = Array.from(new Set(words.filter((word) => !["the", "and", "that", "this", "with", "from"].includes(word)))).slice(0, 8);
  return {
    summary: text.replace(/\s+/g, " ").slice(0, 300) || "Session completed.",
    keywords,
    eventType: /\b(i will|i'll|by friday|by tomorrow|deadline)\b/i.test(text) ? "commitment" : "session_summary",
    weight: /\b(first sale|launch|decided|breakthrough)\b/i.test(text) ? 3 : 1,
  };
}
