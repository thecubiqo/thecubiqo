/**
 * Privacy API: Export User Data
 * 
 * GDPR Article 15 (Right to Access) and Article 20 (Data Portability)
 * CCPA Section 1798.110 (Right to Know)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { exportUserData, formatDataExport } from '@/lib/security/privacy';
import { checkRateLimit, getClientIdentifier, getRateLimitHeaders } from '@/lib/security/rate-limit';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll().map(c => ({ name: c.name, value: c.value })),
          setAll: () => { },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Rate limiting
    const identifier = getClientIdentifier(request.headers, user.id);
    const rateLimit = await checkRateLimit(identifier, 'EXPORT');

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimit),
        }
      );
    }

    // Get format from query params
    const format = (request.nextUrl.searchParams.get('format') || 'json') as 'json' | 'csv' | 'xml';

    // Export user data
    const data = await exportUserData({
      userId: user.id,
      format,
    });

    // Format response
    const formatted = formatDataExport(data, format);

    // Set appropriate content type
    const contentTypes = {
      json: 'application/json',
      csv: 'text/csv',
      xml: 'application/xml',
    };

    const headers = {
      'Content-Type': contentTypes[format],
      'Content-Disposition': `attachment; filename="user-data-${user.id}.${format}"`,
      ...getRateLimitHeaders(rateLimit),
    };

    // Log export request
    await supabase.from('audit_log').insert({
      user_id: user.id,
      action: 'data_export_requested',
      details: { format },
      timestamp: new Date().toISOString(),
      ip_address: request.headers.get('x-forwarded-for') || '',
    });

    return new NextResponse(formatted, { headers });
  } catch (error) {
    console.error('Error exporting user data:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}
