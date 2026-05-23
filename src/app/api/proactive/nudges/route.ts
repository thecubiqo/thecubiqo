import { NextRequest } from 'next/server';
import { GET as nudgesGET } from '@/next/app/api/nudges/route';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  return nudgesGET(request);
}
