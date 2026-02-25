import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createReadStream } from 'fs';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

// Rate limiting configuration
const RATE_LIMIT = 20; // requests per minute
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const requestCounts = new Map<string, { count: number; resetTime: number }>();

interface TranscriptionResponse {
  transcript: string;
  language: string;
  duration: number;
  provider: 'groq' | 'openai';
}

function checkRateLimit(sessionId: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(sessionId);

  if (!record || now > record.resetTime) {
    requestCounts.set(sessionId, {
      count: 1,
      resetTime: now + 60000, // 1 minute
    });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // Get session ID from headers or query
    const sessionId = req.headers.get('x-session-id') || 
                      req.nextUrl.searchParams.get('sessionId') || 
                      'default';

    // Check rate limit
    if (!checkRateLimit(sessionId)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Maximum 20 requests per minute.' },
        { status: 429 }
      );
    }

    // Parse multipart form data
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Check file size
    if (audioFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 413 }
      );
    }

    // Save file temporarily
    const tempDir = '/tmp/cubiqo-stt';
    const tempFilePath = join(tempDir, `${randomUUID()}-${audioFile.name}`);
    
    // Create temp directory if it doesn't exist
    const { mkdir } = await import('fs/promises');
    await mkdir(tempDir, { recursive: true });

    // Write file
    const buffer = await audioFile.arrayBuffer();
    await writeFile(tempFilePath, Buffer.from(buffer));

    let result: TranscriptionResponse;

    try {
      // Try Groq first (faster and cheaper)
      if (process.env.GROQ_API_KEY) {
        
        result = await transcribeWithGroq(tempFilePath, audioFile.name);
      } 
      // Fallback to OpenAI
      else if (process.env.OPENAI_API_KEY) {
        
        result = await transcribeWithOpenAI(tempFilePath, audioFile.name);
      } 
      else {
        throw new Error('No STT provider configured. Set GROQ_API_KEY or OPENAI_API_KEY');
      }

      result.duration = (Date.now() - startTime) / 1000;



      return NextResponse.json(result);
    } finally {
      // Cleanup temp file
      await unlink(tempFilePath).catch(() => {});
    }
  } catch (error) {
    
    return NextResponse.json(
      {
        error: 'Transcription failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

async function transcribeWithGroq(
  filePath: string,
  filename: string
): Promise<TranscriptionResponse> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('Groq API key not configured');
  }

  const client = new OpenAI({
    apiKey,
    baseURL: 'https://api.groq.com/openai/v1',
  });

  const fileStream = createReadStream(filePath) as any;
  fileStream.path = filename; // OpenAI SDK requires filename

  const transcription = await client.audio.transcriptions.create({
    file: fileStream,
    model: 'whisper-large-v3-turbo',
    response_format: 'verbose_json',
  });

  return {
    transcript: transcription.text,
    language: (transcription as any).language || 'unknown',
    duration: 0, // Will be set by caller
    provider: 'groq',
  };
}

async function transcribeWithOpenAI(
  filePath: string,
  filename: string
): Promise<TranscriptionResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const client = new OpenAI({
    apiKey,
  });

  const fileStream = createReadStream(filePath) as any;
  fileStream.path = filename; // OpenAI SDK requires filename

  const transcription = await client.audio.transcriptions.create({
    file: fileStream,
    model: 'whisper-1',
    response_format: 'verbose_json',
  });

  return {
    transcript: transcription.text,
    language: (transcription as any).language || 'unknown',
    duration: 0, // Will be set by caller
    provider: 'openai',
  };
}
