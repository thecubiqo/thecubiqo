import { NextRequest, NextResponse } from "next/server";

import { getBearerToken, getSupabaseAdmin } from "../../_lib/supabase-admin";

type VisionSource = "upload" | "camera" | "screenshot" | "browser";

type VisionBody = {
  imageBase64?: string;
  image?: string;
  image_url?: string;
  imageUrl?: string;
  mime_type?: string;
  mimeType?: string;
  source?: VisionSource;
  permission?: "granted" | "denied" | "pending";
  prompt?: string;
};

type AuthedContext = {
  userId: string | null;
  supabase: ReturnType<typeof getSupabaseAdmin>;
};

const STRUCTURED_VISION_PROMPT = `Analyze this visual input for CubiQo.
Return JSON only with:
{
  "summary": "one sentence",
  "visible_text": ["important visible text"],
  "detected_domain": "ecommerce | career | learning | finance | health | marketing | general",
  "possible_goal": "what the user may want help with",
  "confidence": 0.0,
  "needs_user_confirmation": true,
  "safety_notes": []
}
Be conservative. If the image is unclear, lower confidence and ask for confirmation.`;

function normalizeImageUrl(body: VisionBody) {
  const url = body.image_url ?? body.imageUrl;
  if (url?.trim()) return url.trim();

  const raw = (body.imageBase64 ?? body.image)?.trim();
  if (!raw) return null;
  if (raw.startsWith("data:")) return raw;

  const mimeType = body.mime_type ?? body.mimeType ?? "image/jpeg";
  return `data:${mimeType};base64,${raw}`;
}

async function getAuthedContext(request: NextRequest): Promise<AuthedContext> {
  const supabase = getSupabaseAdmin();
  const token = getBearerToken(request);
  if (!supabase || !token) return { supabase, userId: null };

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return { supabase, userId: null };

  return { supabase, userId: data.user.id };
}

async function persistCameraPermission(ctx: AuthedContext, status: "granted" | "denied" | "pending") {
  if (!ctx.supabase || !ctx.userId) return;

  const update: Record<string, unknown> = {
    user_id: ctx.userId,
    camera: status,
    updated_at: new Date().toISOString(),
  };

  if (status === "granted") {
    update.camera_granted_at = new Date().toISOString();
  }

  await ctx.supabase.from("user_permissions").upsert(update, { onConflict: "user_id" });
}

async function assertVisionPermission(ctx: AuthedContext, source: VisionSource, bodyPermission?: string) {
  if (source !== "camera" && source !== "screenshot" && source !== "browser") {
    return { ok: true as const };
  }

  if (bodyPermission === "granted") {
    await persistCameraPermission(ctx, "granted");
    return { ok: true as const };
  }

  if (!ctx.supabase || !ctx.userId) {
    return {
      ok: false as const,
      status: 403,
      error: "Camera or screenshot analysis needs explicit permission before processing.",
    };
  }

  const { data, error } = await ctx.supabase
    .from("user_permissions")
    .select("camera")
    .eq("user_id", ctx.userId)
    .maybeSingle();

  if (error) {
    return { ok: false as const, status: 500, error: error.message };
  }

  if (data?.camera !== "granted") {
    return {
      ok: false as const,
      status: 403,
      error: "Camera or screenshot analysis is not enabled for this user.",
    };
  }

  return { ok: true as const };
}

function coerceVisionJson(text: string) {
  try {
    const parsed = JSON.parse(text);
    return {
      summary: String(parsed.summary ?? "Visual input received."),
      visible_text: Array.isArray(parsed.visible_text) ? parsed.visible_text.map(String).slice(0, 20) : [],
      detected_domain: String(parsed.detected_domain ?? "general"),
      possible_goal: String(parsed.possible_goal ?? "needs confirmation"),
      confidence: Number.isFinite(Number(parsed.confidence)) ? Number(parsed.confidence) : 0.45,
      needs_user_confirmation: Boolean(parsed.needs_user_confirmation ?? true),
      safety_notes: Array.isArray(parsed.safety_notes) ? parsed.safety_notes.map(String).slice(0, 10) : [],
    };
  } catch {
    return {
      summary: text.slice(0, 500) || "Visual input received.",
      visible_text: [],
      detected_domain: "general",
      possible_goal: "needs confirmation",
      confidence: 0.35,
      needs_user_confirmation: true,
      safety_notes: [],
    };
  }
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as VisionBody;
  const source = body.source ?? "upload";
  const imageUrl = normalizeImageUrl(body);

  if (!imageUrl) {
    return NextResponse.json({ error: "Missing image or image_url" }, { status: 400 });
  }

  if (!imageUrl.startsWith("data:image/") && !/^https?:\/\//i.test(imageUrl)) {
    return NextResponse.json({ error: "imageBase64 must be a data:image URL or image_url must be http(s)" }, { status: 400 });
  }

  if (imageUrl.startsWith("data:image/") && imageUrl.length > 5_600_000) {
    return NextResponse.json({ error: "Image is too large. Maximum is roughly 4MB." }, { status: 413 });
  }

  const ctx = await getAuthedContext(request);
  const permission = await assertVisionPermission(ctx, source, body.permission);
  if (!permission.ok) {
    return NextResponse.json({ error: permission.error }, { status: permission.status });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      description: "[Visual context unavailable]",
      structured_context: {
        summary: "Visual context unavailable.",
        visible_text: [],
        detected_domain: "general",
        possible_goal: "needs confirmation",
        confidence: 0,
        needs_user_confirmation: true,
        safety_notes: ["OPENAI_API_KEY is not configured"],
      },
      confidence: 0,
      error: "OPENAI_API_KEY is not configured",
    });
  }

  const startedAt = Date.now();
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_VISION_MODEL ?? "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: STRUCTURED_VISION_PROMPT,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: body.prompt || "Describe the visible context and infer what the user might need help with.",
            },
            {
              type: "image_url",
              image_url: { url: imageUrl, detail: "high" },
            },
          ],
        },
      ],
    }),
  });

  const result = await response.json().catch(() => null);
  if (!response.ok) {
    return NextResponse.json({
      description: "[Visual context unavailable]",
      structured_context: {
        summary: "Visual context unavailable.",
        visible_text: [],
        detected_domain: "general",
        possible_goal: "needs confirmation",
        confidence: 0,
        needs_user_confirmation: true,
        safety_notes: [result?.error?.message ?? "Vision analysis failed"],
      },
      confidence: 0,
      error: result?.error?.message ?? "Vision analysis failed",
    });
  }

  const content = result?.choices?.[0]?.message?.content ?? "{}";
  const visualContext = coerceVisionJson(content);
  await ctx.supabase?.from("api_usage_events").insert({
    user_id: ctx.userId,
    route: "/api/perception/vision",
    provider: "openai",
    model: process.env.OPENAI_VISION_MODEL ?? "gpt-4o",
    units_used: 1,
    unit_type: "images",
    tokens_input: result?.usage?.prompt_tokens ?? null,
    tokens_output: result?.usage?.completion_tokens ?? null,
    latency_ms: Date.now() - startedAt,
    metadata: { source },
  });

  return NextResponse.json({
    description: [
      visualContext.summary,
      visualContext.visible_text.length ? `Visible text: ${visualContext.visible_text.join(" | ")}` : "",
      visualContext.possible_goal ? `Possible goal: ${visualContext.possible_goal}` : "",
    ].filter(Boolean).join(" "),
    modality: "image",
    source,
    structured_context: visualContext,
    confidence: visualContext.confidence,
    latency_ms: Date.now() - startedAt,
    usage: result?.usage ?? null,
  });
}
