import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser } from '../../_lib/supabase-admin';
import { getActionCapability } from '../../_lib/v2-capabilities';
import { normalizeActionType, normalizeToolName, writeAudit } from '../../_lib/v2-actions';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const auth = await requireApiUser(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const actionType = normalizeActionType(body.actionType ?? body.action_type);
  if (!actionType) {
    return NextResponse.json({ error: 'Valid actionType is required' }, { status: 400 });
  }

  const capability = getActionCapability(actionType);
  const toolName = normalizeToolName(body.toolName ?? body.tool_name, actionType);

  if (!capability) {
    await writeAudit(auth, {
      actionType,
      toolName,
      status: 'blocked',
      message: 'Unknown V2 action was blocked',
      input: { actionType }
    });
    return NextResponse.json({ error: 'Unknown V2 action', executed: false }, { status: 400 });
  }

  if (capability.status !== 'active') {
    await writeAudit(auth, {
      actionType,
      toolName,
      status: 'blocked',
      message: 'V2 action blocked because capability is not end-to-end enabled',
      input: { actionType, payloadPreview: body.payload || {} },
      result: {
        capabilityStatus: capability.status,
        requirements: capability.requirements
      }
    });
    return NextResponse.json(
      {
        error: 'This V2 capability is not end-to-end enabled yet',
        executed: false,
        capability
      },
      { status: 501 }
    );
  }

  await writeAudit(auth, {
    actionType,
    toolName,
    status: 'blocked',
    message: 'Use the dedicated active endpoint for this V2 action',
    input: { actionType },
    result: { endpoint: capability.endpoint }
  });

  return NextResponse.json(
    {
      error: 'Use the dedicated endpoint for this active action',
      executed: false,
      endpoint: capability.endpoint,
      capability
    },
    { status: 409 }
  );
}
