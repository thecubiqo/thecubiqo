import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser, safeTableMissing } from '../_lib/supabase-admin';

function generateCqNumber(userId: string) {
  const digits = userId.replace(/[^0-9a-f]/gi, '').slice(0, 10);
  const numeric = parseInt(digits || '0', 16).toString().padStart(10, '0').slice(0, 10);
  return `CQ-${numeric.slice(0, 3)}-${numeric.slice(3, 6)}-${numeric.slice(6, 10)}`;
}

export async function GET(request: NextRequest) {
  const auth = await requireApiUser(request);
  if ('error' in auth) return auth.error;

  const [profile, contacts, messages] = await Promise.all([
    auth.supabase
      .from('cq_profiles')
      .select('id,cq_number,display_name,status,created_at,updated_at')
      .eq('user_id', auth.user.id)
      .maybeSingle(),
    auth.supabase
      .from('cq_contacts')
      .select('id,contact_cq_number,display_name,status,created_at,updated_at')
      .eq('user_id', auth.user.id)
      .order('updated_at', { ascending: false }),
    auth.supabase
      .from('cq_messages')
      .select('id,sender_id,recipient_id,body,metadata,created_at')
      .or(`sender_id.eq.${auth.user.id},recipient_id.eq.${auth.user.id}`)
      .order('created_at', { ascending: false })
      .limit(30)
  ]);

  if (safeTableMissing(profile.error) || safeTableMissing(contacts.error) || safeTableMissing(messages.error)) {
    return NextResponse.json({
      migrationPending: true,
      profile: null,
      contacts: [],
      messages: [],
      error: 'CQ tables are not available in Supabase yet'
    });
  }

  const error = profile.error || contacts.error || messages.error;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    migrationPending: false,
    profile: profile.data,
    contacts: contacts.data || [],
    messages: messages.data || [],
    realtime: {
      status: 'schema_ready',
      note: 'Supabase realtime channel can be enabled after the migration is applied and QA sessions are tested.'
    }
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if ('error' in auth) return auth.error;

  const body = await request.json().catch(() => ({}));
  const action = String(body.action || 'ensure_profile');

  if (action === 'ensure_profile') {
    const { data, error } = await auth.supabase
      .from('cq_profiles')
      .upsert(
        {
          user_id: auth.user.id,
          cq_number: generateCqNumber(auth.user.id),
          display_name: body.displayName ? String(body.displayName).slice(0, 120) : null,
          status: 'active'
        },
        { onConflict: 'user_id' }
      )
      .select('id,cq_number,display_name,status,created_at,updated_at')
      .single();

    if (safeTableMissing(error)) {
      return NextResponse.json({ migrationPending: true, error: 'cq_profiles is not available in Supabase yet' });
    }
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ profile: data, migrationPending: false }, { status: 201 });
  }

  if (action === 'contact') {
    const contactCqNumber = String(body.cqNumber || '').trim().toUpperCase();
    if (!contactCqNumber) {
      return NextResponse.json({ error: 'CQ number is required' }, { status: 400 });
    }

    const { data, error } = await auth.supabase
      .from('cq_contacts')
      .upsert(
        {
          user_id: auth.user.id,
          contact_cq_number: contactCqNumber,
          display_name: body.displayName ? String(body.displayName).slice(0, 120) : null,
          status: 'pending'
        },
        { onConflict: 'user_id,contact_cq_number' }
      )
      .select('id,contact_cq_number,display_name,status,created_at,updated_at')
      .single();

    if (safeTableMissing(error)) {
      return NextResponse.json({ migrationPending: true, error: 'cq_contacts is not available in Supabase yet' });
    }
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ contact: data, migrationPending: false }, { status: 201 });
  }

  return NextResponse.json({ error: 'Unsupported CQ action' }, { status: 400 });
}
