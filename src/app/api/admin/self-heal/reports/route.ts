/**
 * Self-Heal Reports API
 * GET /api/admin/self-heal/reports
 * 
 * Retrieves the last 30 self-heal reports
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/auth/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Require admin authentication
    const authResult = await requireAdmin(req)
    if (!authResult.authorized) {
        return authResult.response
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch last 30 reports
    const { data: reports, error } = await supabase
      .from('self_heal_reports')
      .select('*')
      .order('executed_at', { ascending: false })
      .limit(30);

    if (error) {
      
      throw new Error(`Failed to fetch reports: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      reports: reports || [],
      count: reports?.length || 0,
    });
  } catch (error) {
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        reports: [],
        count: 0,
      },
      { status: 500 }
    );
  }
}
