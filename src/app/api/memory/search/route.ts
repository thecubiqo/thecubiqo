/**
 * Memory Search API Route
 * Semantic search across agent memories with filtering
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
)

const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

interface MemorySearchParams {
  query?: string
  agentId?: string
  startDate?: string
  endDate?: string
  limit?: number
  threshold?: number
}

async function generateEmbedding(text: string): Promise<number[]> {
  if (!openai) {
    throw new Error('OpenAI API key not configured')
  }

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })

  return response.data[0].embedding
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same length')
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query')
    const agentId = searchParams.get('agentId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50')
    const threshold = parseFloat(searchParams.get('threshold') || '0.5')

    // Build base query
    let dbQuery = supabaseAdmin
      .from('memories')
      .select('id, agent_id, content, metadata, created_at')
      .order('created_at', { ascending: false })

    // Apply filters
    if (agentId) {
      dbQuery = dbQuery.eq('agent_id', agentId)
    }

    if (startDate) {
      dbQuery = dbQuery.gte('created_at', startDate)
    }

    if (endDate) {
      dbQuery = dbQuery.lte('created_at', endDate)
    }

    // If semantic search query provided
    if (query && openai) {
      try {
        const queryEmbedding = await generateEmbedding(query)

        // First try RPC function
        const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('search_memories', {
          query_embedding: queryEmbedding,
          match_threshold: threshold,
          match_count: limit,
          filter_agent_id: agentId || null,
          filter_start_date: startDate || null,
          filter_end_date: endDate || null,
        })

        if (!rpcError && rpcData) {
          return NextResponse.json({
            results: rpcData,
            method: 'semantic',
            query,
          })
        }

        // Fallback to manual search
        console.log('[Memory Search] RPC not available, using fallback')
        
        // Get all memories with embeddings
        const { data: memories, error } = await dbQuery
          .not('embedding', 'is', null)
          .limit(1000) // Reasonable limit for client-side processing

        if (error) {
          throw new Error(`Database query failed: ${error.message}`)
        }

        if (!memories || memories.length === 0) {
          return NextResponse.json({
            results: [],
            method: 'semantic-fallback',
            query,
          })
        }

        // Calculate similarity scores
        type MemoryWithEmbedding = { id: string; agent_id: string; content: string; metadata: unknown; created_at: string; embedding: number[] };
        const results = (memories as MemoryWithEmbedding[])
          .map((memory) => {
            const similarity = cosineSimilarity(queryEmbedding, memory.embedding)
            return {
              id: memory.id,
              agent_id: memory.agent_id,
              content: memory.content,
              metadata: memory.metadata,
              created_at: memory.created_at,
              similarity,
            }
          })
          .filter((result) => result.similarity >= threshold)
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, limit)

        return NextResponse.json({
          results,
          method: 'semantic-fallback',
          query,
        })

      } catch (embedError) {
        console.error('[Memory Search] Embedding failed, falling back to text search:', embedError)
        // Fall through to text search
      }
    }

    // Fallback: simple text search or get all
    if (query) {
      dbQuery = dbQuery.ilike('content', `%${query}%`)
    }

    dbQuery = dbQuery.limit(limit)

    const { data: memories, error } = await dbQuery

    if (error) {
      throw new Error(`Database query failed: ${error.message}`)
    }

    return NextResponse.json({
      results: memories || [],
      method: query ? 'text-search' : 'all',
      query: query || null,
    })

  } catch (error) {
    console.error('[API/memory/search] Error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        results: [],
      },
      { status: 500 }
    )
  }
}

// Handle POST for semantic search with body
export async function POST(request: NextRequest) {
  try {
    const body: MemorySearchParams = await request.json()
    const { query, agentId, startDate, endDate, limit = 50, threshold = 0.5 } = body

    // Redirect to GET with query params
    const url = new URL('/api/memory/search', request.url)
    if (query) url.searchParams.set('query', query)
    if (agentId) url.searchParams.set('agentId', agentId)
    if (startDate) url.searchParams.set('startDate', startDate)
    if (endDate) url.searchParams.set('endDate', endDate)
    url.searchParams.set('limit', limit.toString())
    url.searchParams.set('threshold', threshold.toString())

    const response = await fetch(url, { method: 'GET' })
    const data = await response.json()
    
    return NextResponse.json(data)

  } catch (error) {
    console.error('[API/memory/search] POST Error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        results: [],
      },
      { status: 500 }
    )
  }
}
