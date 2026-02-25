import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SaveIntentRequest } from '@/types/rgy-matching';

/**
 * POST /api/rgy/intents
 * Save or update user intents and keywords for RGY matching
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = (await createClient()) as any;

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: SaveIntentRequest = await request.json();
    const { rgy_context, keywords, intent_description } = body;

    // Validate input
    if (!rgy_context || !['red', 'yellow', 'green'].includes(rgy_context)) {
      return NextResponse.json(
        { error: 'Invalid RGY context. Must be red, yellow, or green.' },
        { status: 400 }
      );
    }

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { error: 'Keywords array is required and must not be empty.' },
        { status: 400 }
      );
    }

    // Limit keywords to 50
    if (keywords.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 keywords allowed.' },
        { status: 400 }
      );
    }

    // Generate embedding for the keywords
    const embedding = await generateEmbedding(keywords.join(' ') + (intent_description ? ' ' + intent_description : ''));

    // Check if user already has an active intent for this context
    const { data: existingIntent } = await supabase
      .from('user_intents')
      .select('id')
      .eq('user_id', user.id)
      .eq('rgy_context', rgy_context)
      .eq('is_active', true)
      .single();

    if (existingIntent) {
      // Update existing intent
      const { data, error } = await supabase
        .from('user_intents')
        .update({
          keywords,
          intent_description,
          embedding,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingIntent.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating intent:', error);
        return NextResponse.json(
          { error: 'Failed to update intent' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        intent: data,
        message: 'Intent updated successfully',
      });
    } else {
      // Create new intent
      const { data, error } = await supabase
        .from('user_intents')
        .insert({
          user_id: user.id,
          rgy_context,
          keywords,
          intent_description,
          embedding,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating intent:', error);
        return NextResponse.json(
          { error: 'Failed to create intent' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        intent: data,
        message: 'Intent created successfully',
      }, { status: 201 });
    }
  } catch (error) {
    console.error('Error in POST /api/rgy/intents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/rgy/intents
 * Get user's intents across all RGY contexts
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = (await createClient()) as any;

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get specific context if provided in query params
    const { searchParams } = new URL(request.url);
    const rgy_context = searchParams.get('context');

    let query = supabase
      .from('user_intents')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (rgy_context && ['red', 'yellow', 'green'].includes(rgy_context)) {
      query = query.eq('rgy_context', rgy_context);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching intents:', error);
      return NextResponse.json(
        { error: 'Failed to fetch intents' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      intents: data || [],
    });
  } catch (error) {
    console.error('Error in GET /api/rgy/intents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/rgy/intents
 * Deactivate user's intent for a specific RGY context
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = (await createClient()) as any;

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const rgy_context = searchParams.get('context');

    if (!rgy_context || !['red', 'yellow', 'green'].includes(rgy_context)) {
      return NextResponse.json(
        { error: 'Invalid RGY context' },
        { status: 400 }
      );
    }

    // Deactivate the intent (soft delete)
    const { error } = await supabase
      .from('user_intents')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('rgy_context', rgy_context)
      .eq('is_active', true);

    if (error) {
      console.error('Error deactivating intent:', error);
      return NextResponse.json(
        { error: 'Failed to deactivate intent' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Intent deactivated successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/rgy/intents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Generate embedding for text using OpenAI
 * Falls back to null if API is not available
 */
async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    // Check if OpenAI API key is available
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('OpenAI API key not configured, skipping embedding generation');
      return null;
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: text,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return null;
  }
}
