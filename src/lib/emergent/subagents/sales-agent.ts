/**
 * Sales Agent - CRM & Outreach Subagent
 * 
 * Manages sales leads, tracks outreach, and qualifies potential partners.
 * 
 * @module emergent/subagents/sales-agent
 */

import { createClient } from '@/lib/supabase/server'
import type { SubAgentRequest, ToolResponse, SalesParams } from '../agent-types'
import { ValidationError, NotFoundError } from '../agent-types'

/**
 * Execute sales agent
 */
export async function executeSalesAgent(
    request: SubAgentRequest
): Promise<ToolResponse> {
    const params = request.params as any as SalesParams
    const supabase = await createClient()

    try {
        switch (params.action) {
            case 'add-lead':
                if (!params.lead) throw new ValidationError('Lead data is required')

                const { data: lead, error: addError } = await (supabase as any)
                    .from('emergent_sales_leads')
                    .insert({
                        project_id: request.projectId,
                        contact_name: params.lead.name,
                        contact_email: params.lead.email,
                        company: params.lead.company,
                        status: params.lead.status || 'new',
                        notes: params.lead.notes
                    })
                    .select()
                    .single()

                if (addError) throw addError

                return {
                    success: true,
                    data: lead,
                    error: null
                }

            case 'log-outreach':
                if (!params.lead?.id) throw new ValidationError('Lead ID is required')

                const { data: updatedLead, error: updateError } = await (supabase as any)
                    .from('emergent_sales_leads')
                    .update({
                        last_outreach_at: new Date().toISOString(),
                        status: 'contacted'
                    })
                    .eq('id', params.lead.id)
                    .select()
                    .single()

                if (updateError) throw updateError

                return {
                    success: true,
                    data: updatedLead,
                    error: null
                }

            default:
                throw new ValidationError(`Unknown sales action: ${params.action}`)
        }
    } catch (error) {
        return {
            success: false,
            data: null,
            error: error instanceof Error ? error.message : 'Sales agent failed'
        }
    }
}
