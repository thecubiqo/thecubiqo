import { inngest } from './client';

export const duoAgentFunction = {
  id: 'duo-agent',
  name: 'DuoMode Agent',
  trigger: { event: 'duo/project.created' },
  handler: async (event: { data?: Record<string, unknown> }) => ({ ok: true, event: event.data || {} }),
};

export const inngestFunctions = [duoAgentFunction];

export async function enqueueDuoProject(projectId: string, userId: string) {
  return inngest.send({ name: 'duo/project.created', data: { projectId, userId } });
}
