/**
 * Emergent Platform Orchestrator
 * Queues tasks for the Runner (Ciqo) to execute.
 */

import { createClient } from '@/lib/supabase/server';

export interface EmergentTaskOptions {
    projectId: string;
    type: 'playbook' | 'deployment' | 'agent' | 'integration_sync';
    payload: Record<string, any>;
    userId: string;
}

export async function orchestrateTask(options: EmergentTaskOptions): Promise<{ success: boolean; taskId: string; error?: string }> {
    try {
        const supabase = await createClient();
        const { projectId, type, payload, userId } = options;

        if (type === 'playbook') {
            const { playbookId, inputs } = payload;
            if (!playbookId) throw new Error('Missing playbookId for playbook task');

            // Insert into emergent_playbook_executions queue
            const { data, error } = await supabase
                .from('emergent_playbook_executions')
                .insert({
                    project_id: projectId,
                    playbook_id: playbookId,
                    status: 'pending',
                    inputs: inputs || {},
                    started_at: null, // Runner will update this
                    logs: `Task queued by orchestrator for user ${userId}`,
                })
                .select()
                .single();

            if (error) throw error;
            return { success: true, taskId: data.id };
        }

        if (type === 'deployment') {
            // Insert into emergent_deployments queue
            const { data, error } = await supabase
                .from('emergent_deployments')
                .insert({
                    project_id: projectId,
                    environment: payload.environment || 'preview',
                    status: 'pending',
                    triggered_by: userId,
                    metadata: payload.metadata || {},
                    platform: payload.platform || 'vercel',
                    // deployment_number trigger will set the number
                })
                .select()
                .single();

            if (error) throw error;
            return { success: true, taskId: data.id };
        }

        if (type === 'agent') {
            // Create a generic run record if needed, but for now we map 'agent' tasks to playbooks or specific custom actions
            // This is a placeholder for future generic agent tasks
            return { success: false, taskId: '', error: 'Generic agent tasks not yet implemented' };
        }

        return { success: false, taskId: '', error: 'Unknown task type' };

    } catch (error) {
        console.error('Failed to orchestrate task:', error);
        return { success: false, taskId: '', error: String(error) };
    }
}
