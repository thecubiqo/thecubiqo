import type { DuoRoute, DuoRouteDecision, DuoRiskLevel } from '@/next/types/duo';
import type { AgentAuth } from './common';

export const ROUTE_ORDER: DuoRoute[] = [
  'api',
  'mcp',
  'extension',
  'stagehand_browserbase',
  'visible_browser',
  'headless',
  'computer_use',
  'manual'
];

const FINAL_ACTION_RE = /\b(final send|send email|submit|publish|checkout|payment|pay now|deploy production|delete account|post to|push to|push production|git push)\b/i;

function routeScore(route: DuoRoute) {
  const index = ROUTE_ORDER.indexOf(route);
  return index === -1 ? 100 : index;
}

function defaultFallback(route: DuoRoute): DuoRoute {
  if (route === 'api') return 'stagehand_browserbase';
  if (route === 'stagehand_browserbase') return 'visible_browser';
  return 'manual';
}

async function connectorAvailable(auth: AgentAuth, platform?: string | null) {
  if (!platform) return false;
  const { data } = await auth.supabase
    .from('user_connectors')
    .select('status')
    .eq('user_id', auth.user.id)
    .eq('platform', platform)
    .maybeSingle();
  return data?.status === 'available';
}

async function hasRepeatedRouteFailure(auth: AgentAuth, taskId: string, route: DuoRoute) {
  const { count } = await auth.supabase
    .from('agent_tool_calls')
    .select('*', { count: 'exact', head: true })
    .eq('task_id', taskId)
    .eq('route_used', route)
    .eq('status', 'failed');
  return (count || 0) >= 2;
}

export async function decideRoute(
  auth: AgentAuth,
  task: {
    id: string;
    title: string;
    description?: string | null;
    preferred_route?: string | null;
    route_preference?: string[] | null;
    connector_platform?: string | null;
    risk_level?: DuoRiskLevel | null;
    approval_required?: boolean | null;
  }
): Promise<DuoRouteDecision> {
  const blockedRoutes: DuoRouteDecision['blockedRoutes'] = [];
  const text = `${task.title} ${task.description || ''}`;
  const finalAction = FINAL_ACTION_RE.test(text);
  const platformReady = await connectorAvailable(auth, task.connector_platform);

  const candidates = [
    ...(task.route_preference || []),
    task.preferred_route,
    ...ROUTE_ORDER
  ].filter(Boolean) as DuoRoute[];

  const uniqueCandidates = [...new Set(candidates)]
    .filter((route): route is DuoRoute => ROUTE_ORDER.includes(route as DuoRoute))
    .sort((a, b) => routeScore(a) - routeScore(b));

  for (const route of uniqueCandidates) {
    if (route === 'api' && task.connector_platform && !platformReady) {
      blockedRoutes.push({ route, reason: `No available ${task.connector_platform} connector` });
      continue;
    }

    if (route === 'headless' && task.risk_level !== 'low') {
      blockedRoutes.push({ route, reason: 'Headless route is only allowed for low-risk tasks' });
      continue;
    }

    if (route === 'computer_use' && task.risk_level === 'critical') {
      blockedRoutes.push({ route, reason: 'Computer-use route blocked for critical tasks' });
      continue;
    }

    if (finalAction && route !== 'manual') {
      blockedRoutes.push({ route, reason: 'Final external action requires explicit user approval and manual handoff' });
      continue;
    }

    if (await hasRepeatedRouteFailure(auth, task.id, route)) {
      blockedRoutes.push({ route, reason: 'Route has failed twice for this task' });
      continue;
    }

    return {
      selectedRoute: route,
      fallbackRoute: defaultFallback(route),
      riskLevel: task.risk_level || (finalAction ? 'critical' : 'medium'),
      approvalRequired: Boolean(task.approval_required || finalAction || task.risk_level === 'high' || task.risk_level === 'critical'),
      reasons: [
        platformReady ? 'Required connector is available' : 'Selected safest available route',
        finalAction ? 'Final action remains approval-gated' : 'No hard final-action block detected'
      ],
      blockedRoutes
    };
  }

  return {
    selectedRoute: 'manual',
    fallbackRoute: 'manual',
    riskLevel: 'high',
    approvalRequired: true,
    reasons: ['All automated routes were blocked; manual route selected'],
    blockedRoutes
  };
}
