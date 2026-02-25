import { Tool, ToolContext, ToolResult } from '@/types/tool';
import { createClient } from '@supabase/supabase-js';

interface BillingTrackParams {
  resourceType: string;
  creditsConsumed: number;
  description?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Billing tracking tool for the agent ToolRegistry.
 *
 * Records credit transactions when agents perform billable actions
 * (AI generation, code execution, etc.).  Writes to both `usage_logs`
 * (granular audit trail) and `credit_transactions` (balance ledger).
 *
 * When Supabase env vars are missing the tool operates in log-only mode
 * so local/dev environments never break.
 */
export const billingTrackTool: Tool = {
  id: 'billing_track',
  name: 'Track Billing Usage',
  description:
    'Record a credit transaction for a billable action. ' +
    'Inserts into usage_logs and credit_transactions tables.',
  parameters: {
    type: 'object',
    properties: {
      resourceType: {
        type: 'string',
        description:
          'Category of the billable resource (e.g. "ai_generation", "code_execution", "image_gen")',
      },
      creditsConsumed: {
        type: 'number',
        description: 'Number of credits to deduct for this action',
      },
      description: {
        type: 'string',
        description: 'Human-readable description of the transaction (optional)',
      },
      metadata: {
        type: 'object',
        description: 'Arbitrary metadata to attach to the usage log (optional)',
      },
    },
    required: ['resourceType', 'creditsConsumed'],
  },

  execute: async (params: any, context: ToolContext): Promise<ToolResult> => {
    const {
      resourceType,
      creditsConsumed,
      description,
      metadata,
    } = params as BillingTrackParams;

    // ── Input validation ──────────────────────────────────────────
    if (!resourceType || typeof resourceType !== 'string') {
      return {
        success: false,
        output: '',
        error: 'resourceType is required and must be a string',
      };
    }

    if (creditsConsumed == null || typeof creditsConsumed !== 'number' || creditsConsumed < 0) {
      return {
        success: false,
        output: '',
        error: 'creditsConsumed is required and must be a non-negative number',
      };
    }

    // ── Supabase availability check (log-only fallback) ───────────
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL1;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY1;

    if (!supabaseUrl || !serviceRoleKey) {
      const mock = {
        mode: 'log-only',
        resourceType,
        creditsConsumed,
        description: description ?? null,
        agentId: context.agentId,
        userId: context.userId ?? null,
        timestamp: new Date().toISOString(),
      };

      console.log('[billing-tool] Supabase not configured — log-only mode:', JSON.stringify(mock));

      return {
        success: true,
        output: JSON.stringify({
          message: 'Billing recorded in log-only mode (Supabase not configured)',
          ...mock,
        }),
      };
    }

    // ── Supabase client ───────────────────────────────────────────
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    try {
      const userId = context.userId ?? null;
      let orgId: string | null = null;

      // ── 1. Resolve org from org_members ─────────────────────────
      if (userId) {
        const { data: membership, error: memberErr } = await supabase
          .from('org_members')
          .select('org_id')
          .eq('user_id', userId)
          .limit(1)
          .single();

        if (memberErr) {
          console.warn('[billing-tool] Could not resolve org for user:', memberErr.message);
        } else {
          orgId = membership?.org_id ?? null;
        }
      }

      // ── 2. Insert usage_logs row ────────────────────────────────
      const usagePayload = {
        org_id: orgId,
        user_id: userId,
        resource_type: resourceType,
        credits_consumed: creditsConsumed,
        quantity: 1,
        unit: 'operation',
        metadata: metadata ?? { agentId: context.agentId, sessionId: context.sessionId },
      };

      const { data: usageRow, error: usageErr } = await supabase
        .from('usage_logs')
        .insert(usagePayload)
        .select()
        .single();

      if (usageErr) {
        return {
          success: false,
          output: '',
          error: `Failed to insert usage_logs: ${usageErr.message}`,
        };
      }

      // ── 3. Insert credit_transactions row ───────────────────────
      const txPayload = {
        org_id: orgId,
        amount: -Math.abs(creditsConsumed), // always negative for usage
        transaction_type: 'usage',
        resource_type: resourceType,
        description: description ?? `Agent ${context.agentId} — ${resourceType}`,
      };

      const { data: txRow, error: txErr } = await supabase
        .from('credit_transactions')
        .insert(txPayload)
        .select()
        .single();

      if (txErr) {
        return {
          success: false,
          output: '',
          error: `Failed to insert credit_transactions: ${txErr.message}`,
        };
      }

      // ── 4. Return success with details ──────────────────────────
      return {
        success: true,
        output: JSON.stringify({
          message: 'Billing recorded successfully',
          usageLogId: usageRow?.id ?? null,
          transactionId: txRow?.id ?? null,
          orgId,
          resourceType,
          creditsConsumed,
          amount: txPayload.amount,
        }),
      };
    } catch (error: unknown) {
      console.error('[billing-tool] Unexpected error:', error);
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unexpected billing tracking error',
      };
    }
  },
};
