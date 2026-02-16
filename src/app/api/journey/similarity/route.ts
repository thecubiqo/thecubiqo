/**
 * Journey Memory Similarity API
 * Computes similarity percentage for query→memory match
 * Feature: Behind journey_memory feature flag
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

// Initialize OpenAI client (if available)
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

interface SimilarityRequest {
  query: string;
  category?: string;
  threshold?: number;
  limit?: number;
}

interface SimilarityResult {
  id: string;
  content: string;
  summary: string | null;
  category: string | null;
  importance_score: number;
  similarity: number;
  similarity_percentage: number;
  metadata: any;
  created_at: string;
}

interface SimilarityResponse {
  results: SimilarityResult[];
  query: string;
  count: number;
  maxSimilarity: number;
  avgSimilarity: number;
  featureEnabled: boolean;
  userOptedIn: boolean;
}

/**
 * Check if journey memory feature is enabled
 */
async function isFeatureEnabled(supabase: any): Promise<boolean> {
  const { data, error } = await supabase
    .from('feature_flags')
    .select('enabled')
    .eq('name', 'journey_memory')
    .single();

  if (error) {
    console.error('[Journey] Feature flag check error:', error);
    return false;
  }

  return data?.enabled || false;
}

/**
 * Check if user has opted in to journey memory
 */
async function isUserOptedIn(supabase: any, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('journey_consents')
    .select('opted_in')
    .eq('user_id', userId)
    .is('revoked_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    // No consent record means not opted in
    return false;
  }

  return data?.opted_in || false;
}

/**
 * Generate text embedding using OpenAI
 */
async function generateEmbedding(text: string): Promise<number[]> {
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });

  return response.data[0].embedding;
}

/**
 * POST /api/journey/similarity
 * Find similar memories using vector embeddings
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if feature is enabled
    const featureEnabled = await isFeatureEnabled(supabase);
    if (!featureEnabled) {
      return NextResponse.json(
        { 
          error: 'Journey memory feature is not enabled',
          featureEnabled: false,
          userOptedIn: false,
        },
        { status: 403 }
      );
    }

    // Check if user has opted in
    const userOptedIn = await isUserOptedIn(supabase, user.id);
    if (!userOptedIn) {
      return NextResponse.json(
        { 
          error: 'User has not opted in to journey memory',
          featureEnabled: true,
          userOptedIn: false,
        },
        { status: 403 }
      );
    }

    // Parse request body
    const body: SimilarityRequest = await request.json();
    const { 
      query, 
      category = null, 
      threshold = 0.5, 
      limit = 10 
    } = body;

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(query);

    // Search for similar memories using database function
    const { data: memories, error: searchError } = await (supabase as any).rpc(
      'search_journey_memories',
      {
        query_embedding: JSON.stringify(queryEmbedding),
        query_user_id: user.id,
        match_threshold: threshold,
        match_count: limit,
        filter_category: category,
      }
    );

    if (searchError) {
      console.error('[Journey/Similarity] Search error:', searchError);
      return NextResponse.json(
        { error: 'Failed to search memories', details: searchError.message },
        { status: 500 }
      );
    }

    const results: SimilarityResult[] = (Array.isArray(memories) ? memories : []).map((memory: any) => ({
      id: memory.id,
      content: memory.content,
      summary: memory.summary,
      category: memory.category,
      importance_score: memory.importance_score,
      similarity: memory.similarity,
      similarity_percentage: Math.round(memory.similarity * 100),
      metadata: memory.metadata,
      created_at: memory.created_at,
    }));

    // Calculate aggregate statistics
    const count = results.length;
    const maxSimilarity = count > 0 ? Math.max(...results.map(r => r.similarity)) : 0;
    const avgSimilarity = count > 0 
      ? results.reduce((sum, r) => sum + r.similarity, 0) / count 
      : 0;

    const response: SimilarityResponse = {
      results,
      query,
      count,
      maxSimilarity: Math.round(maxSimilarity * 100) / 100,
      avgSimilarity: Math.round(avgSimilarity * 100) / 100,
      featureEnabled: true,
      userOptedIn: true,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[Journey/Similarity] Error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        featureEnabled: false,
        userOptedIn: false,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/journey/similarity
 * Get feature status
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user (optional for status check)
    const { data: { user } } = await supabase.auth.getUser();

    // Check if feature is enabled
    const featureEnabled = await isFeatureEnabled(supabase);
    
    let userOptedIn = false;
    if (user) {
      userOptedIn = await isUserOptedIn(supabase, user.id);
    }

    return NextResponse.json({
      featureEnabled,
      userOptedIn,
      authenticated: !!user,
    });

  } catch (error) {
    console.error('[Journey/Similarity] Status check error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        featureEnabled: false,
        userOptedIn: false,
      },
      { status: 500 }
    );
  }
}
