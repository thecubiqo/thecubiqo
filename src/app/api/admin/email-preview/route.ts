/**
 * Email Preview API Route
 * Allows admins to preview email templates
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/actions';
import { 
  getMagicLinkHTML, 
  getMagicLinkPlainText, 
  getMagicLinkSubject,
  type MagicLinkTemplateData 
} from '@/lib/email/templates/magic-link';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/email-preview
 * Preview magic link email template
 * 
 * Query params:
 *  - type: 'html' | 'text' (default: 'html')
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'html';
    
    // Sample data for preview
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const previewData: MagicLinkTemplateData = {
      magicLink: `${appUrl}/auth/callback?code=PREVIEW_TOKEN_1234567890`,
      appUrl,
    };

    // Generate the appropriate template
    if (type === 'text') {
      const plainText = getMagicLinkPlainText(previewData);
      return new NextResponse(plainText, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      });
    }

    if (type === 'subject') {
      const subject = getMagicLinkSubject();
      return NextResponse.json({
        subject,
        data: previewData,
      });
    }

    // Default: HTML preview
    const html = getMagicLinkHTML(previewData);
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Email preview error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate preview' },
      { status: 500 }
    );
  }
}
