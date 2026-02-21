/**
 * Memory Service - Semantic memory storage and retrieval
 * 
 * Uses OpenAI embeddings + Supabase pgvector for semantic similarity search
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { ENV } from '@/lib/config/env'

// Initialize clients
const supabase = createClient(
  ENV.supabase.url || 'https://placeholder.supabase.co',
  ENV.supabase.serviceRoleKey || 'placeholder-key'
);
const openai = ENV.ai.openai ? new OpenAI({ apiKey: ENV.ai.openai }) : null;

// Types
export interface Memory {
  id: string;
  agent_id: string;
  content: string;
  embedding?: number[];
  metadata?: Record<string, any>;
  created_at: string;
}

export interface MemorySearchResult extends Memory {
  similarity: number;
}

export interface StoreMemoryOptions {
  metadata?: Record<string, any>;
  skipEmbedding?: boolean;
}

export interface SearchMemoryOptions {
  limit?: number;
  threshold?: number;
  metadata?: Record<string, any>;
}

/**
 * Generate embeddings using OpenAI
 */
async function generateEmbedding(text: string): Promise<number[]> {
  if (!openai) {
    throw new Error('OpenAI client not initialized. Set OPENAI_API_KEY environment variable.');
  }

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });

  return response.data[0].embedding;
}

/**
 * Store a memory with semantic embedding
 */
export async function storeMemory(
  agentId: string,
  content: string,
  options: StoreMemoryOptions = {}
): Promise<Memory> {
  if (!supabase) {
    throw new Error('Supabase client not initialized. Configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY1.');
  }

  const { metadata, skipEmbedding } = options;

  // Generate embedding unless skipped
  let embedding: number[] | null = null;
  if (!skipEmbedding) {
    try {
      embedding = await generateEmbedding(content);
    } catch (error) {

      // Continue without embedding - still store the content
    }
  }

  // Store in database
  const { data, error } = await supabase
    .from('memories')
    .insert({
      agent_id: agentId,
      content,
      embedding,
      metadata: metadata || {},
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to store memory: ${error.message}`);
  }

  return data;
}

/**
 * Search memories using semantic similarity
 */
export async function searchMemory(
  agentId: string,
  query: string,
  options: SearchMemoryOptions = {}
): Promise<MemorySearchResult[]> {
  if (!supabase) {
    throw new Error('Supabase client not initialized. Configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY1.');
  }

  const { limit = 10, threshold = 0.7, metadata } = options;

  // Generate query embedding
  let queryEmbedding: number[];
  try {
    queryEmbedding = await generateEmbedding(query);
  } catch (error) {

    throw error;
  }

  // Perform vector similarity search
  // Using RPC function for pgvector similarity search
  const { data, error } = await supabase.rpc('search_memories', {
    query_agent_id: agentId,
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: limit,
  });

  if (error) {
    // If RPC function doesn't exist, fall back to manual search

    return fallbackSearch(agentId, queryEmbedding, limit, threshold);
  }

  return data || [];
}

/**
 * Fallback search using manual cosine similarity calculation
 */
async function fallbackSearch(
  agentId: string,
  queryEmbedding: number[],
  limit: number,
  threshold: number
): Promise<MemorySearchResult[]> {
  if (!supabase) {
    throw new Error('Supabase client not initialized.');
  }

  // Get all memories for this agent
  const { data: memories, error } = await supabase
    .from('memories')
    .select('*')
    .eq('agent_id', agentId)
    .not('embedding', 'is', null);

  if (error || !memories) {
    throw new Error(`Failed to fetch memories: ${error?.message}`);
  }

  // Calculate cosine similarity manually
  const results: MemorySearchResult[] = memories
    .map((memory) => {
      const similarity = cosineSimilarity(queryEmbedding, memory.embedding);
      return {
        ...memory,
        similarity,
      };
    })
    .filter((result) => result.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  return results;
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Get all memories for an agent (without semantic search)
 */
export async function getMemories(
  agentId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<Memory[]> {
  if (!supabase) {
    throw new Error('Supabase client not initialized.');
  }

  const { limit = 100, offset = 0 } = options;

  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Failed to fetch memories: ${error.message}`);
  }

  return data || [];
}

/**
 * Delete a specific memory
 */
export async function deleteMemory(memoryId: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase client not initialized.');
  }

  const { error } = await supabase
    .from('memories')
    .delete()
    .eq('id', memoryId);

  if (error) {
    throw new Error(`Failed to delete memory: ${error.message}`);
  }
}

/**
 * Delete all memories for an agent
 */
export async function clearMemories(agentId: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase client not initialized.');
  }

  const { error } = await supabase
    .from('memories')
    .delete()
    .eq('agent_id', agentId);

  if (error) {
    throw new Error(`Failed to clear memories: ${error.message}`);
  }
}
