/**
 * Browser API Route
 * Handles browser automation requests from the frontend
 */

import { NextRequest, NextResponse } from 'next/server';
import { BrowserService } from '@/lib/browser/browser-service';
import { BrowserCommandParser } from '@/lib/browser/command-parser';
import type { BrowserAction } from '@/lib/browser/types';

// Store active browser sessions (in production, use Redis or similar)
const activeSessions = new Map<string, BrowserService>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, sessionId, command, aiInterpretation } = body;

    switch (action) {
      case 'start-session':
        return await handleStartSession(body);
      
      case 'execute-command':
        return await handleExecuteCommand(sessionId, command, aiInterpretation);
      
      case 'execute-action':
        return await handleExecuteAction(sessionId, body.browserAction);
      
      case 'get-status':
        return await handleGetStatus(sessionId);
      
      case 'close-session':
        return await handleCloseSession(sessionId);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Browser API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function handleStartSession(body: any) {
  const { url, consentGiven } = body;
  const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const browserService = new BrowserService(async (domain, actionType) => {
    // In production, this would prompt the user via WebSocket or similar
    console.log(`Consent requested for ${actionType} on ${domain}`);
    return consentGiven || false;
  });

  await browserService.initialize();
  if (url) {
    await browserService.startSession(url, consentGiven);
  }

  activeSessions.set(sessionId, browserService);

  // Auto-cleanup after 30 minutes
  setTimeout(() => {
    const service = activeSessions.get(sessionId);
    if (service) {
      service.close().catch(console.error);
      activeSessions.delete(sessionId);
    }
  }, 30 * 60 * 1000);

  return NextResponse.json({
    success: true,
    sessionId,
    url: browserService.getCurrentUrl(),
  });
}

async function handleExecuteCommand(
  sessionId: string,
  command: string,
  aiInterpretation?: any
) {
  const browserService = activeSessions.get(sessionId);
  if (!browserService) {
    return NextResponse.json(
      { error: 'Session not found' },
      { status: 404 }
    );
  }

  // Parse command into actions
  let actions: BrowserAction[];
  
  if (aiInterpretation) {
    actions = await BrowserCommandParser.parseWithAI(command, aiInterpretation);
  } else {
    actions = BrowserCommandParser.parseCommand(command);
  }

  if (actions.length === 0) {
    return NextResponse.json({
      success: false,
      error: 'Could not parse command',
      needsAIHelp: true,
      prompt: BrowserCommandParser.generateAIPrompt(
        command,
        browserService.getCurrentUrl()
      ),
    });
  }

  // Execute actions sequentially
  const results = [];
  for (const action of actions) {
    const result = await browserService.executeAction(action);
    results.push(result);
    
    if (!result.success) {
      break; // Stop on first failure
    }
  }

  return NextResponse.json({
    success: results.every(r => r.success),
    results,
    currentUrl: browserService.getCurrentUrl(),
  });
}

async function handleExecuteAction(sessionId: string, browserAction: BrowserAction) {
  const browserService = activeSessions.get(sessionId);
  if (!browserService) {
    return NextResponse.json(
      { error: 'Session not found' },
      { status: 404 }
    );
  }

  const result = await browserService.executeAction(browserAction);

  return NextResponse.json({
    success: result.success,
    result,
    currentUrl: browserService.getCurrentUrl(),
  });
}

async function handleGetStatus(sessionId: string) {
  const browserService = activeSessions.get(sessionId);
  if (!browserService) {
    return NextResponse.json(
      { error: 'Session not found' },
      { status: 404 }
    );
  }

  const session = browserService.getSession();

  return NextResponse.json({
    success: true,
    session,
    currentUrl: browserService.getCurrentUrl(),
  });
}

async function handleCloseSession(sessionId: string) {
  const browserService = activeSessions.get(sessionId);
  if (!browserService) {
    return NextResponse.json(
      { error: 'Session not found' },
      { status: 404 }
    );
  }

  await browserService.close();
  activeSessions.delete(sessionId);

  return NextResponse.json({
    success: true,
    message: 'Session closed',
  });
}

// Cleanup on server shutdown
if (typeof process !== 'undefined') {
  process.on('SIGTERM', async () => {
    console.log('Closing all browser sessions...');
    for (const [sessionId, service] of activeSessions.entries()) {
      await service.close();
      activeSessions.delete(sessionId);
    }
  });
}
