/**
 * BYO API Keys Test Endpoint
 * Tests if provided API keys are valid without saving them
 * 
 * POST /api/byo/test - Test API keys
 * 
 * Author: Bubbles (Frontend Developer) 
 * Sprint 1: BYO Settings UX Enhancement
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

// Request validation schema
const testBYOKeysSchema = z.object({
  claudeApiKey: z.string().optional().nullable(),
  openaiApiKey: z.string().optional().nullable(),
});

/**
 * POST - Test API keys without saving
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
    const validation = testBYOKeysSchema.safeParse(body);

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

    const { claudeApiKey, openaiApiKey } = validation.data;

    if (!claudeApiKey && !openaiApiKey) {
      return NextResponse.json(
        { success: false, error: 'At least one API key is required' },
        { status: 400 }
      );
    }

    const results = {
      claudeValid: false,
      openaiValid: false,
      errors: {} as Record<string, string>,
    };

    // Test Claude API key
    if (claudeApiKey) {
      try {
        const anthropic = new Anthropic({ apiKey: claudeApiKey });
        
        // Make a minimal API call to test the key
        await anthropic.messages.create({
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Test' }],
        });
        
        results.claudeValid = true;
      } catch (error: any) {
        console.error('[BYO Test] Claude error:', error);
        if (error?.status === 401) {
          results.errors.claude = 'Invalid API key - authentication failed';
        } else if (error?.status === 429) {
          results.errors.claude = 'Rate limit exceeded - key is valid but needs a moment';
          results.claudeValid = true; // Key is valid, just rate limited
        } else if (error?.status === 400) {
          results.errors.claude = 'Invalid request format';
        } else {
          results.errors.claude = error?.message || 'Connection failed';
        }
      }
    }

    // Test OpenAI API key
    if (openaiApiKey) {
      try {
        const openai = new OpenAI({ apiKey: openaiApiKey });
        
        // Make a minimal API call to test the key
        await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Test' }],
        });
        
        results.openaiValid = true;
      } catch (error: any) {
        console.error('[BYO Test] OpenAI error:', error);
        if (error?.status === 401) {
          results.errors.openai = 'Invalid API key - authentication failed';
        } else if (error?.status === 429) {
          results.errors.openai = 'Rate limit exceeded - key is valid but needs a moment';
          results.openaiValid = true; // Key is valid, just rate limited
        } else if (error?.status === 400) {
          results.errors.openai = 'Invalid request format';
        } else {
          results.errors.openai = error?.message || 'Connection failed';
        }
      }
    }

    // Check if at least one key is valid
    const hasValidKey = results.claudeValid || results.openaiValid;

    if (!hasValidKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'All provided API keys failed validation',
          details: results.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        claudeValid: results.claudeValid,
        openaiValid: results.openaiValid,
        errors: Object.keys(results.errors).length > 0 ? results.errors : undefined,
      },
    });
  } catch (error) {
    console.error('[BYO Test] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
