/**
 * BYO API Keys Management Endpoint
 * 
 * GET /api/byo - Get user's BYO config (decrypted)
 * POST /api/byo - Save/update BYO config (encrypts keys)
 * DELETE /api/byo - Delete BYO config
 * 
 * Author: Blossom (Backend Developer)
 * Sprint 1 - Days 1-2: BYO AI Router Integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getBYOConfig,
  saveBYOConfig,
  deleteBYOConfig,
  validateAPIKey,
} from '@/lib/byo/byo-manager';
import { z } from 'zod';

// Request validation schema
const saveBYOConfigSchema = z.object({
  enabled: z.boolean(),
  claudeApiKey: z.string().optional().nullable(),
  openaiApiKey: z.string().optional().nullable(),
});

/**
 * GET - Get user's BYO configuration
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get BYO config (keys are decrypted)
    const config = await getBYOConfig(user.id);

    if (!config) {
      return NextResponse.json({
        success: true,
        data: {
          enabled: false,
          hasClaudeKey: false,
          hasOpenAIKey: false,
        },
      });
    }

    // Don't send actual keys to frontend, just indicate presence
    return NextResponse.json({
      success: true,
      data: {
        enabled: config.enabled,
        hasClaudeKey: !!config.claudeApiKey,
        hasOpenAIKey: !!config.openaiApiKey,
      },
    });
  } catch (error) {
    console.error('[BYO API] GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Save/update BYO configuration
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = saveBYOConfigSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { enabled, claudeApiKey, openaiApiKey } = validation.data;

    // Validate API keys if provided
    if (enabled) {
      if (claudeApiKey && !validateAPIKey('claude', claudeApiKey)) {
        return NextResponse.json(
          { success: false, error: 'Invalid Claude API key format' },
          { status: 400 }
        );
      }

      if (openaiApiKey && !validateAPIKey('openai', openaiApiKey)) {
        return NextResponse.json(
          { success: false, error: 'Invalid OpenAI API key format' },
          { status: 400 }
        );
      }

      // Must have at least one key
      if (!claudeApiKey && !openaiApiKey) {
        return NextResponse.json(
          { success: false, error: 'At least one API key is required when BYO is enabled' },
          { status: 400 }
        );
      }
    }

    // Save config (keys will be encrypted)
    const result = await saveBYOConfig(user.id, {
      enabled,
      claudeApiKey: claudeApiKey || null,
      openaiApiKey: openaiApiKey || null,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        enabled,
        hasClaudeKey: !!claudeApiKey,
        hasOpenAIKey: !!openaiApiKey,
      },
    });
  } catch (error) {
    console.error('[BYO API] POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete BYO configuration
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Delete BYO config
    const result = await deleteBYOConfig(user.id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    console.error('[BYO API] DELETE error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
