export type AdapterType = 'oauth2' | 'api_key' | 'open_banking' | 'extension';
export type DetectionRisk = 'zero' | 'negligible' | 'low' | 'medium' | 'high';
export type HealthStatus = 'healthy' | 'degraded' | 'broken' | 'unknown';
export type ConnectorPriority = 'critical' | 'high' | 'medium' | 'low';

export interface Connector {
  platform: string;
  displayName: string;
  description: string;
  adapterType: AdapterType;
  category: string;
  phase: number;
  priority: ConnectorPriority;
  detectionRisk: DetectionRisk;
  tosRisk: boolean;
  neverAutomateWrites: boolean;
  logoUrl: string | null;
  connected: boolean;
  healthStatus: HealthStatus;
  lastChecked: string | null;
}

export type ConnectorCategory =
  | 'all'
  | 'connected'
  | 'productivity'
  | 'banking'
  | 'investing'
  | 'crypto'
  | 'career'
  | 'ecommerce'
  | 'social'
  | 'dating'
  | 'travel'
  | 'food'
  | 'health'
  | 'government'
  | 'property'
  | 'entertainment'
  | 'education'
  | 'transfers';

export interface OAuthStartResponse {
  authUrl: string;
}

export interface PlaidLinkTokenResponse {
  linkToken: string;
}

export interface ConnectorListResponse {
  connectors: Connector[];
}
