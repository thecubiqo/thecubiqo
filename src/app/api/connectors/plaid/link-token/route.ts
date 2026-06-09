import { NextRequest, NextResponse } from 'next/server';
import { Products } from 'plaid';
import { z } from 'zod';
import { requireApiUser } from '@/next/app/api/_lib/supabase-admin';
import { OpenBankingAdapter } from '@/next/lib/connectors/adapters/open-banking-adapter';

export const runtime = 'nodejs';

const LinkTokenSchema = z.object({
  products: z.array(z.string().min(1)).default(['transactions', 'auth', 'investments']),
});

export async function POST(request: NextRequest) {
  const parsed = LinkTokenSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid Plaid payload', issues: parsed.error.flatten() }, { status: 400 });
  }

  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  try {
    const linkToken = await OpenBankingAdapter.createLinkToken(auth.user.id, parsed.data.products as Products[]);
    return NextResponse.json({ linkToken });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Plaid link token failed' }, { status: 500 });
  }
}
