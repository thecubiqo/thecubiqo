import { NextResponse } from 'next/server';
import { V2_CAPABILITIES } from '../../_lib/v2-capabilities';

export const runtime = 'nodejs';

export async function GET() {
  const grouped = V2_CAPABILITIES.reduce<Record<string, typeof V2_CAPABILITIES>>((acc, capability) => {
    acc[capability.category] = acc[capability.category] || [];
    acc[capability.category].push(capability);
    return acc;
  }, {});

  return NextResponse.json({
    version: 'v2-action-boundary',
    mode: 'api-first-approved-actions',
    summary:
      'Active capabilities are end-to-end enabled. Locked capabilities are intentionally blocked until provider/API/browser integrations, approval UX, and regression tests exist.',
    capabilities: V2_CAPABILITIES,
    grouped,
    counts: {
      active: V2_CAPABILITIES.filter(item => item.status === 'active').length,
      readOnly: V2_CAPABILITIES.filter(item => item.status === 'read_only').length,
      locked: V2_CAPABILITIES.filter(item => item.status === 'locked').length
    }
  });
}
