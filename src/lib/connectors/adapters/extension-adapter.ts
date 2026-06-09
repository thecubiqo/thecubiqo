import { randomUUID } from 'crypto';
import { getSupabaseAdmin } from '@/next/app/api/_lib/supabase-admin';

export interface ExtensionAction {
  type: 'navigate' | 'fill' | 'click' | 'extract' | 'scroll' | 'read' | 'wait';
  selector?: string;
  value?: string;
  url?: string;
  extractKey?: string;
  timeoutMs?: number;
}

export interface ExtensionResult {
  instructionId: string;
  status: 'completed' | 'failed' | 'partial';
  extractedData: Record<string, unknown>;
  error?: string;
  executedAt: string;
}

export class ExtensionAdapter {
  constructor(private platform: string) {}

  async dispatch(userId: string, actions: ExtensionAction[]): Promise<{ instructionId: string; status: 'queued' }> {
    assertSafeActions(this.platform, actions);
    const supabase = getSupabaseAdmin();
    if (!supabase) throw new Error('DB unavailable');

    const instructionId = randomUUID();
    await supabase.from('extension_instructions').insert({
      id: instructionId,
      user_id: userId,
      platform: this.platform,
      actions,
      status: 'queued',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    });

    return { instructionId, status: 'queued' };
  }

  async waitForResult(instructionId: string, timeoutMs = 30000): Promise<ExtensionResult | null> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return null;

    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const { data } = await supabase
        .from('extension_instructions')
        .select('status,result,error')
        .eq('id', instructionId)
        .maybeSingle();

      if (data?.status === 'completed' || data?.status === 'failed') {
        return {
          instructionId,
          status: data.status,
          extractedData: data.result || {},
          error: data.error || undefined,
          executedAt: new Date().toISOString(),
        };
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }
    return null;
  }

  async isConnected(userId: string): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return false;
    const { data } = await supabase
      .from('user_connectors')
      .select('status,last_health_check_at')
      .eq('user_id', userId)
      .eq('platform', 'cubiqo_extension')
      .maybeSingle();

    if (!data || data.status !== 'active') return false;
    const lastHeartbeat = data.last_health_check_at ? new Date(data.last_health_check_at).getTime() : 0;
    return Date.now() - lastHeartbeat < 2 * 60 * 1000;
  }
}

function assertSafeActions(platform: string, actions: ExtensionAction[]) {
  const datingPlatforms = new Set(['bumble', 'hinge', 'tinder']);
  if (!datingPlatforms.has(platform)) return;

  const fillsMessage = actions.some(action => action.type === 'fill' && /message|chat|reply|textarea/i.test(action.selector || ''));
  const clicksSubmit = actions.some(action => action.type === 'click' && /send|submit|reply|message/i.test(action.selector || ''));
  if (fillsMessage && clicksSubmit) {
    throw new Error('Dating message submit must be a separate user-triggered action');
  }
}
