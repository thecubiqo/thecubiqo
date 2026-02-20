/**
 * Integration Agent - Integration Executor Subagent
 * 
 * Executes integration playbooks for third-party services
 * (Shopify, Stripe, SendGrid, etc.)
 * 
 * @module emergent/subagents/integration-agent
 */

import { createClient } from '@/lib/supabase/server'
import type { SubAgentRequest, ToolResponse, IntegrationCallParams } from '../agent-types'
import { ValidationError, NotFoundError } from '../agent-types'
import { executePlaybook } from '../integrations/playbook-executor'

/**
 * Execute integration agent
 * 
 * @param request - Subagent request
 * @returns Tool response with integration result
 */
export async function executeIntegrationAgent(
  request: SubAgentRequest
): Promise<ToolResponse> {
  const params = request.params as any as IntegrationCallParams

  try {
    // Validate params
    if (!params.service) {
      throw new ValidationError('Service is required')
    }

    if (!params.action) {
      throw new ValidationError('Action is required')
    }

    // Get integration for project
    const supabase = await createClient()

    const { data: integration, error } = await (supabase as any)
      .from('integrations')
      .select('*')
      .eq('project_id', request.projectId)
      .eq('service', params.service)
      .eq('status', 'active')
      .single()

    if (error || !integration) {
      throw new NotFoundError(`Integration for service '${params.service}'`)
    }

    // Find playbook for this service + action
    const { data: playbook } = await (supabase as any)
      .from('playbooks')
      .select('*')
      .eq('service', params.service)
      .eq('is_verified', true)
      .single()

    if (!playbook) {
      throw new NotFoundError(`Playbook for service '${params.service}'`)
    }

    // [MONETIZATION UPGRADE] 
    // If service is Stripe/HubSpot, inject monetization context
    if (['stripe', 'hubspot', 'salesforce'].includes(params.service)) {
      console.log(`[IntegrationAgent] Monetization service detected: ${params.service}. Syncing revenue metrics...`);
      (params.params as any).sync_revenue = true;
    }

    // Execute playbook
    const result = await executePlaybook({
      playbookId: (playbook as any).id,
      projectId: request.projectId,
      params: {
        action: params.action,
        ...params.params
      },
      context: {
        integrationId: (integration as any).id,
        integrationConfig: (integration as any).config
      }
    })

    // Update integration last_sync_at
    await (supabase as any)
      .from('integrations')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', (integration as any).id)

    // Increment playbook usage count
    await (supabase as any)
      .rpc('increment_playbook_usage', { playbook_id: (playbook as any).id })

    return {
      success: true,
      data: result,
      error: null,
      metadata: {
        service: params.service,
        action: params.action,
        playbookId: (playbook as any).id,
        playbookName: (playbook as any).name
      }
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Integration execution failed'
    }
  }
}
