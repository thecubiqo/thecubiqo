/**
 * Verbal Command API Route
 * Handles natural language commands for email, Twitter, Maps, Uber, WhatsApp
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCommandRouter } from '@/lib/verbal-commands/command-router';
import { routeAIRequest } from '@/lib/ai/router';
import type { OAuthTokens } from '@/lib/verbal-commands/types';

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
    const { command, confirmed, intentId } = body;

    if (!command) {
      return NextResponse.json(
        { error: 'Command required' },
        { status: 400 }
      );
    }

    // Get command router
    const router = getCommandRouter();

    // If this is a confirmation of a previous intent
    if (confirmed && intentId) {
      // Retrieve stored intent
      const { data: storedIntent } = await supabase
        .from('pending_intents')
        .select('*')
        .eq('id', intentId)
        .eq('user_id', user.id)
        .single();

      if (!storedIntent) {
        return NextResponse.json(
          { error: 'Intent not found or expired' },
          { status: 404 }
        );
      }

      // Get OAuth tokens
      const tokens = await getOAuthTokens(supabase, user.id);

      // Execute the confirmed intent
      const result = await router.executeCommand(
        storedIntent.intent,
        tokens
      );

      // Delete pending intent
      await supabase
        .from('pending_intents')
        .delete()
        .eq('id', intentId);

      return NextResponse.json({
        success: result.success,
        message: result.message,
        data: result.data,
        error: result.error,
      });
    }

    // Parse new command using AI
    const parsePrompt = buildCommandParsePrompt(command);

    const aiResult = await routeAIRequest({
      systemPrompt: parsePrompt,
      messages: [{ role: 'user', content: command }],
      forceCloud: false,
      preferredCloud: 'openclaw',
    });

    if (!aiResult.content) {
      return NextResponse.json(
        { error: 'Failed to parse command' },
        { status: 500 }
      );
    }

    // Parse AI response as JSON
    let intent;
    try {
      intent = JSON.parse(aiResult.content);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid command format' },
        { status: 400 }
      );
    }

    // Check if command requires confirmation
    if (intent.requiresConfirmation) {
      // Store intent for confirmation
      const { data: pendingIntent, error: insertError } = await supabase
        .from('pending_intents')
        .insert({
          user_id: user.id,
          intent: intent,
          description: intent.description,
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 min expiry
        })
        .select()
        .single();

      if (insertError) {

        return NextResponse.json(
          { error: 'Failed to process command' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: false,
        needsConfirmation: true,
        intentId: pendingIntent.id,
        description: intent.description,
        message: `Ready to: ${intent.description}. Confirm?`,
      });
    }

    // Check if authentication is needed
    if (intent.requiresAuth) {
      const tokens = await getOAuthTokens(supabase, user.id);

      // Check if we have the necessary token
      const needsAuth = checkAuthNeeded(intent.type, tokens);

      if (needsAuth) {
        const authUrls = router.getAuthUrls();
        return NextResponse.json({
          success: false,
          needsAuth: true,
          authUrl: authUrls[intent.type as keyof typeof authUrls],
          service: intent.type,
          message: `Please authenticate with ${intent.type} first`,
        });
      }
    }

    // Execute command
    const tokens = await getOAuthTokens(supabase, user.id);
    const result = await router.executeCommand(intent, tokens);

    return NextResponse.json({
      success: result.success,
      message: result.message,
      data: result.data,
      error: result.error,
      needsAuth: result.needsAuth,
      needsConsent: result.needsConsent,
    });

  } catch (error) {

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Build AI prompt for command parsing
 */
function buildCommandParsePrompt(command: string): string {
  return `You are a command parser. Parse this command into structured JSON:

"${command}"

Respond with JSON in this format:
{
  "type": "email|twitter|maps|uber|whatsapp",
  "action": "specific action",
  "parameters": { /* action params */ },
  "requiresAuth": boolean,
  "requiresConfirmation": boolean,
  "description": "what will be done"
}

Examples:
- "Send email to john@test.com saying hi" → {"type": "email", "action": "send", "parameters": {"to": "john@test.com", "subject": "Hi", "body": "Hi"}, "requiresAuth": true, "requiresConfirmation": true}
- "Tweet hello world" → {"type": "twitter", "action": "post", "parameters": {"text": "hello world"}, "requiresAuth": true, "requiresConfirmation": true}
- "Find coffee near me" → {"type": "maps", "action": "nearby", "parameters": {"category": "coffee"}, "requiresAuth": false, "requiresConfirmation": false}

Only JSON, no explanation.`;
}

/**
 * Get OAuth tokens for user
 */
async function getOAuthTokens(supabase: any, userId: string): Promise<Record<string, OAuthTokens>> {
  const { data: tokens } = await supabase
    .from('oauth_tokens')
    .select('*')
    .eq('user_id', userId);

  if (!tokens) return {};

  const tokenMap: Record<string, OAuthTokens> = {};

  for (const token of tokens) {
    tokenMap[token.service] = {
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      expires_at: token.expires_at ? new Date(token.expires_at).getTime() : undefined,
      scope: token.scope,
    };
  }

  return tokenMap;
}

/**
 * Check if authentication is needed for a command type
 */
function checkAuthNeeded(type: string, tokens: Record<string, OAuthTokens>): boolean {
  const authRequired = ['email', 'twitter', 'uber'];

  if (!authRequired.includes(type)) {
    return false;
  }

  // Map type to service name
  const serviceMap: Record<string, string> = {
    email: 'gmail',
    twitter: 'twitter',
    uber: 'uber',
  };

  const serviceName = serviceMap[type] || type;

  // Check if we have a valid token
  const token = tokens[serviceName];
  if (!token) return true;

  // Check if token is expired
  if (token.expires_at && token.expires_at < Date.now()) {
    return true;
  }

  return false;
}
