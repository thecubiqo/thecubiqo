export type RGYStatus = 'green' | 'yellow' | 'red';

export type RGYState = {
  userId: string;
  status: RGYStatus;
  score: number;
  reason: string;
  changedAt: string;
  evaluatedAt?: string;
};

export type RGYRules = {
  inactivityDaysYellow: number;
  inactivityDaysRed: number;
  engagementBoostPerSession: number;
  greenMinScore: number;
  yellowMinScore: number;
};

export type RGYTransition = {
  fromStatus: RGYStatus | null;
  toStatus: RGYStatus;
  reason: string;
  triggeredAt: string;
};

export type ChatroomRGYAggregate = {
  chatroomId: string;
  greenCount: number;
  yellowCount: number;
  redCount: number;
  total: number;
  dominantStatus: RGYStatus;
  healthScore: number;
  updatedAt: string;
};
