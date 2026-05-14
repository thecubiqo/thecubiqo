import { NextRequest, NextResponse } from "next/server";

import { requireAdminRequest } from "../../../_lib/supabase-admin";

export const runtime = "nodejs";

type StatementRow = {
  external_conversion_id?: string;
  conversion_id?: string;
  id?: string;
  amount?: number;
  currency?: string;
};

function parseStatement(statement: unknown): StatementRow[] {
  if (Array.isArray(statement)) return statement as StatementRow[];
  if (typeof statement !== "string") return [];
  const lines = statement.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    return Object.fromEntries(headers.map((h, i) => [h, values[i]])) as StatementRow;
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminRequest(request);
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => ({}));
  const network = String(body.network || "").trim();
  if (!network) return NextResponse.json({ error: "network required" }, { status: 400 });

  const rows = parseStatement(body.statement);
  const { data: batch, error: batchError } = await auth.supabase
    .from("affiliate_payout_batches")
    .insert({
      network,
      payout_reference: body.payout_reference || body.payoutReference || null,
      payout_amount: Number(body.payout_amount ?? body.payoutAmount ?? 0),
      payout_currency: body.payout_currency || body.currency || "GBP",
      payout_status: "received",
      payout_method: body.payout_method || null,
      paid_at: body.paid_at || new Date().toISOString(),
      raw_statement: body.statement || {},
    })
    .select("id")
    .single();

  if (batchError) return NextResponse.json({ error: batchError.message }, { status: 500 });

  let matched = 0;
  const unmatched: StatementRow[] = [];
  for (const row of rows) {
    const externalId = row.external_conversion_id || row.conversion_id || row.id;
    if (!externalId) {
      unmatched.push(row);
      continue;
    }
    const { data: conversion } = await auth.supabase
      .from("affiliate_conversions")
      .select("id")
      .eq("network", network)
      .eq("external_conversion_id", externalId)
      .maybeSingle();

    if (!conversion?.id) {
      unmatched.push(row);
      continue;
    }

    await auth.supabase
      .from("affiliate_conversions")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", conversion.id);

    await auth.supabase.from("affiliate_payout_items").insert({
      payout_batch_id: batch.id,
      affiliate_conversion_id: conversion.id,
      amount: Number(row.amount || 0),
      currency: row.currency || body.payout_currency || "GBP",
      raw_item: row,
    });
    matched += 1;
  }

  if (!unmatched.length) {
    await auth.supabase
      .from("affiliate_payout_batches")
      .update({ payout_status: "reconciled" })
      .eq("id", batch.id);
  }

  return NextResponse.json({ ok: true, batch_id: batch.id, matched, unmatched: unmatched.length, unmatched_rows: unmatched });
}
