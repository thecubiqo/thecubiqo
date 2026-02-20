/**
 * RGY Intelligent Matching Service
 * AI-powered opportunity discovery for users with active pro match subscriptions
 */

import { createClient } from '@/lib/supabase/server';
import type { DiscoveryResult, UserIntent, Opportunity, ProMatchSubscription } from '@/types/rgy-matching';

/**
 * Run opportunity discovery for a single user
 * Called by background job or on-demand
 */
export async function runOpportunityDiscoveryForUser(userId: string): Promise<DiscoveryResult[]> {
  const supabase = await createClient();

  try {
    // Check if user has an active pro match subscription
    const { data: subscription, error: subError } = await (supabase as any)
      .from('pro_match_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (subError || !subscription) {
      console.log(`User ${userId} does not have an active pro match subscription`);
      return [];
    }

    // Get user's active intents
    const { data: intents, error: intentsError } = await (supabase as any)
      .from('user_intents')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (intentsError || !intents || intents.length === 0) {
      console.log(`User ${userId} has no active intents`);
      return [];
    }

    // Discover opportunities for each intent
    const allDiscoveries: DiscoveryResult[] = [];

    for (const intent of (intents || []) as any[]) {
      const discoveries = await findOpportunitiesForIntent(userId, intent as any, subscription as any);

      // Tag each discovery with the correct intent_id
      const taggedDiscoveries = discoveries.map(d => ({
        ...d,
        intent_id: intent.id
      }));

      allDiscoveries.push(...taggedDiscoveries);
    }

    // Remove duplicates and sort by similarity score
    const uniqueDiscoveries = Array.from(
      new Map(allDiscoveries.map(item => [item.opportunity_id, item])).values()
    ).sort((a, b) => b.similarity_score - a.similarity_score);

    // Limit based on subscription preferences
    const maxSuggestions = (subscription as any).preferences?.max_suggestions || 10;
    const topDiscoveries = uniqueDiscoveries.slice(0, maxSuggestions);

    // Update last discovery run timestamp
    await (supabase as any)
      .from('pro_match_subscriptions')
      .update({ last_discovery_run: new Date().toISOString() })
      .eq('user_id', userId);

    // Save discovered matches to database
    for (const discovery of topDiscoveries) {
      await saveDiscoveryAsMatch(userId, discovery, (discovery as any).intent_id);
    }

    console.log(`Discovered ${topDiscoveries.length} opportunities for user ${userId}`);
    return topDiscoveries;
  } catch (error) {
    console.error(`Error running opportunity discovery for user ${userId}:`, error);
    return [];
  }
}

/**
 * Find opportunities matching a specific user intent
 */
async function findOpportunitiesForIntent(
  userId: string,
  intent: UserIntent | any,
  subscription: ProMatchSubscription | any
): Promise<DiscoveryResult[]> {
  const supabase = await createClient();

  try {
    // Use the database function for vector similarity search
    const { data: matches, error } = await (supabase as any)
      .rpc('find_matching_opportunities', {
        p_user_id: userId,
        p_rgy_context: (intent as any).rgy_context,
        p_limit: 20, // Get more candidates for filtering
      });

    if (error || !matches || matches.length === 0) {
      return [];
    }

    // Fetch full opportunity details
    const opportunityIds = (matches || []).map((m: any) => m.opportunity_id);
    const { data: opportunities, error: oppError } = await (supabase as any)
      .from('opportunities')
      .select('*')
      .in('id', opportunityIds);

    if (oppError || !opportunities) {
      return [];
    }

    // Transform to DiscoveryResult format
    const discoveries: DiscoveryResult[] = []

    // Extraction of geo-context (lat/lng/radius)
    const context = (subscription as any).preferences?.geo_context
    const userLat = context?.lat
    const userLng = context?.lng
    const maxRadius = context?.radius || 10000 // default 10km

    for (const opp of opportunities) {
      const match = matches.find((m: any) => m.opportunity_id === opp.id)

      // Geo-filter logic
      if (userLat && userLng && opp.metadata?.coordinates) {
        const { lat, lng } = opp.metadata.coordinates
        const distance = calculateDistance(userLat, userLng, lat, lng)
        if (distance > maxRadius) continue
      }

      // [INTELLIGENCE UPGRADE] Founder Reasoning (DeepSeek R1 Simulation)
      const similarity = parseFloat(match?.similarity_score || '0')
      const founderReasoning = similarity > 0.8
        ? "High strategic alignment. Low entry barrier with high ROI potential."
        : "Market gap detected. Recommended for pivot or side-vertical expansion.";

      discoveries.push({
        opportunity_id: (opp as any).id,
        title: (opp as any).title,
        description: (opp as any).description,
        similarity_score: similarity,
        rgy_context: (opp as any).rgy_context,
        opportunity_type: (opp as any).opportunity_type,
        keywords: (opp as any).keywords,
        metadata: {
          ...(opp as any).metadata,
          founder_reasoning: founderReasoning
        },
      })
    }

    return discoveries
  } catch (error) {
    console.error(`Error finding opportunities for intent ${intent.id}:`, error)
    return []
  }
}

/**
 * Calculate distance between two points in meters (Haversine)
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3 // Earth radius
  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lon2 - lon1) * Math.PI / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

/**
 * Save a discovered opportunity as a match record
 */
async function saveDiscoveryAsMatch(
  userId: string,
  discovery: DiscoveryResult,
  intentId: string
): Promise<void> {
  const supabase = await createClient();

  try {
    // Check if match already exists
    const { data: existingMatch } = await (supabase as any)
      .from('matches')
      .select('id, status')
      .eq('user_id', userId)
      .eq('opportunity_id', discovery.opportunity_id)
      .single();

    if (existingMatch) {
      // Only update if it's still in 'suggested' state (don't override user actions)
      if (existingMatch.status === 'suggested') {
        await (supabase as any)
          .from('matches')
          .update({
            similarity_score: discovery.similarity_score,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingMatch.id);
      }
    } else {
      // Create new match record
      await (supabase as any)
        .from('matches')
        .insert({
          user_id: userId,
          opportunity_id: discovery.opportunity_id,
          intent_id: intentId,
          similarity_score: discovery.similarity_score,
          status: 'suggested',
        });
    }
  } catch (error) {
    console.error(`Error saving match for user ${userId}, opportunity ${discovery.opportunity_id}:`, error);
  }
}

/**
 * Run opportunity discovery for all active pro match subscribers
 * This should be called by a cron job or background worker
 */
export async function runOpportunityDiscoveryForAllUsers(): Promise<{
  total: number;
  successful: number;
  failed: number;
}> {
  const supabase = await createClient();

  const results = {
    total: 0,
    successful: 0,
    failed: 0,
  };

  try {
    // Get all users with active pro match subscriptions
    const { data: subscriptions, error } = await (supabase as any)
      .from('pro_match_subscriptions')
      .select('user_id, preferences, last_discovery_run')
      .eq('is_active', true);

    if (error || !subscriptions) {
      console.error('Error fetching pro match subscriptions:', error);
      return results;
    }

    results.total = subscriptions.length;
    console.log(`Running opportunity discovery for ${results.total} users`);

    // Process each user
    for (const subscription of subscriptions) {
      try {
        // Check if it's time to run discovery based on frequency preference
        const shouldRun = shouldRunDiscovery(
          subscription.last_discovery_run,
          subscription.preferences?.discovery_frequency || 'weekly'
        );

        if (!shouldRun) {
          console.log(`Skipping user ${subscription.user_id} - not time yet`);
          continue;
        }

        const discoveries = await runOpportunityDiscoveryForUser(subscription.user_id);

        if (discoveries.length > 0) {
          results.successful++;

          // Send notification if enabled
          if (subscription.preferences?.notification_enabled) {
            await sendDiscoveryNotification(subscription.user_id, discoveries.length);
          }
        }
      } catch (error) {
        console.error(`Error processing user ${subscription.user_id}:`, error);
        results.failed++;
      }
    }

    console.log(`Discovery complete: ${results.successful} successful, ${results.failed} failed out of ${results.total}`);
    return results;
  } catch (error) {
    console.error('Error in runOpportunityDiscoveryForAllUsers:', error);
    return results;
  }
}

/**
 * Determine if discovery should run based on last run time and frequency preference
 */
function shouldRunDiscovery(
  lastRun: string | null | undefined,
  frequency: 'daily' | 'weekly' | 'monthly'
): boolean {
  if (!lastRun) {
    return true; // First time, always run
  }

  const lastRunDate = new Date(lastRun);
  const now = new Date();
  const hoursSinceLastRun = (now.getTime() - lastRunDate.getTime()) / (1000 * 60 * 60);

  switch (frequency) {
    case 'daily':
      return hoursSinceLastRun >= 24;
    case 'weekly':
      return hoursSinceLastRun >= 24 * 7;
    case 'monthly':
      return hoursSinceLastRun >= 24 * 30;
    default:
      return hoursSinceLastRun >= 24 * 7; // Default to weekly
  }
}

/**
 * Send a notification to the user about discovered opportunities
 * This is a placeholder - implement with your notification system
 */
async function sendDiscoveryNotification(userId: string, count: number): Promise<void> {
  // TODO: Implement notification system
  // This could send an email, push notification, or in-app notification
  console.log(`Would send notification to user ${userId}: ${count} new opportunities discovered`);
}

/**
 * Generate opportunities using AI
 * This function can be called to create new opportunities based on trending topics,
 * user demand, or external data sources
 */
export async function generateOpportunitiesWithAI(
  rgyContext: 'red' | 'yellow' | 'green',
  count: number = 5
): Promise<Opportunity[]> {
  // TODO: Implement AI-powered opportunity generation
  // This could use GPT-4 to create relevant opportunities based on:
  // - Trending keywords in user intents
  // - External events/news
  // - Seasonal themes
  // - Community feedback

  console.log(`Would generate ${count} opportunities for ${rgyContext} context using AI`);
  return [];
}
