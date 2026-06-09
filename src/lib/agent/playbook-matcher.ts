import type { AgentAuth } from './common';
import { inferDomainFromText } from './common';

export async function matchPlaybook(auth: AgentAuth, goal: string, preferredDomain?: string) {
  const domain = preferredDomain || inferDomainFromText(goal);
  const keywords = goal.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);

  const { data } = await auth.supabase
    .from('playbooks')
    .select('id,domain,name,description,trigger_keywords,success_rate,task_template')
    .eq('active', true)
    .in('domain', [domain, 'general'])
    .order('success_rate', { ascending: false })
    .limit(12);

  const scored = (data || []).map((playbook: any) => {
    const triggers = Array.isArray(playbook.trigger_keywords) ? playbook.trigger_keywords : [];
    const overlap = triggers.filter((term: string) => keywords.includes(String(term).toLowerCase())).length;
    const domainScore = playbook.domain === domain ? 2 : 0;
    return { playbook, score: domainScore + overlap + Number(playbook.success_rate || 0) };
  });

  scored.sort((a: { score: number }, b: { score: number }) => b.score - a.score);
  return scored[0]?.playbook || null;
}
