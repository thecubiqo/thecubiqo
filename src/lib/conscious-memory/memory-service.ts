/**
 * Conscious Memory Service
 * Manages persistent memory that transcends chat sessions
 */

import type {
  Memory,
  MemoryType,
  MemoryImportance,
  MemoryQuery,
  MemorySearchResult,
  MemoryExtraction,
  CreateMemoryInput,
} from './types';

export class ConsciousMemoryService {
  /**
   * Extract potential memories from conversation
   */
  static async extractFromConversation(
    messages: Array<{ role: string; content: string }>,
    aiModel: any
  ): Promise<MemoryExtraction> {
    const prompt = this.buildExtractionPrompt(messages);

    try {
      const response = await aiModel.generateText({
        prompt,
        temperature: 0.3,
      });

      const extraction = JSON.parse(response);
      return extraction;
    } catch (error) {
      
      return {
        potential: [],
        needsConfirmation: false,
      };
    }
  }

  /**
   * Build prompt for memory extraction
   */
  private static buildExtractionPrompt(
    messages: Array<{ role: string; content: string }>
  ): string {
    const conversation = messages
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');

    return `Analyze this conversation and extract memories worth remembering long-term.

Conversation:
${conversation}

Extract memories following these categories:
- **factual**: Facts about the user (name, location, job, etc.)
- **preference**: Preferences, likes, dislikes
- **emotional**: Significant emotional moments or connections
- **goal**: Goals, aspirations, things they want to achieve
- **relationship**: Important people in their life
- **context**: Important context about their situation

For each memory, assess importance:
- **critical**: Core identity facts (name, family, major life events)
- **high**: Important preferences, goals, relationships
- **medium**: Useful context, minor preferences
- **low**: Casual mentions, temporary interests

Respond with JSON:
{
  "potential": [
    {
      "content": "Clear, concise memory statement",
      "type": "factual|preference|emotional|goal|relationship|context",
      "importance": "critical|high|medium|low",
      "reasoning": "Why this is worth remembering"
    }
  ],
  "needsConfirmation": boolean // true if memories contain sensitive info
}

Rules:
- Only extract memories that are clearly stated or strongly implied
- Don't make assumptions or extrapolate beyond what's said
- Prefer concise, factual statements
- Skip casual small talk unless it reveals preferences
- Mark sensitive info (health, finances, relationships) for confirmation

Example:
User: "I'm a software engineer living in NYC. I love coffee but hate mornings."
→ {
  "potential": [
    {"content": "Works as a software engineer", "type": "factual", "importance": "high"},
    {"content": "Lives in NYC", "type": "factual", "importance": "high"},
    {"content": "Loves coffee", "type": "preference", "importance": "medium"},
    {"content": "Dislikes mornings", "type": "preference", "importance": "medium"}
  ],
  "needsConfirmation": false
}

Only JSON, no explanation.`;
  }

  /**
   * Search memories by semantic similarity
   */
  static async searchMemories(
    query: MemoryQuery,
    allMemories: Memory[],
    aiModel: any
  ): Promise<MemorySearchResult[]> {
    // Filter by type and importance first
    let filtered = allMemories;

    if (query.type) {
      filtered = filtered.filter(m => m.type === query.type);
    }

    if (query.tags && query.tags.length > 0) {
      filtered = filtered.filter(m =>
        query.tags!.some(tag => m.tags.includes(tag))
      );
    }

    if (query.minImportance) {
      const importanceOrder: MemoryImportance[] = ['low', 'medium', 'high', 'critical'];
      const minIndex = importanceOrder.indexOf(query.minImportance);
      filtered = filtered.filter(m => 
        importanceOrder.indexOf(m.importance) >= minIndex
      );
    }

    // Use AI to rank by relevance
    const prompt = this.buildSearchPrompt(query.query, filtered);

    try {
      const response = await aiModel.generateText({
        prompt,
        temperature: 0.2,
      });

      const results = JSON.parse(response);
      
      return results
        .map((r: any) => ({
          memory: filtered.find(m => m.id === r.memoryId)!,
          relevanceScore: r.score,
          reason: r.reason,
        }))
        .filter((r: any) => r.memory)
        .slice(0, query.limit || 10);

    } catch (error) {
      
      // Fallback: simple text matching
      return filtered
        .map(memory => ({
          memory,
          relevanceScore: this.simpleRelevanceScore(query.query, memory),
          reason: 'Text match',
        }))
        .filter(r => r.relevanceScore > 0)
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, query.limit || 10);
    }
  }

  /**
   * Build prompt for semantic search
   */
  private static buildSearchPrompt(query: string, memories: Memory[]): string {
    const memoryList = memories
      .map((m, i) => `${i}. [${m.type}] ${m.content} (ID: ${m.id})`)
      .join('\n');

    return `You are searching memories for relevance to a query.

Query: "${query}"

Available memories:
${memoryList}

Rank these memories by relevance to the query. Return JSON array:
[
  {
    "memoryId": "memory-id",
    "score": 0.0-1.0,
    "reason": "why relevant"
  }
]

Only include memories with score > 0.3. Sort by score descending.
Only JSON, no explanation.`;
  }

  /**
   * Simple text-based relevance scoring
   */
  private static simpleRelevanceScore(query: string, memory: Memory): number {
    const queryLower = query.toLowerCase();
    const contentLower = memory.content.toLowerCase();
    const tagsLower = memory.tags.map(t => t.toLowerCase());

    let score = 0;

    // Exact phrase match
    if (contentLower.includes(queryLower)) {
      score += 0.8;
    }

    // Word matches
    const queryWords = queryLower.split(/\s+/);
    const contentWords = contentLower.split(/\s+/);
    const matchingWords = queryWords.filter(w => contentWords.includes(w));
    score += (matchingWords.length / queryWords.length) * 0.4;

    // Tag matches
    const matchingTags = queryWords.filter(w => tagsLower.includes(w));
    score += (matchingTags.length / queryWords.length) * 0.3;

    // Importance bonus
    const importanceBonus = {
      critical: 0.2,
      high: 0.1,
      medium: 0.05,
      low: 0,
    };
    score += importanceBonus[memory.importance];

    return Math.min(score, 1.0);
  }

  /**
   * Find related memories (clustering)
   */
  static async findRelatedMemories(
    memory: Memory,
    allMemories: Memory[],
    aiModel: any
  ): Promise<Memory[]> {
    // Filter out the memory itself
    const candidates = allMemories.filter(m => m.id !== memory.id);

    // Use AI to find semantic connections
    const prompt = `Find memories related to this one:

Target memory: "${memory.content}"

Candidate memories:
${candidates.map((m, i) => `${i}. ${m.content} (ID: ${m.id})`).join('\n')}

Return JSON array of related memory IDs with reasoning:
[
  {
    "memoryId": "id",
    "reason": "why related"
  }
]

Only include memories that are semantically or contextually related.
Only JSON, no explanation.`;

    try {
      const response = await aiModel.generateText({
        prompt,
        temperature: 0.3,
      });

      const related = JSON.parse(response);
      
      return related
        .map((r: any) => candidates.find(m => m.id === r.memoryId))
        .filter((m: any) => m);

    } catch (error) {
      
      
      // Fallback: tag-based similarity
      return candidates
        .filter(m => 
          m.tags.some(tag => memory.tags.includes(tag)) ||
          m.type === memory.type
        )
        .slice(0, 5);
    }
  }

  /**
   * Generate memory context for chat
   */
  static buildMemoryContext(memories: Memory[]): string {
    if (memories.length === 0) {
      return '';
    }

    const byType = memories.reduce((acc, m) => {
      if (!acc[m.type]) acc[m.type] = [];
      acc[m.type].push(m);
      return acc;
    }, {} as Record<MemoryType, Memory[]>);

    let context = '\n\n## CONSCIOUS MEMORY\n';
    context += 'What you remember about this person:\n\n';

    const typeLabels: Record<MemoryType, string> = {
      factual: '📋 Facts',
      preference: '❤️ Preferences',
      emotional: '💭 Emotional Moments',
      goal: '🎯 Goals',
      relationship: '👥 Relationships',
      context: '🌍 Context',
    };

    for (const [type, typeMemories] of Object.entries(byType)) {
      context += `### ${typeLabels[type as MemoryType]}\n`;
      for (const memory of typeMemories) {
        context += `- ${memory.content}\n`;
      }
      context += '\n';
    }

    context += 'Use these memories naturally. Don\'t recite them - show that you remember through your responses.\n';

    return context;
  }

  /**
   * Update memory access tracking
   */
  static trackAccess(memory: Memory): Partial<Memory> {
    return {
      lastAccessed: new Date().toISOString(),
      accessCount: memory.accessCount + 1,
    };
  }

  /**
   * Suggest memory importance adjustments
   */
  static async suggestImportanceUpdate(
    memory: Memory,
    aiModel: any
  ): Promise<MemoryImportance | null> {
    const prompt = `Assess if this memory's importance should change based on access patterns:

Memory: "${memory.content}"
Current importance: ${memory.importance}
Access count: ${memory.accessCount}
Last accessed: ${memory.lastAccessed}
Age: ${Math.floor((Date.now() - new Date(memory.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days

Should importance be adjusted? Consider:
- High access count → may be more important
- Never accessed + old → may be less important
- Core facts should stay critical
- Preferences may change over time

Respond with JSON:
{
  "newImportance": "critical|high|medium|low" or null,
  "reasoning": "why or why not"
}

Only JSON, no explanation.`;

    try {
      const response = await aiModel.generateText({
        prompt,
        temperature: 0.3,
      });

      const result = JSON.parse(response);
      return result.newImportance;

    } catch (error) {
      
      return null;
    }
  }
}
