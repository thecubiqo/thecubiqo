import { NextRequest, NextResponse } from "next/server";

import { requireApiUser } from "../../_lib/supabase-admin";

export const runtime = "nodejs";

export async function DELETE(request: NextRequest) {
  const auth = await requireApiUser(request);
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => ({}));
  if (body.confirm !== "DELETE") {
    return NextResponse.json({ error: "Confirmation required. Send { confirm: 'DELETE' }." }, { status: 400 });
  }

  const userId = auth.user.id;

  await auth.supabase.from("profiles").delete().eq("id", userId);
  const { error } = await auth.supabase.auth.admin.deleteUser(userId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const response = NextResponse.json({
    ok: true,
    deleted: true,
    localStorageKeysToClear: ["cubiqo_session", "cubiqo_visit_memory_v1", "cubiqo_audio_unlocked"],
  });
  response.cookies.delete("cubiqo_aff");
  response.cookies.delete("cubiqo_sid");
  return response;
}
