import type { DuoGoalInterpretation, DuoRiskLevel, DuoRoute } from '@/next/types/duo';
import type { AgentAuth } from './common';
import { inferDomainFromText } from './common';

function extractKeywords(value: string) {
  return [...new Set(value.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter(w => w.length > 3))].slice(0, 12);
}

function inferRisk(goal: string): DuoRiskLevel {
  const text = goal.toLowerCase();
  if (/\b(payment|checkout|bank|transfer|delete account|submit application|publish|send email|post now|deploy production)\b/.test(text)) return 'critical';
  if (/\b(send|submit|publish|apply|delete|update live|connect account)\b/.test(text)) return 'high';
  if (/\b(draft|prepare|compare|research|plan|review)\b/.test(text)) return 'low';
  return 'medium';
}

function routeHints(goal: string): DuoRoute[] {
  const text = goal.toLowerCase();
  if (/\b(shopify|printify|stripe|github|notion|gmail|calendar|slack)\b/.test(text)) return ['api', 'mcp', 'stagehand_browserbase', 'visible_browser', 'manual'];
  if (/\b(website|dashboard|portal|screen|browser)\b/.test(text)) return ['stagehand_browserbase', 'visible_browser', 'manual'];
  if (/\b(code|repo|test|build)\b/.test(text)) return ['api', 'manual'];
  return ['api', 'mcp', 'manual'];
}

export async function interpretGoal(
  auth: AgentAuth,
  input: { goal: string; domain?: string | null }
): Promise<DuoGoalInterpretation> {
  const goal = input.goal.trim();
  const domain = input.domain || inferDomainFromText(goal);
  const keywords = extractKeywords(goal);

  const { data: memories } = await auth.supabase
    .from('memory_events')
    .select('summary,keywords,weight,created_at')
    .eq('user_id', auth.user.id)
    .is('archived_at', null)
    .order('weight', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(20);

  const knownContext = (memories || [])
    .map((memory: any) => ({
      summary: String(memory.summary || ''),
      overlap: (Array.isArray(memory.keywords) ? memory.keywords : [])
        .filter((keyword: string) => keywords.includes(String(keyword).toLowerCase())).length,
      weight: Number(memory.weight || 1)
    }))
    .filter((memory: any) => memory.overlap > 0 || memory.weight >= 3)
    .sort((a: any, b: any) => (b.overlap + b.weight) - (a.overlap + a.weight))
    .slice(0, 5)
    .map((memory: any) => memory.summary);

  const missingInfo: string[] = [];
  if (!knownContext.length && goal.length < 24) {
    missingInfo.push('A little more context about the desired outcome would improve the task graph.');
  }

  return {
    goal,
    domain,
    successCriteria: [
      'A concrete next step exists',
      'Any external-impact action is approval-gated',
      'Evidence is logged for completed work'
    ],
    knownContext,
    missingInfo,
    riskLevel: inferRisk(goal),
    routeHints: routeHints(goal)
  };
}
