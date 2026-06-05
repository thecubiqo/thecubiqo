import { runLegacyVercelHandler } from '@/next/lib/legacy-vercel-adapter';

const legacyConverse = require('../../../../api/converse.js');

export async function POST(request: Request) {
  return runLegacyVercelHandler(legacyConverse, request, 'POST');
}

export async function GET(request: Request) {
  return runLegacyVercelHandler(legacyConverse, request, 'GET');
}
