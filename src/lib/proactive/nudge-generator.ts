import type { ProactiveTrigger } from './trigger-evaluator';

export interface GeneratedNudge {
  type: string;
  title: string;
  body: string;
  actionUrl: string;
  actionLabel: string;
  channels: Array<'in_app' | 'push'>;
  metadata: Record<string, unknown>;
}

function projectName(trigger: ProactiveTrigger) {
  const title = trigger.metadata.projectTitle;
  return typeof title === 'string' && title.trim() ? title.trim() : 'that capsule';
}

export function generateNudge(trigger: ProactiveTrigger): GeneratedNudge {
  switch (trigger.type) {
    case 'crisis_followup':
      return {
        type: trigger.type,
        title: 'Checking in',
        body: 'Last time felt heavy. How are you doing today?',
        actionUrl: trigger.actionUrl,
        actionLabel: 'Open chat',
        channels: ['in_app', 'push'],
        metadata: trigger.metadata
      };
    case 'commitment_due':
      return {
        type: trigger.type,
        title: 'Commitment due soon',
        body: `${String(trigger.metadata.summary || 'That commitment').slice(0, 140)} is due soon. Want to talk through the next move?`,
        actionUrl: trigger.actionUrl,
        actionLabel: 'Review',
        channels: ['in_app', 'push'],
        metadata: trigger.metadata
      };
    case 'capsule_at_risk':
      return {
        type: trigger.type,
        title: 'Capsule needs attention',
        body: `${projectName(trigger)} is drifting. Want to look at what is blocking it?`,
        actionUrl: trigger.actionUrl,
        actionLabel: 'Open Duo',
        channels: ['in_app', 'push'],
        metadata: trigger.metadata
      };
    case 'win_detection':
      return {
        type: trigger.type,
        title: 'Capsule completed',
        body: `${projectName(trigger)} is done. Here is what that looked like.`,
        actionUrl: trigger.actionUrl,
        actionLabel: 'See impact',
        channels: ['in_app', 'push'],
        metadata: trigger.metadata
      };
    case 'stale_capsule':
      return {
        type: trigger.type,
        title: 'Still on track?',
        body: `${projectName(trigger)} has not moved in a few days. Still on track, or should we reset the next step?`,
        actionUrl: trigger.actionUrl,
        actionLabel: 'Open Duo',
        channels: ['in_app', 'push'],
        metadata: trigger.metadata
      };
    case 'rgy_drift':
      return {
        type: trigger.type,
        title: 'Small reset?',
        body: 'You have been in a drift lately. Is there something you want to move on but have not started?',
        actionUrl: trigger.actionUrl,
        actionLabel: 'Talk it through',
        channels: ['in_app', 'push'],
        metadata: trigger.metadata
      };
    case 'social_nudge':
      return {
        type: trigger.type,
        title: 'Social signal',
        body: 'There is new energy in your CubiQo social layer. It might be worth a look.',
        actionUrl: trigger.actionUrl,
        actionLabel: 'Open',
        channels: ['in_app'],
        metadata: trigger.metadata
      };
    case 'memory_recall':
    default:
      return {
        type: trigger.type,
        title: 'Worth revisiting',
        body: `${trigger.reason.slice(0, 180)} Want to pick this back up?`,
        actionUrl: trigger.actionUrl,
        actionLabel: 'Open chat',
        channels: ['in_app'],
        metadata: trigger.metadata
      };
  }
}

export function generateMorningBriefing(input: {
  rgyStatus?: string | null;
  openProjects: number;
  pendingApprovals: number;
  socialItems: number;
  observation?: string | null;
}) {
  const opener =
    input.rgyStatus === 'green'
      ? 'Strong start. Here is what to move on today.'
      : input.rgyStatus === 'red'
        ? 'Okay. One thing at a time. Here is what matters most.'
        : 'Nothing urgent. Here is a gentle overview of what is open.';

  const details = [
    input.openProjects ? `${input.openProjects} Duo project${input.openProjects === 1 ? '' : 's'} open` : null,
    input.pendingApprovals ? `${input.pendingApprovals} approval${input.pendingApprovals === 1 ? '' : 's'} waiting` : null,
    input.socialItems ? `${input.socialItems} social update${input.socialItems === 1 ? '' : 's'} since yesterday` : null,
    input.observation || null
  ].filter(Boolean);

  return {
    title: 'Morning briefing',
    body: details.length ? `${opener} ${details.join(' · ')}.` : opener,
    actionUrl: '/chat',
    actionLabel: 'Open briefing'
  };
}
