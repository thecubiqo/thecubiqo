import { NextRequest } from 'next/server';
import { GET as proactiveGET } from '@/next/app/api/cron/proactive/route';

export const runtime = 'nodejs';
export const maxDuration = 55;

export async function GET(request: NextRequest) {
  return proactiveGET(request);
}
