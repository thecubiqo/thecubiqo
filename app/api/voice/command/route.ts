import { NextRequest, NextResponse } from 'next/server';
import { parseVoiceCommand, handleVoiceCommand } from '@/lib/voice/agent-integration';
import '@/lib/engine/init';

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json();

    if (!transcript) {
      return NextResponse.json(
        { error: 'Missing transcript' },
        { status: 400 }
      );
    }

    const command = await parseVoiceCommand(transcript);
    const response = await handleVoiceCommand(command);

    return NextResponse.json({
      command,
      response,
      success: true,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Command failed' },
      { status: 500 }
    );
  }
}
