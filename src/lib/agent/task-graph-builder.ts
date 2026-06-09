import type { DuoGoalInterpretation, DuoTaskPlan } from '@/next/types/duo';

function domainSpecificTask(interpretation: DuoGoalInterpretation): DuoTaskPlan {
  const goal = interpretation.goal.toLowerCase();
  if (interpretation.domain === 'ecommerce' || /\b(shopify|store|product|printify)\b/.test(goal)) {
    return {
      title: 'Prepare ecommerce action draft',
      description: 'Prepare the next store/product action as a draft only, with no final publish or payment step.',
      dependsOnTitles: ['Research current constraints'],
      preferredRoute: 'api',
      connectorPlatform: 'shopify',
      riskLevel: 'high',
      approvalRequired: true,
      canParallelize: false
    };
  }

  if (interpretation.domain === 'career' || /\b(job|resume|application|interview)\b/.test(goal)) {
    return {
      title: 'Draft career material',
      description: 'Draft the relevant resume, application, or interview material without submitting it.',
      dependsOnTitles: ['Research current constraints'],
      preferredRoute: 'api',
      connectorPlatform: 'career',
      riskLevel: 'high',
      approvalRequired: true,
      canParallelize: false
    };
  }

  if (interpretation.domain === 'software' || /\b(code|repo|bug|test|build)\b/.test(goal)) {
    return {
      title: 'Inspect implementation surface',
      description: 'Inspect the relevant code and propose a safe implementation path before editing.',
      dependsOnTitles: ['Clarify success criteria'],
      preferredRoute: 'api',
      connectorPlatform: 'github',
      riskLevel: 'medium',
      approvalRequired: false,
      canParallelize: false
    };
  }

  return {
    title: 'Prepare approval-gated next action',
    description: 'Prepare the most useful next action as a draft and pause before any external side effect.',
    dependsOnTitles: ['Research current constraints'],
    preferredRoute: 'manual',
    riskLevel: 'medium',
    approvalRequired: true,
    canParallelize: false
  };
}

export function buildTaskGraph(interpretation: DuoGoalInterpretation): DuoTaskPlan[] {
  const tasks: DuoTaskPlan[] = [
    {
      title: 'Clarify success criteria',
      description: interpretation.missingInfo.length
        ? `Ask the user for: ${interpretation.missingInfo.join(' ')}`
        : 'Confirm the useful outcome and constraints using existing memory first.',
      dependsOnTitles: [],
      preferredRoute: 'manual',
      riskLevel: 'low',
      approvalRequired: false,
      canParallelize: false
    },
    {
      title: 'Research current constraints',
      description: 'Gather current context, connector availability, relevant memory, and any live constraints.',
      dependsOnTitles: ['Clarify success criteria'],
      preferredRoute: interpretation.routeHints[0] || 'api',
      riskLevel: 'low',
      approvalRequired: false,
      canParallelize: false
    },
    domainSpecificTask(interpretation)
  ];

  return tasks;
}
