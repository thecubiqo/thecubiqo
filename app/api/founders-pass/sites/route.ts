// API: Sites CRUD
import { NextRequest, NextResponse } from 'next/server';
import {
  listSites,
  createSite,
  updateSite,
  deleteSite,
  writeAuditLog,
} from '@/lib/founders-pass/service';

export async function GET() {
  try {
    const sites = await listSites();
    return NextResponse.json({ sites });
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
    const site = await createSite({
      name: body.name,
      slug: body.slug,
      domain: body.domain ?? null,
      description: body.description ?? null,
      config: body.config ?? {},
      status: body.status ?? 'active',
      created_by: body.created_by ?? null,
    });

    await writeAuditLog({
      actor_id: body.created_by ?? null,
      action: 'site.created',
      resource_type: 'site',
      resource_id: site.id,
      details: { name: site.name, slug: site.slug },
    });

    return NextResponse.json({ site }, { status: 201 });
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
    const site = await updateSite(body.id, body);

    await writeAuditLog({
      actor_id: body.updated_by ?? null,
      action: 'site.updated',
      resource_type: 'site',
      resource_id: site.id,
      details: body,
    });

    return NextResponse.json({ site });
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
    await deleteSite(id);

    await writeAuditLog({
      actor_id: null,
      action: 'site.deleted',
      resource_type: 'site',
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
