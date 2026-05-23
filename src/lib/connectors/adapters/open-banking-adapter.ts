import { CountryCode, PlaidApi, PlaidEnvironments, Products, Configuration } from 'plaid';
import { getSupabaseAdmin } from '@/next/app/api/_lib/supabase-admin';
import { shouldUseProviderMock } from '@/next/lib/providers/live-provider-guard';
import { decrypt, encrypt, hint } from './crypto';

function buildPlaidClient() {
  const env = (process.env.PLAID_ENV || 'sandbox') as keyof typeof PlaidEnvironments;
  const clientId = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;
  if (!clientId || !secret) throw new Error('Plaid is not configured');
  return new PlaidApi(
    new Configuration({
      basePath: PlaidEnvironments[env] || PlaidEnvironments.sandbox,
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': clientId,
          'PLAID-SECRET': secret,
        },
      },
    }),
  );
}

export class OpenBankingAdapter {
  static async createLinkToken(userId: string, products: Products[]): Promise<string> {
    if (shouldUseProviderMock()) return `mock-link-token-${userId}`;
    const res = await buildPlaidClient().linkTokenCreate({
      user: { client_user_id: userId },
      client_name: 'CubiQo',
      products,
      country_codes: [CountryCode.Us],
      language: 'en',
    });
    return res.data.link_token;
  }

  static async exchangePublicToken(userId: string, publicToken: string): Promise<void> {
    const tokenData = shouldUseProviderMock()
      ? { access_token: `mock-plaid-access-${userId}`, item_id: `mock-item-${userId}` }
      : (await buildPlaidClient().itemPublicTokenExchange({ public_token: publicToken })).data;

    const supabase = getSupabaseAdmin();
    if (!supabase) throw new Error('DB unavailable');

    const { data: existing } = await supabase
      .from('user_connectors')
      .select('id')
      .eq('user_id', userId)
      .eq('platform', 'plaid')
      .maybeSingle();

    const payload = {
      user_id: userId,
      platform: 'plaid',
      adapter_type: 'open_banking',
      auth_type: 'open_banking',
      status: 'active',
      ob_item_id: tokenData.item_id,
      last_health_check_at: new Date().toISOString(),
      health_status: 'healthy',
      updated_at: new Date().toISOString(),
    };

    const connector = existing?.id
      ? await supabase.from('user_connectors').update(payload).eq('id', existing.id).select('id').single()
      : await supabase.from('user_connectors').insert(payload).select('id').single();

    if (connector.error || !connector.data?.id) throw new Error(connector.error?.message || 'Failed to save Plaid connector');

    await supabase.from('connector_secrets').upsert(
      {
        user_id: userId,
        connector_id: connector.data.id,
        platform: 'plaid',
        secret_ref: `plaid:${connector.data.id}:open_banking`,
        status: 'active',
        ob_access_token_encrypted: encrypt(tokenData.access_token),
        token_hint: hint(tokenData.access_token),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'connector_id' },
    );
  }

  static async getAccessToken(userId: string): Promise<string | null> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return null;
    const { data: connector } = await supabase
      .from('user_connectors')
      .select('id,status')
      .eq('user_id', userId)
      .eq('platform', 'plaid')
      .maybeSingle();
    if (!connector || connector.status !== 'active') return null;
    const { data: secret } = await supabase
      .from('connector_secrets')
      .select('ob_access_token_encrypted')
      .eq('connector_id', connector.id)
      .eq('status', 'active')
      .maybeSingle();
    return secret?.ob_access_token_encrypted ? decrypt(secret.ob_access_token_encrypted) : null;
  }

  static async getTransactions(userId: string, days = 30) {
    const accessToken = await this.getAccessToken(userId);
    if (!accessToken) return null;
    if (shouldUseProviderMock()) return [];
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const res = await buildPlaidClient().transactionsGet({
      access_token: accessToken,
      start_date: startDate,
      end_date: endDate,
    });
    return res.data.transactions;
  }

  static async getBalances(userId: string) {
    const accessToken = await this.getAccessToken(userId);
    if (!accessToken) return null;
    if (shouldUseProviderMock()) return [];
    const res = await buildPlaidClient().accountsBalanceGet({ access_token: accessToken });
    return res.data.accounts;
  }

  static async getInvestments(userId: string) {
    const accessToken = await this.getAccessToken(userId);
    if (!accessToken) return null;
    if (shouldUseProviderMock()) return { accounts: [], holdings: [], securities: [] };
    const res = await buildPlaidClient().investmentsHoldingsGet({ access_token: accessToken });
    return res.data;
  }
}
