import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { checkOutputSafety } from "@/next/lib/safety/output-safety";
import { getBearerToken, getSupabaseAdmin } from "../../_lib/supabase-admin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const input = String(body.input || body.userInput || "");
  const output = String(body.output || body.text || "");
  const result = checkOutputSafety(output);

  if (result.flagged) {
    const supabase = getSupabaseAdmin();
    let userId: string | null = null;
    const token = getBearerToken(request);
    if (supabase && token) {
      const { data } = await supabase.auth.getUser(token);
      userId = data?.user?.id || null;
    }

    await supabase?.from("output_safety_log").insert({
      user_id: userId,
      input_hash: input ? createHash("sha256").update(input).digest("hex") : null,
      output_flagged: result.reason || "flagged",
      action_taken: "replaced",
      metadata: { reason: result.reason },
    });
  }

  return NextResponse.json(result);
}
