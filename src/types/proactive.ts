export type ProactiveTriggerType =
  | 'commitment_due'
  | 'stale_capsule'
  | 'rgy_drift'
  | 'capsule_at_risk'
  | 'win_detection'
  | 'crisis_followup'
  | 'social_nudge';

export interface ProactiveNudge {
  id: string;
  interventionType: ProactiveTriggerType | string;
  message: string;
  createdAt: string;
}
