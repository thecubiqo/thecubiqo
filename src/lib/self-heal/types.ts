/**
 * Type definitions for Self-Heal system
 */

export interface DiagnosticResult {
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
}

export interface RepairAction {
  type: 'cache_clear' | 'service_restart' | 'migration_reapply' | 'custom';
  description: string;
  status: 'success' | 'failed' | 'skipped';
  errorMessage?: string;
  rollbackCommand?: string;
  details?: Record<string, any>;
  executedAt: Date;
}

export interface RollbackPatch {
  commands: string[];
  sqlStatements: string[];
  description: string;
}

export interface SelfHealReport {
  id?: string;
  runDate: Date;
  status: 'success' | 'partial' | 'failed';
  diagnostics: DiagnosticResult[];
  repairs: RepairAction[];
  rollbackPatch: RollbackPatch;
  fixedIssues: string[];
  criticalIssues: string[];
  recommendations: string[];
  emailSent: boolean;
  emailSentAt?: Date;
  emailFrom: string;
  emailTo: string;
  executionTimeMs: number;
}

export interface AuditLog {
  id?: string;
  reportId: string;
  actionType: string;
  actionDetails: Record<string, any>;
  status: 'success' | 'failed' | 'skipped';
  errorMessage?: string;
  rollbackCommand?: string;
  executedAt: Date;
}
