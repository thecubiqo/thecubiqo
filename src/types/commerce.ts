export type CommerceTier = 1 | 2 | 3 | 4;

export interface CommerceRecommendationCard {
  id: string;
  entityName: string;
  trackedUrl: string;
  tier: CommerceTier;
  disclosure: string;
}
