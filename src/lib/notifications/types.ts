// Notification types and interfaces for system-wide alerts

export type NotificationType = 
  | 'self_heal_critical'
  | 'self_heal_warning'
  | 'self_heal_success'
  | 'system_health'
  | 'security_alert'
  | 'performance_issue'
  | 'info';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  details?: Record<string, any>;
  actionUrl?: string;
  actionLabel?: string;
  userId?: string; // null for system-wide notifications
  read: boolean;
  dismissed: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

export interface NotificationPreferences {
  userId: string;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  webhookEnabled: boolean;
  slackEnabled: boolean;
  mutedTypes: NotificationType[];
  minPriority: NotificationPriority;
}

export interface WebhookConfig {
  url: string;
  secret?: string;
  enabled: boolean;
}

export interface SlackConfig {
  webhookUrl: string;
  channel?: string;
  enabled: boolean;
}
