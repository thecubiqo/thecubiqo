import { NextRequest } from 'next/server';
import { POST as dismissPOST } from '@/next/app/api/nudges/[id]/dismiss/route';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return dismissPOST(request, { params });
}
