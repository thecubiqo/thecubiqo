/**
 * POST /api/agent/read-pdf
 * Reads a PDF via Claude's native document understanding — no extra npm lib needed.
 *
 * Accepts:
 *   { url: string, task?: string }          — fetch PDF from URL
 *   { base64: string, task?: string }       — pre-encoded PDF bytes
 *
 * Returns:
 *   { text: string, summary: string, pageCount?: number, citations?: string[] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';
import { requireApiUser } from '../../_lib/supabase-admin';
import { getModel } from '@/next/lib/config/llm';
import { assertSafeUrl } from '../../_lib/ssrf-guard';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Use the raw Anthropic SDK — AI SDK v6 does not yet expose document blocks in generateText
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const bodySchema = z.object({
  url: z.string().url().optional(),
  base64: z.string().optional(),
  mimeType: z.string().optional().default('application/pdf'),
  task: z.string().max(400).optional().default(
    'Extract all text content. Then provide a concise summary of the document and list any key citations or references.'
  ),
  maxPages: z.number().int().min(1).max(50).optional().default(20),
});

export async function POST(request: NextRequest) {
  // Require auth — this endpoint fetches caller-supplied URLs and spends LLM
  // tokens, so it must not be open to anonymous traffic (SSRF + cost abuse).
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;
  const userId = auth.user.id;
  const supabase = auth.supabase;

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', issues: parsed.error.flatten() }, { status: 400 });
  }

  const { url, base64, mimeType, task } = parsed.data;

  if (!url && !base64) {
    return NextResponse.json({ error: 'Provide url or base64' }, { status: 400 });
  }

  // ── Fetch PDF bytes ─────────────────────────────────────────────────────────
  let pdfBase64: string;
  let contentType = mimeType;

  if (base64) {
    pdfBase64 = base64;
  } else {
    // SSRF guard — only public https targets; reject internal/metadata/private IPs.
    const safe = await assertSafeUrl(url!, { allowHttp: false });
    if (!safe.ok) {
      return NextResponse.json({ error: `URL not allowed (${safe.reason})` }, { status: 400 });
    }

    let fetchResp: Response;
    try {
      fetchResp = await fetch(safe.url.toString(), { signal: AbortSignal.timeout(20_000) });
      if (!fetchResp.ok) {
        return NextResponse.json({ error: `PDF fetch failed: ${fetchResp.status}` }, { status: 502 });
      }
    } catch (err) {
      return NextResponse.json({ error: `PDF fetch error: ${err instanceof Error ? err.message : String(err)}` }, { status: 502 });
    }

    // Reject oversize downloads up-front via Content-Length when the server sends it.
    const declaredLen = Number(fetchResp.headers.get('content-length') || '0');
    if (declaredLen > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'PDF too large (20 MB max)' }, { status: 413 });
    }

    contentType = fetchResp.headers.get('content-type') || mimeType;
    const arrayBuffer = await fetchResp.arrayBuffer();

    // Hard cap after read (covers chunked responses with no Content-Length).
    if (arrayBuffer.byteLength > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'PDF too large (20 MB max)' }, { status: 413 });
    }
    pdfBase64 = Buffer.from(arrayBuffer).toString('base64');
  }

  // ── Send to Claude as a document block ────────────────────────────────────
  let response: any;
  try {
    response = await anthropic.messages.create({
      model: getModel('claude_agent'), // Sonnet for document reasoning — override via CLAUDE_AGENT_MODEL
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: pdfBase64,
              },
            },
            {
              type: 'text',
              text: task,
            },
          ],
        },
      ],
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Claude PDF processing failed: ${err?.message || String(err)}` },
      { status: 500 }
    );
  }

  const raw = response.content?.[0]?.text ?? '';

  // Extract summary (first paragraph) and citations (lines with [n] or Author, Year patterns)
  const lines = raw.split('\n').filter(Boolean);
  const summaryLines: string[] = [];
  const citations: string[] = [];

  for (const line of lines) {
    if (/^\[?\d+\]?\s|et al\.|doi:|https?:\/\/|ISBN|ISSN/i.test(line)) {
      citations.push(line.trim());
    } else if (summaryLines.length < 6) {
      summaryLines.push(line.trim());
    }
  }

  // Log usage for self-reporting cost tracking
  if (userId && supabase) {
    await supabase.from('budget_events').insert({
      user_id: userId,
      event_type: 'pdf_read',
      amount_gbp: 0.004, // ~$0.005 for a typical doc
      metadata: { url: url?.slice(0, 200) ?? null, inputTokens: response.usage?.input_tokens ?? 0 },
    }).catch(() => null);
  }

  return NextResponse.json({
    text: raw,
    summary: summaryLines.join(' ').slice(0, 600),
    citations: citations.slice(0, 20),
    usage: {
      inputTokens: response.usage?.input_tokens ?? 0,
      outputTokens: response.usage?.output_tokens ?? 0,
    },
  });
}
