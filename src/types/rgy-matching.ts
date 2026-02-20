/**
 * RGY Intelligent Matching System Types
 * For intent-based matching and opportunity discovery
 */

export type RGYContext = 'red' | 'yellow' | 'green';

export type OpportunityType = 'room' | 'event' | 'connection' | 'activity';

export type MatchStatus = 'suggested' | 'interested' | 'joined' | 'declined' | 'expired';

export type SubscriptionTier = 'free' | 'pro' | 'premium';

/**
 * User Intent
 * Represents a user's interests and keywords within an RGY context
 */
export interface UserIntent {
  id: string;
  user_id: string;
  rgy_context: RGYContext;
  keywords: string[];
  intent_description?: string;
  embedding?: number[]; // 1536-dimensional vector for OpenAI ada-002
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Opportunity
 * A matchable room, event, connection, or activity
 */
export interface Opportunity {
  id: string;
  title: string;
  description?: string;
  rgy_context: RGYContext;
  opportunity_type: OpportunityType;
  keywords: string[];
  embedding?: number[]; // 1536-dimensional vector
  metadata: Record<string, any>;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
}

/**
 * Match
 * Tracks a user's relationship with an opportunity
 */
export interface Match {
  id: string;
  user_id: string;
  opportunity_id: string;
  intent_id?: string;
  similarity_score?: number; // 0.0000 to 1.0000
  status: MatchStatus;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Pro Match Subscription
 * Opt-in for AI-powered opportunity discovery
 */
export interface ProMatchSubscription {
  id: string;
  user_id: string;
  is_active: boolean;
  subscription_tier: SubscriptionTier;
  preferences: {
    discovery_frequency?: 'daily' | 'weekly' | 'monthly';
    notification_enabled?: boolean;
    auto_suggest?: boolean;
    max_suggestions?: number;
  };
  last_discovery_run?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Match Result
 * Extended match with opportunity details
 */
export interface MatchResult extends Match {
  opportunity: Opportunity;
}

/**
 * Discovery Result
 * Result from AI-powered opportunity discovery
 */
export interface DiscoveryResult {
  opportunity_id: string;
  title: string;
  description?: string;
  similarity_score: number;
  rgy_context: RGYContext;
  opportunity_type: OpportunityType;
  keywords: string[];
  metadata: Record<string, any>;
}

/**
 * API Request/Response Types
 */

export interface SaveIntentRequest {
  rgy_context: RGYContext;
  keywords: string[];
  intent_description?: string;
}

export interface DiscoverOpportunitiesRequest {
  rgy_context?: RGYContext; // If omitted, search across all contexts
  limit?: number;
}

export interface ExpressInterestRequest {
  opportunity_id: string;
}

export interface UpdateSubscriptionRequest {
  is_active?: boolean;
  preferences?: ProMatchSubscription['preferences'];
}

export interface CreateOpportunityRequest {
  title: string;
  description?: string;
  rgy_context: RGYContext;
  opportunity_type: OpportunityType;
  keywords: string[];
  metadata?: Record<string, any>;
  expires_at?: string;
}
