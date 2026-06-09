import { NextRequest, NextResponse } from 'next/server';
import {
  cleanEnv,
  getSupabaseAdmin,
  requireApiUser,
  safeTableMissing,
  serviceRoleKey,
  supabaseAnonKey,
  supabaseUrl
} from '../_lib/supabase-admin';

const hasEnv = (...values: Array<string | undefined>) => Boolean(cleanEnv(...values));

async function checkSupabase() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { configured: false, ok: false, message: 'Supabase service role is not configured server-side' };
  }

  const { error } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).limit(1);
  return {
    configured: true,
    ok: !error,
    message: error?.message || 'profiles reachable'
  };
}

export async function GET() {
  const supabase = await checkSupabase();

  return NextResponse.json({
    app: 'cq.ai',
    timestamp: new Date().toISOString(),
    checks: {
      supabase,
      publicSupabaseUrl: Boolean(supabaseUrl),
      publicSupabaseAnonKey: Boolean(supabaseAnonKey),
      serviceRoleServerOnly: Boolean(serviceRoleKey),
      openai: hasEnv(process.env.OPENAI_API_KEY, process.env.OPENAI_KEY, process.env.AI_API_KEY),
      anthropic: hasEnv(process.env.ANTHROPIC_API_KEY, process.env.ANTHROPIC_KEY, process.env.CLAUDE_API_KEY),
      openrouter: hasEnv(process.env.OPENROUTER_API_KEY, process.env.OPENROUTER_KEY),
      elevenlabs: hasEnv(process.env.ELEVENLABS_API_KEY, process.env.ELEVEN_LABS_API_KEY, process.env.XI_API_KEY),
      keyEncryption: hasEnv(process.env.KEY_ENCRYPTION_SECRET, process.env.BYO_KEY_ENCRYPTION_SECRET),
      // ── Agentic layer (tools, autonomous execution, connectors) ─────────────
      cronSecret: hasEnv(process.env.CRON_SECRET),                 // worker + all crons fire
      composio: hasEnv(process.env.COMPOSIO_API_KEY),              // connector tool actions
      browserbase: hasEnv(process.env.BROWSERBASE_API_KEY) && hasEnv(process.env.BROWSERBASE_PROJECT_ID),
      venice: hasEnv(process.env.VENICE_API_KEY),
      twilio: hasEnv(process.env.TWILIO_ACCOUNT_SID) && hasEnv(process.env.TWILIO_AUTH_TOKEN) && hasEnv(process.env.TWILIO_FROM_NUMBER),
      resend: hasEnv(process.env.RESEND_API_KEY)
    },
    recommendations: [
      supabase.ok ? null : 'Apply migrations and confirm Supabase service role connectivity.',
      hasEnv(process.env.OPENAI_API_KEY, process.env.OPENAI_KEY, process.env.AI_API_KEY)
        ? null
        : 'Configure an OpenAI API key or set a valid provider order.',
      hasEnv(process.env.CRON_SECRET)
        ? null
        : 'AGENTIC: set CRON_SECRET — without it the agent worker + all crons return 401, so no task ever auto-executes.',
      hasEnv(process.env.COMPOSIO_API_KEY)
        ? null
        : 'AGENTIC: set COMPOSIO_API_KEY — without it the agent has no connector tools (cannot take real actions).',
      hasEnv(process.env.KEY_ENCRYPTION_SECRET, process.env.BYO_KEY_ENCRYPTION_SECRET)
        ? null
        : 'AGENTIC: set KEY_ENCRYPTION_SECRET — without it connector secrets cannot be encrypted/decrypted, so connected apps fail.',
      (hasEnv(process.env.BROWSERBASE_API_KEY) && hasEnv(process.env.BROWSERBASE_PROJECT_ID))
        ? null
        : 'AGENTIC: set BROWSERBASE_API_KEY + BROWSERBASE_PROJECT_ID for web/browser actions on sites without an API.'
    ].filter(Boolean)
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if ('error' in auth) return auth.error;

  const body = await request.json().catch(() => ({}));
  const summary = String(body.summary || '').trim().slice(0, 1000);
  if (!summary) {
    return NextResponse.json({ error: 'Summary is required' }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from('diagnostic_reports')
    .insert({
      user_id: auth.user.id,
      kind: body.kind ? String(body.kind).slice(0, 80) : 'self_report',
      status: body.status ? String(body.status).slice(0, 40) : 'observed',
      summary,
      metadata: typeof body.metadata === 'object' && body.metadata !== null ? body.metadata : {}
    })
    .select('id,kind,status,summary,metadata,created_at')
    .single();

  if (safeTableMissing(error)) {
    return NextResponse.json({
      migrationPending: true,
      error: 'diagnostic_reports is not available in Supabase yet'
    });
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ report: data, migrationPending: false }, { status: 201 });
}
