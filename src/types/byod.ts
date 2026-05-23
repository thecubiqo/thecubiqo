export type BYODStatus =
  | 'pending_verification'
  | 'active'
  | 'error'
  | 'disconnected'
  | 'pending'
  | 'connected'
  | 'unhealthy';

export interface BYODConnection {
  id: string;
  userId: string;
  supabaseUrl: string;
  status: BYODStatus;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BYODConnectRequest {
  supabaseUrl: string;
  serviceRoleKey: string;
}

export interface BYODHealthStatus {
  reachable: boolean;
  latencyMs: number | null;
  tablesPresent: string[];
  tablesMissing: string[];
  lastCheckedAt: string;
}
