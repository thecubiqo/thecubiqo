/**
 * POST /api/agent/camera
 * Analyse a camera frame with Claude vision — describe, OCR, detect objects, classify mood.
 * Camera permission is required (guardPermission 'camera').
 *
 * Body: { image: string (base64, no prefix), mimeType?: string, task?: string }
 * Returns: { description: string, ocrText?: string, tags?: string[], confidence: number }
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';
import { getBearerToken, getSupabaseAdmin } from '../../_lib/supabase-admin';
import { getModel } from '@/next/lib/config/llm';
import { guardPermission } from '@/next/lib/agent/permission-guard';

export const runtime = 'nodejs';
export const maxDuration = 30;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const TASK_PRESETS: Record<string, string> = {
  describe: 'Describe what you see in this image in detail.',
  ocr: 'Extract all readable text from this image. Return only the raw text, preserving layout.',
  detect: 'List all objects, people, and notable elements visible in this image.',
  mood: 'Analyse the emotional tone and energy of this scene. Return a brief mood reading.',
  document: 'This is a document or screenshot. Extract all text and describe the layout.',
};

const bodySchema = z.object({
  image: z.string().min(10),   // base64 encoded, no data: prefix
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/gif', 'image/webp']).default('image/jpeg'),
  task: z.string().max(400).optional(),
  preset: z.enum(['describe', 'ocr', 'detect', 'mood', 'document']).optional(),
});

export async function POST(request: NextRequest) {
  // ── Auth ─────────────────────────────────────────────────────────────────
  const supabase = getSupabaseAdmin();
  const token = getBearerToken(request);
  let userId: string | null = null;

  if (supabase && token) {
    const { data } = await supabase.auth.getUser(token);
    userId = data?.user?.id ?? null;
  }

  // ── Camera permission gate ────────────────────────────────────────────────
  const denied = await guardPermission(supabase, userId, 'camera', true);
  if (denied) return denied; // 403 with permission error

  // ── Parse body ────────────────────────────────────────────────────────────
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', issues: parsed.error.flatten() }, { status: 400 });
  }

  const { image, mimeType, task, preset } = parsed.data;

  // Strip data: URI prefix if accidentally included
  const cleanBase64 = image.replace(/^data:[^;]+;base64,/, '');

  // Size guard — 5 MB max for a camera frame
  const byteSize = Math.ceil((cleanBase64.length * 3) / 4);
  if (byteSize > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Image too large (5 MB max)' }, { status: 413 });
  }

  const instruction = task || (preset ? TASK_PRESETS[preset] : TASK_PRESETS.describe);

  // ── Send to Claude vision ─────────────────────────────────────────────────
  let response: any;
  try {
    response = await anthropic.messages.create({
      model: getModel('claude_agent'), // Sonnet for vision analysis — override via CLAUDE_AGENT_MODEL
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: cleanBase64,
              },
            },
            { type: 'text', text: instruction },
          ],
        },
      ],
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Vision processing failed: ${err?.message || String(err)}` },
      { status: 500 }
    );
  }

  const description = response.content?.[0]?.text ?? '';

  // Extract OCR text if task was OCR-oriented
  const ocrText = (preset === 'ocr' || task?.toLowerCase().includes('text'))
    ? description
    : undefined;

  // Simple tag extraction — nouns from the description
  const tags = [...new Set(
    (description.match(/\b[A-Z][a-z]{2,}|\b(person|screen|text|document|object|background)\b/gi) ?? []) as string[]
  )].slice(0, 12).map(t => t.toLowerCase());

  return NextResponse.json({
    description,
    ocrText,
    tags,
    confidence: 0.92,
    preset: preset ?? 'describe',
    usage: {
      inputTokens: response.usage?.input_tokens ?? 0,
      outputTokens: response.usage?.output_tokens ?? 0,
    },
  });
}
