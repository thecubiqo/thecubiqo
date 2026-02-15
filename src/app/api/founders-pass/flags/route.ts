// API: Feature Flags CRUD
import { NextRequest, NextResponse } from 'next/server';
import {
  listFlags,
  createFlag,
  updateFlag,
  deleteFlag,
  writeAuditLog,
  invalidateFlagCache,
} from '@/lib/founders-pass/service';

export async function GET() {
  try {
    const flags = await listFlags();
    return NextResponse.json({ flags });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const flag = await createFlag({
      key: body.key,
      name: body.name,
      description: body.description ?? null,
      flag_type: body.flag_type ?? 'boolean',
      default_value: body.default_value ?? false,
      rollout_rules: body.rollout_rules ?? {},
      required_scopes: body.required_scopes ?? [],
      metadata: body.metadata ?? {},
      created_by: body.created_by ?? null,
    });

    await writeAuditLog({
      actor_id: body.created_by ?? null,
      action: 'flag.created',
      resource_type: 'feature_flag',
      resource_id: flag.id,
      details: { key: flag.key, name: flag.name },
    });

    return NextResponse.json({ flag }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 400 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }
    const flag = await updateFlag(body.id, body);

    await writeAuditLog({
      actor_id: body.updated_by ?? null,
      action: 'flag.updated',
      resource_type: 'feature_flag',
      resource_id: flag.id,
      details: body,
    });

    return NextResponse.json({ flag });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 400 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }
    await deleteFlag(id);
    invalidateFlagCache();

    await writeAuditLog({
      actor_id: null,
      action: 'flag.deleted',
      resource_type: 'feature_flag',
      resource_id: id,
      details: {},
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 400 },
    );
  }
}
