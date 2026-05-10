import { runLegacyVercelHandler } from '@/next/lib/legacy-vercel-adapter';

const legacyVoiceCue = require('../../../server/legacy/voice-cue.cjs');

export async function POST(request: Request) {
  return runLegacyVercelHandler(legacyVoiceCue, request, 'POST');
}

export async function GET(request: Request) {
  return runLegacyVercelHandler(legacyVoiceCue, request, 'GET');
}
