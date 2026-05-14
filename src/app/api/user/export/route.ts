import { NextRequest } from "next/server";

import { createZip } from "@/next/lib/export/simple-zip";
import { requireApiUser } from "../../_lib/supabase-admin";

export const runtime = "nodejs";

const TABLES = [
  "profiles",
  "signals",
  "memory_events",
  "user_ai_profile",
  "user_permissions",
  "conversation_events",
  "journal_entries",
  "recommendation_events",
  "affiliate_clicks",
  "saved_recommendations",
  "interventions_log",
  "api_usage_events",
];

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if ("error" in auth) return auth.error;

  const files: Array<{ name: string; content: string }> = [];
  for (const table of TABLES) {
    const userColumn = table === "profiles" ? "id" : "user_id";
    const { data, error } = await auth.supabase
      .from(table)
      .select("*")
      .eq(userColumn, auth.user.id)
      .limit(5000);

    files.push({
      name: `${table}.json`,
      content: JSON.stringify({ table, error: error?.message || null, data: data || [] }, null, 2),
    });
  }

  files.push({
    name: "export_metadata.json",
    content: JSON.stringify({
      exported_at: new Date().toISOString(),
      user_id: auth.user.id,
      email: auth.user.email || null,
    }, null, 2),
  });

  const zip = createZip(files);
  return new Response(zip, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="cubiqo-export-${auth.user.id}.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
