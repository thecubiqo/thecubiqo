import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser, safeTableMissing, missingMigrationResponse } from '../_lib/supabase-admin';

export const runtime = 'nodejs';

function normalizeMessage(m: unknown): Record<string, unknown> | null {
  if (!m || typeof m !== 'object') return null;
  const msg = m as Record<string, unknown>;
  if (!msg.role || !msg.content) return null;
  return {
    role: String(msg.role).slice(0, 20),
    content: String(msg.content).slice(0, 8000),
    createdAt: msg.createdAt || new Date().toISOString()
  };
}

// GET /api/sessions?session_id=xxx — load conversation history
export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const sessionId = url.searchParams.get('session_id');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200);

  if (!sessionId) {
    // List user's sessions
    const { data, error } = await auth.supabase
      .from('conversation_sessions')
      .select('id,title,created_at,updated_at,message_count,metadata')
      .eq('user_id', auth.user.id)
      .order('updated_at', { ascending: false })
      .limit(20);

    if (error) {
      if (safeTableMissing(error)) return missingMigrationResponse('sessions', 'conversation_sessions');
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ sessions: data || [] });
  }

  // Load specific session with messages
  const { data: session, error: sessionError } = await auth.supabase
    .from('conversation_sessions')
    .select('id,title,created_at,updated_at,message_count,metadata')
    .eq('id', sessionId)
    .eq('user_id', auth.user.id)
    .maybeSingle();

  if (sessionError) {
    if (safeTableMissing(sessionError)) return missingMigrationResponse('sessions', 'conversation_sessions');
    return NextResponse.json({ error: sessionError.message }, { status: 500 });
  }
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

  const { data: messages, error: msgError } = await auth.supabase
    .from('session_messages')
    .select('id,role,content,created_at,metadata')
    .eq('session_id', sessionId)
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (msgError) return NextResponse.json({ error: msgError.message }, { status: 500 });

  return NextResponse.json({ session, messages: messages || [] });
}

// POST /api/sessions — create session or append messages
export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const action = String(body.action || 'upsert');
  const sessionId = body.session_id ? String(body.session_id).slice(0, 80) : null;
  const title = String(body.title || 'Conversation').slice(0, 200);
  const messages: unknown[] = Array.isArray(body.messages) ? body.messages : [];

  const normalized = messages.map(normalizeMessage).filter(Boolean) as Record<string, unknown>[];

  if (action === 'create' || (!sessionId && normalized.length === 0)) {
    const { data, error } = await auth.supabase
      .from('conversation_sessions')
      .insert({ user_id: auth.user.id, title, message_count: 0 })
      .select('id,title,created_at,updated_at,message_count')
      .single();

    if (error) {
      if (safeTableMissing(error)) return missingMigrationResponse('sessions', 'conversation_sessions');
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ session: data });
  }

  // Upsert session
  let currentSessionId = sessionId;
  if (!currentSessionId) {
    const { data, error } = await auth.supabase
      .from('conversation_sessions')
      .insert({ user_id: auth.user.id, title, message_count: normalized.length })
      .select('id')
      .single();

    if (error) {
      if (safeTableMissing(error)) return missingMigrationResponse('sessions', 'conversation_sessions');
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    currentSessionId = data.id;
  }

  if (normalized.length > 0) {
    const rows = normalized.map(m => ({
      session_id: currentSessionId,
      user_id: auth.user.id,
      role: m.role,
      content: m.content,
      metadata: m.metadata || null
    }));

    const { error: msgError } = await auth.supabase.from('session_messages').insert(rows);
    if (msgError) return NextResponse.json({ error: msgError.message }, { status: 500 });

    // Update session timestamp
    await auth.supabase
      .from('conversation_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', currentSessionId)
      .eq('user_id', auth.user.id);
  }

  return NextResponse.json({ session_id: currentSessionId, saved: normalized.length });
}

// DELETE /api/sessions?session_id=xxx
export async function DELETE(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const sessionId = url.searchParams.get('session_id');
  if (!sessionId) return NextResponse.json({ error: 'session_id required' }, { status: 400 });

  await auth.supabase.from('session_messages').delete().eq('session_id', sessionId).eq('user_id', auth.user.id);
  const { error } = await auth.supabase
    .from('conversation_sessions')
    .delete()
    .eq('id', sessionId)
    .eq('user_id', auth.user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true, session_id: sessionId });
}
