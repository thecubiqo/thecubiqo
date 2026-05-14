export type DuoRoute =
  | 'api'
  | 'mcp'
  | 'extension'
  | 'stagehand_browserbase'
  | 'visible_browser'
  | 'headless'
  | 'computer_use'
  | 'manual';

export type DuoRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type DuoProjectStatus =
  | 'planning'
  | 'working'
  | 'paused'
  | 'blocked'
  | 'waiting_user'
  | 'waiting_approval'
  | 'done'
  | 'failed'
  | 'shot';

export type DuoTaskStatus =
  | 'pending'
  | 'ready'
  | 'running'
  | 'waiting_user'
  | 'waiting_approval'
  | 'completed'
  | 'failed'
  | 'skipped'
  | 'blocked';

export interface DuoGoalInput {
  goal?: string;
  capsuleId?: string;
  signalId?: string;
  domain?: string;
  verbosity?: 'concise' | 'normal' | 'detailed';
  budgetGateGbp?: number;
  constraints?: Record<string, unknown>;
}

export interface DuoGoalInterpretation {
  goal: string;
  domain: string;
  successCriteria: string[];
  knownContext: string[];
  missingInfo: string[];
  riskLevel: DuoRiskLevel;
  routeHints: DuoRoute[];
}

export interface DuoTaskPlan {
  title: string;
  description: string;
  dependsOnTitles: string[];
  preferredRoute?: DuoRoute;
  connectorPlatform?: string;
  riskLevel: DuoRiskLevel;
  approvalRequired: boolean;
  canParallelize: boolean;
}

export interface DuoRouteDecision {
  selectedRoute: DuoRoute;
  fallbackRoute: DuoRoute;
  riskLevel: DuoRiskLevel;
  approvalRequired: boolean;
  reasons: string[];
  blockedRoutes: Array<{ route: DuoRoute; reason: string }>;
}

export interface DuoExecutionResult {
  status: 'completed' | 'waiting_approval' | 'blocked' | 'failed' | 'already_executed';
  taskId: string;
  approvalId?: string;
  message: string;
}
