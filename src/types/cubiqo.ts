export type RGYColor = 'red' | 'green' | 'yellow';

export type ClassifyOutcome =
  | 'conversation'
  | 'memory_update'
  | 'journal_insight'
  | 'onboarding_fact'
  | 'rgy_signal';

export type PermissionState = 'granted' | 'denied' | 'pending';

export type DayPart = 'morning' | 'afternoon' | 'evening' | 'night';

export type MemoryEventType =
  | 'session_summary'
  | 'goal_update'
  | 'commitment'
  | 'blocker'
  | 'outcome'
  | 'episode'
  | 'journal_insight'
  | 'preference'
  | 'profile_correction';

export interface LocalSession {
  session_id: string;
  first_seen_at: string;
  last_seen_at: string;
  visit_count: number;
  signals: LocalSignal[];
  last_summary: string | null;
  voice_preference: 'text' | 'voice';
  language_preference: string;
  conversion_nudge_sent: boolean;
  permissions: {
    mic: PermissionState;
    camera: PermissionState;
    memory: PermissionState;
    location: PermissionState;
    push: PermissionState;
    tracking: PermissionState;
  };
}

export interface LocalSignal {
  keyword: string;
  color: RGYColor;
  created_at: string;
}

export interface ContextBundle {
  timeStr: string;
  location: string;
  daysAway: number;
  dailyContext: string;
  memorySnippet: string;
  userProfile: string;
  languagePref: string;
  isAnonymous: boolean;
  sessionSummary: string;
}

export interface ClassifyResult {
  outcome: ClassifyOutcome;
  color?: RGYColor;
  keyword?: string;
  confidence: number;
  freshnessNeeded: boolean;
  emotionalTone: 'neutral' | 'frustrated' | 'curious' | 'excited' | 'stuck';
  riskLevel: 'low' | 'medium' | 'high';
  intentSummary: string;
}

export interface GreetingResponse {
  text: string;
  audioUrl?: string;
  briefingReady: boolean;
  domain?: string;
}

export interface RecommendationCard {
  id: string;
  entityName: string;
  trackedUrl: string;
  tier: 1 | 2 | 3 | 4;
  logoUrl?: string;
  tagline?: string;
  promoCode?: string;
  type: 'tool' | 'product' | 'service' | 'course' | 'book';
  imageUrl?: string;
  price?: { amount: number; currency: string };
  rating?: number;
  reviewCount?: number;
  isPrime?: boolean;
  primeEligible?: boolean;
  userHasThis?: boolean;
  saved?: boolean;
  disclosure?: string;
}

export interface BriefingJSON {
  headline: string;
  blockers: Array<{ title: string; why: string; severity: 'low' | 'medium' | 'high' }>;
  recommended_actions: Array<{ step: string; why: string; effort: 'low' | 'medium' | 'high' }>;
  open_questions: Array<{ question: string; why_it_matters: string }>;
}
