export type NotificationType =
  | 'task_completed'
  | 'task_blocked'
  | 'task_waiting_approval'
  | 'task_approved'
  | 'task_rejected'
  | 'project_completed'
  | 'project_stalled'
  | 'capsule_ready'
  | 'rgy_drift_alert'
  | 'success_milestone'
  | 'color_shift_green'
  | 'color_shift_red'
  | 'friend_request'
  | 'friend_accepted'
  | 'new_dm'
  | 'chatroom_mention'
  | 'connector_auth_expired'
  | 'budget_warning'
  | 'budget_exceeded'
  | 'security_alert'
  | 'app_update'
  | 'morning_briefing'
  | 'proactive_check_in'
  | 'aha_moment'
  | 'intervention_nudge'
  | 'briefing_call'
  | 'urgent_call'
  | 'wakeup_call'
  | 'system';

export type NotificationChannel = 'push' | 'desktop' | 'in_app' | 'email' | 'sms' | 'call';

export type NotificationRecord = {
  id: string;
  userId: string;
  type: NotificationType | string;
  title: string;
  body: string | null;
  actionUrl: string | null;
  actionLabel: string | null;
  readAt: string | null;
  actionedAt: string | null;
  dismissedAt: string | null;
  createdAt: string;
};

export type DispatchPayload = {
  userId: string;
  type: NotificationType | string;
  title: string;
  body?: string;
  actionUrl?: string;
  actionLabel?: string;
  channels?: NotificationChannel[];
  expiresAt?: string;
  metadata?: Record<string, unknown>;
};

export type NotificationPreferences = {
  preferences: Record<string, Record<string, boolean>>;
  dndStart: string | null;
  dndEnd: string | null;
  briefingCall: boolean;
  urgentCall: boolean;
  wakeupCall: boolean;
};
