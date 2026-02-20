import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DiscoverOpportunitiesRequest } from '@/types/rgy-matching';

/**
 * POST /api/rgy/opportunities/discover
 * Discover opportunities matching user's intents using AI-powered vector similarity
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: DiscoverOpportunitiesRequest = await request.json();
    const { rgy_context, limit = 10 } = body;

    // Validate limit
    if (limit < 1 || limit > 50) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 50' },
        { status: 400 }
      );
    }

    // If rgy_context is provided, validate it
    if (rgy_context && !['red', 'yellow', 'green'].includes(rgy_context)) {
      return NextResponse.json(
        { error: 'Invalid RGY context' },
        { status: 400 }
      );
    }

    // Get user's intents
    let intentsQuery = supabase
      .from('user_intents')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (rgy_context) {
      intentsQuery = intentsQuery.eq('rgy_context', rgy_context);
    }

    const { data: intents, error: intentsError } = await intentsQuery;

    if (intentsError) {
      console.error('Error fetching user intents:', intentsError);
      return NextResponse.json(
        { error: 'Failed to fetch user intents' },
        { status: 500 }
      );
    }

    if (!intents || intents.length === 0) {
      return NextResponse.json({
        success: true,
        discoveries: [],
        message: 'No active intents found. Please set your interests first.',
      });
    }

    // Discover opportunities for each intent using the database function
    const allDiscoveries = [];

    for (const intent of intents) {
      // Use the find_matching_opportunities database function
      const { data: matches, error: matchError } = await supabase
        .rpc('find_matching_opportunities', {
          p_user_id: user.id,
          p_rgy_context: intent.rgy_context,
          p_limit: limit,
        });

      if (matchError) {
        console.error('Error finding matches for intent:', matchError);
        continue;
      }

      if (matches && matches.length > 0) {
        // Fetch full opportunity details
        const opportunityIds = matches.map((m: any) => m.opportunity_id);
        const { data: opportunities, error: oppError } = await supabase
          .from('opportunities')
          .select('*')
          .in('id', opportunityIds);

        if (!oppError && opportunities) {
          // Merge opportunity details with similarity scores
          const enrichedMatches = opportunities.map((opp) => {
            const match = matches.find((m: any) => m.opportunity_id === opp.id);
            return {
              ...opp,
              similarity_score: match?.similarity_score || 0,
              intent_id: intent.id,
            };
          });

          allDiscoveries.push(...enrichedMatches);
        }
      }
    }

    // Sort by similarity score and remove duplicates
    const uniqueDiscoveries = Array.from(
      new Map(allDiscoveries.map(item => [item.id, item])).values()
    ).sort((a, b) => (b.similarity_score || 0) - (a.similarity_score || 0))
      .slice(0, limit);

    // Save matches to database for tracking
    for (const discovery of uniqueDiscoveries) {
      // Check if match already exists
      const { data: existingMatch } = await supabase
        .from('matches')
        .select('id')
        .eq('user_id', user.id)
        .eq('opportunity_id', discovery.id)
        .single();

      if (!existingMatch) {
        // Create new match record
        await supabase
          .from('matches')
          .insert({
            user_id: user.id,
            opportunity_id: discovery.id,
            intent_id: discovery.intent_id,
            similarity_score: discovery.similarity_score,
            status: 'suggested',
          });
      }
    }

    return NextResponse.json({
      success: true,
      discoveries: uniqueDiscoveries,
      count: uniqueDiscoveries.length,
    });
  } catch (error) {
    console.error('Error in POST /api/rgy/opportunities/discover:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
