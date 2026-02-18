import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ExpressInterestRequest } from '@/types/rgy-matching';

/**
 * POST /api/rgy/opportunities/express-interest
 * Express interest in an opportunity
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

    const body: ExpressInterestRequest = await request.json();
    const { opportunity_id } = body;

    if (!opportunity_id) {
      return NextResponse.json(
        { error: 'Opportunity ID is required' },
        { status: 400 }
      );
    }

    // Verify opportunity exists and is active
    const { data: opportunity, error: oppError } = await supabase
      .from('opportunities')
      .select('*')
      .eq('id', opportunity_id)
      .single();

    if (oppError || !opportunity) {
      return NextResponse.json(
        { error: 'Opportunity not found' },
        { status: 404 }
      );
    }

    if (!opportunity.is_active) {
      return NextResponse.json(
        { error: 'Opportunity is no longer active' },
        { status: 400 }
      );
    }

    // Check if opportunity is expired
    if (opportunity.expires_at && new Date(opportunity.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Opportunity has expired' },
        { status: 400 }
      );
    }

    // Check if match already exists
    const { data: existingMatch } = await supabase
      .from('matches')
      .select('*')
      .eq('user_id', user.id)
      .eq('opportunity_id', opportunity_id)
      .single();

    if (existingMatch) {
      // Update existing match status to 'interested'
      const { data, error } = await supabase
        .from('matches')
        .update({ status: 'interested', updated_at: new Date().toISOString() })
        .eq('id', existingMatch.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating match:', error);
        return NextResponse.json(
          { error: 'Failed to express interest' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        match: data,
        message: 'Interest updated successfully',
      });
    } else {
      // Create new match with 'interested' status
      const { data, error } = await supabase
        .from('matches')
        .insert({
          user_id: user.id,
          opportunity_id,
          status: 'interested',
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating match:', error);
        return NextResponse.json(
          { error: 'Failed to express interest' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        match: data,
        message: 'Interest expressed successfully',
      }, { status: 201 });
    }
  } catch (error) {
    console.error('Error in POST /api/rgy/opportunities/express-interest:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
