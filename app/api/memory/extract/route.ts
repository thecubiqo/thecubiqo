/**
 * Memory Extraction API Route
 * Extract potential memories from conversation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ConsciousMemoryService } from '@/lib/conscious-memory/memory-service';
import { routeAIRequest } from '@/lib/ai/router';

/**
 * POST /api/memory/extract
 * Extract memories from conversation
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = (await createClient()) as any;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { messages, conversationId, autoSave } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array required' },
        { status: 400 }
      );
    }

    // Create AI model wrapper
    const aiModel = {
      generateText: async ({ prompt }: any) => {
        const result = await routeAIRequest({
          systemPrompt: prompt,
          messages: [],
          forceCloud: true, // Use cloud for extraction accuracy
          preferredCloud: 'openclaw',
        });
        return result.content || '{}';
      },
    };

    // Extract memories
    const extraction = await ConsciousMemoryService.extractFromConversation(
      messages,
      aiModel
    );

    // If autoSave and no confirmation needed, save immediately
    if (autoSave && !extraction.needsConfirmation && extraction.potential.length > 0) {
      const savedMemories = [];

      for (const potential of extraction.potential) {
        const { data: memory, error } = await supabase
          .from('conscious_memories')
          .insert({
            user_id: user.id,
            type: potential.type,
            content: potential.content,
            importance: potential.importance,
            context: `Extracted from conversation`,
            tags: [],
            related_memories: [],
            source_conversation_id: conversationId,
            verified: false,
            last_accessed: new Date().toISOString(),
            access_count: 0,
          })
          .select()
          .single();

        if (!error && memory) {
          savedMemories.push(memory);
        }
      }

      return NextResponse.json({
        extraction,
        saved: savedMemories,
      });
    }

    // Otherwise, return for user confirmation
    return NextResponse.json({ extraction });

  } catch (error) {

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
