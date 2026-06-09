import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiUser } from '@/next/app/api/_lib/supabase-admin';
import { OpenBankingAdapter } from '@/next/lib/connectors/adapters/open-banking-adapter';

export const runtime = 'nodejs';

const ExchangeSchema = z.object({
  publicToken: z.string().min(1).max(4000),
});

export async function POST(request: NextRequest) {
  const parsed = ExchangeSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid Plaid exchange payload', issues: parsed.error.flatten() }, { status: 400 });
  }

  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  try {
    await OpenBankingAdapter.exchangePublicToken(auth.user.id, parsed.data.publicToken);
    return NextResponse.json({ connected: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Plaid exchange failed' }, { status: 500 });
  }
}
