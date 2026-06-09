import type { LocalSession } from "@/next/types/cubiqo";

export function hasTrackingConsent(session: LocalSession | null, userPermissions: any | null): boolean {
  if (userPermissions) return userPermissions.tracking === "granted";
  if (session) return session.permissions.tracking === "granted";
  return false;
}

export async function getTrackingConsent(params: {
  supabase: any;
  userId: string | null;
  request: Request;
}) {
  if (params.userId) {
    const { data } = await params.supabase
      .from("user_permissions")
      .select("tracking")
      .eq("user_id", params.userId)
      .maybeSingle();
    return hasTrackingConsent(null, data);
  }

  const cookieHeader = params.request.headers.get("cookie") || "";
  return /(?:^|;\s*)cubiqo_tracking_consent=granted(?:;|$)/.test(cookieHeader);
}
