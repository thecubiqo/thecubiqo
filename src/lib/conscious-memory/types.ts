/**
 * Type definitions for Conscious Mind Memory system
 * Persistent memory that transcends sessions
 */

export type MemoryType = 
  | 'factual'      // Facts about the user
  | 'preference'   // User preferences
  | 'emotional'    // Emotional moments/connections
  | 'goal'         // User goals and aspirations
  | 'relationship' // People and relationships
  | 'context';     // Contextual information

export type MemoryImportance = 'low' | 'medium' | 'high' | 'critical';

export interface Memory {
  id: string;
  userId: string;
  type: MemoryType;
  content: string;
  importance: MemoryImportance;
  context?: string; // When/where this memory was formed
  tags: string[];
  relatedMemories: string[]; // IDs of related memories
  sourceConversationId?: string;
  sourceMessageId?: string;
  verified: boolean; // Has user confirmed this?
  lastAccessed: string;
  accessCount: number;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string; // For temporary memories
}

export interface MemoryCluster {
  id: string;
  name: string;
  description: string;
  memoryIds: string[];
  importance: MemoryImportance;
  createdAt: string;
  updatedAt: string;
}

export interface MemoryQuery {
  query: string;
  type?: MemoryType;
  tags?: string[];
  minImportance?: MemoryImportance;
  limit?: number;
}

export interface MemorySearchResult {
  memory: Memory;
  relevanceScore: number;
  reason: string;
}

export interface MemoryStats {
  totalMemories: number;
  byType: Record<MemoryType, number>;
  byImportance: Record<MemoryImportance, number>;
  mostAccessed: Memory[];
  recentlyCreated: Memory[];
  clusters: MemoryCluster[];
}

export interface CreateMemoryInput {
  type: MemoryType;
  content: string;
  importance?: MemoryImportance;
  context?: string;
  tags?: string[];
  sourceConversationId?: string;
  sourceMessageId?: string;
  expiresAt?: string;
}

export interface UpdateMemoryInput {
  content?: string;
  importance?: MemoryImportance;
  tags?: string[];
  verified?: boolean;
}

/**
 * Memory extraction from conversations
 */
export interface MemoryExtraction {
  potential: Array<{
    content: string;
    type: MemoryType;
    importance: MemoryImportance;
    reasoning: string;
  }>;
  needsConfirmation: boolean;
}
