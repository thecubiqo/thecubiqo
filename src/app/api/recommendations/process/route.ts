import { NextRequest, NextResponse } from "next/server";

import { postProcessResponse } from "@/next/lib/commerce/recommendation-postprocessor";
import { getBearerToken, getSupabaseAdmin } from "../../_lib/supabase-admin";
import { isPro } from "@/next/lib/billing/gates";

export const runtime = "nodejs";

async function getUserId(request: NextRequest, supabase: any) {
  const token = getBearerToken(request);
  if (!token) return null;
  const { data } = await supabase.auth.getUser(token);
  return data?.user?.id || null;
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase admin client is not configured" }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const responseText = String(body.responseText || body.text || "").slice(0, 8000);
  if (!responseText) return NextResponse.json({ enrichedText: "", cards: [] });

  const userId = await getUserId(request, supabase);
  if (!userId) {
    return NextResponse.json({ error: "Auth required" }, { status: 401 });
  }
  if (!(await isPro(userId))) {
    return NextResponse.json({ enrichedText: responseText, cards: [], code: "PRO_REQUIRED" }, { status: 402 });
  }

  const result = await postProcessResponse(
    responseText,
    userId,
    body.sessionId || body.session_id || null,
    body.signalId || body.signal_id || null,
    supabase,
  );

  return NextResponse.json(result);
}
