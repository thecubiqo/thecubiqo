export type ConnectorAdapterType = 'oauth2' | 'api_key' | 'open_banking' | 'extension';

export interface ConnectorAdapter {
  platform: string;
  adapterType: ConnectorAdapterType;
  getAuthHeaders(userId: string): Promise<Record<string, string> | null>;
  isConnected(userId: string): Promise<boolean>;
  disconnect(userId: string): Promise<void>;
}

export interface ConnectorRegistry {
  platform: string;
  displayName: string;
  adapterType: ConnectorAdapterType;
  phase: number;
  priority: string;
  detectionRisk: string;
  tosRisk: boolean;
  neverAutomateWrites: boolean;
}
