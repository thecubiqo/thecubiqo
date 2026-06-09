import { NextRequest, NextResponse } from "next/server";

import { getTrackingConsent } from "@/next/lib/tracking/consent";
import { getBearerToken, getSupabaseAdmin } from "../../_lib/supabase-admin";

export const runtime = "nodejs";

async function getUserId(request: NextRequest, supabase: any) {
  const token = getBearerToken(request);
  if (!token) return null;
  const { data } = await supabase.auth.getUser(token);
  return data?.user?.id || null;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ tracking_id: string }> }) {
  const supabase = getSupabaseAdmin();
  const fallback = new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://cubiqo.ai");
  if (!supabase) return NextResponse.redirect(fallback, 302);

  const { tracking_id: trackingId } = await params;
  const { data: rec } = await supabase
    .from("recommendation_events")
    .select("id,user_id,session_id,affiliate_link_id,tracked_url,merchant_url")
    .eq("id", trackingId)
    .maybeSingle();

  const destination = rec?.merchant_url || rec?.tracked_url;
  if (!rec || !destination) return NextResponse.redirect(fallback, 302);

  const userId = await getUserId(request, supabase);
  const cookieId = request.cookies.get("cubiqo_aff")?.value || crypto.randomUUID();

  await supabase.from("affiliate_clicks").insert({
    recommendation_event_id: rec.id,
    affiliate_link_id: rec.affiliate_link_id,
    user_id: userId || rec.user_id || null,
    session_id: rec.session_id || request.cookies.get("cubiqo_sid")?.value || null,
    cookie_id: cookieId,
    metadata: {
      user_agent: request.headers.get("user-agent") || null,
      referrer: request.headers.get("referer") || null,
    },
  });

  const response = NextResponse.redirect(destination, 302);
  const trackingConsent = await getTrackingConsent({ supabase, userId: userId || rec.user_id || null, request });
  if (trackingConsent) {
    response.cookies.set("cubiqo_aff", trackingId, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    try {
      const destHostname = new URL(destination).hostname.replace(/^www\./, "");
      response.cookies.set(
        "cubiqo_ext_aff",
        JSON.stringify({
          eventId: trackingId,
          merchant: destHostname,
          expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
        }),
        {
          httpOnly: false,
          sameSite: "lax",
          secure: true,
          maxAge: 30 * 24 * 60 * 60,
          path: "/",
        },
      );
    } catch {
      // If the destination URL is malformed, the main redirect still works.
    }
  }
  return response;
}
