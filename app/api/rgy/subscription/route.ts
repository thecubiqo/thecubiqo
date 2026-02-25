import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { UpdateSubscriptionRequest } from '@/types/rgy-matching';

/**
 * GET /api/rgy/subscription
 * Get user's pro match subscription status
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

    const { data: subscription, error } = await supabase
      .from('pro_match_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching subscription:', error);
      return NextResponse.json(
        { error: 'Failed to fetch subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      subscription: subscription || null,
      has_subscription: !!subscription,
    });
  } catch (error) {
    console.error('Error in GET /api/rgy/subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rgy/subscription
 * Create or update user's pro match subscription
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

    const body: UpdateSubscriptionRequest = await request.json();
    const { is_active, preferences } = body;

    // Check if subscription exists
    const { data: existingSubscription } = await supabase
      .from('pro_match_subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existingSubscription) {
      // Update existing subscription
      const updateData: any = { updated_at: new Date().toISOString() };
      if (is_active !== undefined) updateData.is_active = is_active;
      if (preferences) updateData.preferences = preferences;

      const { data, error } = await supabase
        .from('pro_match_subscriptions')
        .update(updateData)
        .eq('id', existingSubscription.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating subscription:', error);
        return NextResponse.json(
          { error: 'Failed to update subscription' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        subscription: data,
        message: 'Subscription updated successfully',
      });
    } else {
      // Create new subscription
      const { data, error } = await supabase
        .from('pro_match_subscriptions')
        .insert({
          user_id: user.id,
          is_active: is_active !== undefined ? is_active : true,
          subscription_tier: 'free',
          preferences: preferences || {},
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating subscription:', error);
        return NextResponse.json(
          { error: 'Failed to create subscription' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        subscription: data,
        message: 'Subscription created successfully',
      }, { status: 201 });
    }
  } catch (error) {
    console.error('Error in POST /api/rgy/subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
