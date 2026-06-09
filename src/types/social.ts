export type ConnectionStatus = 'pending' | 'active' | 'blocked' | 'muted';
export type ReactionType = 'like' | 'helpful' | 'insightful' | 'celebrate';
export type EntityType = 'memory' | 'duo_project' | 'recommendation' | 'post' | 'chatroom_message' | 'duo_artifact' | 'capsule' | 'project_milestone';
export type FeedEventType =
  | 'followed_you'
  | 'shared_memory'
  | 'completed_project'
  | 'reacted_to_your_content'
  | 'proactive_nudge_shared'
  | 'new_follow'
  | 'project_completed'
  | 'reaction_given';

export interface SocialConnection {
  followerId: string;
  followingId: string;
  status: ConnectionStatus;
  createdAt: string;
}

export interface ActivityFeedEvent {
  id: string;
  actorId: string;
  actorName?: string;
  eventType: FeedEventType | string;
  entityId: string | null;
  entityType: EntityType | string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface SocialReaction {
  id: string;
  entityId: string;
  entityType: EntityType | string;
  userId: string;
  reaction: ReactionType | string;
  createdAt: string;
}
