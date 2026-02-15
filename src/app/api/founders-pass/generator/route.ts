// API: Site generator – creates a new site from the template
import { NextRequest, NextResponse } from 'next/server';
import { createSite, writeAuditLog, emitEvent } from '@/lib/founders-pass/service';
import type { SiteConfig } from '@/lib/founders-pass/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      slug,
      domain,
      description,
      config,
      created_by,
    }: {
      name: string;
      slug: string;
      domain?: string;
      description?: string;
      config?: SiteConfig;
      created_by?: string;
    } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'name and slug are required' }, { status: 400 });
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: 'slug must be lowercase alphanumeric with hyphens only' },
        { status: 400 },
      );
    }

    // Create site record
    const site = await createSite({
      name,
      slug,
      domain: domain ?? null,
      description: description ?? null,
      config: config ?? {
        hero: { title: name, subtitle: `Welcome to ${name}` },
        seo: { title: name, description: description ?? `${name} – powered by CubiQo` },
      },
      status: 'preview',
      created_by: created_by ?? null,
    });

    // Audit
    await writeAuditLog({
      actor_id: created_by ?? null,
      action: 'site.generated',
      resource_type: 'site',
      resource_id: site.id,
      details: { name, slug, domain },
    });

    await emitEvent({
      siteId: site.id,
      userId: created_by,
      eventType: 'page_view',
      eventData: { action: 'site_generated', slug },
    });

    // In production, this would:
    // 1. Clone cubiqo-featured-template repo
    // 2. Replace placeholders with site config
    // 3. Push to new GitHub repo (org/slug)
    // 4. Trigger Vercel deployment
    // For now, return the site record and preview URL
    const previewUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/sites/${slug}`;

    return NextResponse.json(
      {
        site,
        previewUrl,
        message: `Site "${name}" created. Preview at ${previewUrl}`,
        generatorSteps: [
          'Site record created in database',
          'Preview URL generated',
          'To deploy: connect GitHub repo and Vercel project',
        ],
      },
      { status: 201 },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 400 },
    );
  }
}
