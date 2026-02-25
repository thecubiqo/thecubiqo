// API: Action Templates CRUD
import { NextRequest, NextResponse } from 'next/server';
import {
  listActionTemplates,
  createActionTemplate,
  updateActionTemplate,
  writeAuditLog,
} from '@/lib/founders-pass/service';

export async function GET() {
  try {
    const templates = await listActionTemplates();
    return NextResponse.json({ templates });
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
    const template = await createActionTemplate({
      name: body.name,
      key: body.key,
      description: body.description ?? null,
      provider: body.provider,
      required_scopes: body.required_scopes ?? [],
      ui_schema: body.ui_schema ?? {},
      created_by: body.created_by ?? null,
    });

    await writeAuditLog({
      actor_id: body.created_by ?? null,
      action: 'action_template.created',
      resource_type: 'action_template',
      resource_id: template.id,
      details: { key: template.key, name: template.name },
    });

    return NextResponse.json({ template }, { status: 201 });
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
    const template = await updateActionTemplate(body.id, body);

    await writeAuditLog({
      actor_id: body.updated_by ?? null,
      action: 'action_template.updated',
      resource_type: 'action_template',
      resource_id: template.id,
      details: body,
    });

    return NextResponse.json({ template });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 400 },
    );
  }
}
