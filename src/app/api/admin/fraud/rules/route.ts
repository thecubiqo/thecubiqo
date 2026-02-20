import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/fraud/rules
 * List all fraud detection rules with hit counts
 * Admin-only access
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Check admin authorization
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const enabled = searchParams.get('enabled');
    const ruleType = searchParams.get('ruleType');
    const severity = searchParams.get('severity');

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('fraud_detection_rules')
      .select('*', { count: 'exact' });

    // Apply filters
    if (enabled !== null && enabled !== undefined) {
      query = query.eq('enabled', enabled === 'true');
    }

    if (ruleType) {
      query = query.eq('rule_type', ruleType);
    }

    if (severity) {
      query = query.eq('severity', severity);
    }

    // Apply sorting and pagination
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: rules, error, count } = await query;

    if (error) {
      console.error('Error fetching fraud rules:', error);
      return NextResponse.json(
        { error: 'Failed to fetch fraud rules' },
        { status: 500 }
      );
    }

    // Get summary statistics
    const { data: allRules } = await supabase
      .from('fraud_detection_rules')
      .select('enabled, hit_count, severity, rule_type');

    const statistics = {
      totalRules: allRules?.length || 0,
      enabledRules: allRules?.filter(r => r.enabled).length || 0,
      disabledRules: allRules?.filter(r => !r.enabled).length || 0,
      totalHits: allRules?.reduce((sum, r) => sum + (r.hit_count || 0), 0) || 0,
      bySeverity: {
        critical: allRules?.filter(r => r.severity === 'critical').length || 0,
        high: allRules?.filter(r => r.severity === 'high').length || 0,
        medium: allRules?.filter(r => r.severity === 'medium').length || 0,
        low: allRules?.filter(r => r.severity === 'low').length || 0,
      },
      byType: allRules?.reduce((acc, rule) => {
        acc[rule.rule_type] = (acc[rule.rule_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {},
    };

    return NextResponse.json({
      success: true,
      data: rules,
      statistics,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in GET /api/admin/fraud/rules:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/fraud/rules
 * Create new fraud detection rule
 * Admin-only access
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check admin authorization
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      rule_name,
      rule_type,
      rule_condition,
      severity,
      action,
      enabled = true,
    } = body;

    // Validate required fields
    if (!rule_name || !rule_type || !rule_condition || !severity || !action) {
      return NextResponse.json(
        { error: 'rule_name, rule_type, rule_condition, severity, and action are required' },
        { status: 400 }
      );
    }

    // Validate severity
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (!validSeverities.includes(severity)) {
      return NextResponse.json(
        { error: `severity must be one of: ${validSeverities.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate action
    const validActions = ['flag', 'block', 'notify', 'review'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `action must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate rule_condition is an object
    if (typeof rule_condition !== 'object' || rule_condition === null) {
      return NextResponse.json(
        { error: 'rule_condition must be a valid JSON object' },
        { status: 400 }
      );
    }

    // Check if rule_name already exists
    const { data: existingRule } = await supabase
      .from('fraud_detection_rules')
      .select('id')
      .eq('rule_name', rule_name)
      .single();

    if (existingRule) {
      return NextResponse.json(
        { error: 'A rule with this name already exists' },
        { status: 409 }
      );
    }

    // Create fraud rule
    const { data: rule, error: createError } = await supabase
      .from('fraud_detection_rules')
      .insert({
        rule_name,
        rule_type,
        rule_condition,
        severity,
        action,
        enabled,
        hit_count: 0,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating fraud rule:', createError);
      return NextResponse.json(
        { error: 'Failed to create fraud rule' },
        { status: 500 }
      );
    }

    // Log admin action
    await supabase.rpc('log_admin_action', {
      p_user_id: user.id,
      p_user_email: profile.email,
      p_action_type: 'fraud_rule_created',
      p_action_details: {
        rule_id: rule.id,
        rule_name,
        severity,
        action,
      },
    });

    return NextResponse.json({
      success: true,
      data: rule,
      message: 'Fraud detection rule created successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in POST /api/admin/fraud/rules:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/fraud/rules
 * Update fraud detection rule (enable/disable, modify conditions)
 * Admin-only access
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check admin authorization
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      rule_id,
      rule_name,
      rule_condition,
      severity,
      action,
      enabled,
    } = body;

    // Validate rule_id
    if (!rule_id) {
      return NextResponse.json(
        { error: 'rule_id is required' },
        { status: 400 }
      );
    }

    // Check if rule exists
    const { data: existingRule, error: fetchError } = await supabase
      .from('fraud_detection_rules')
      .select('*')
      .eq('id', rule_id)
      .single();

    if (fetchError || !existingRule) {
      return NextResponse.json(
        { error: 'Fraud rule not found' },
        { status: 404 }
      );
    }

    // Build update object
    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (rule_name !== undefined) updates.rule_name = rule_name;
    if (rule_condition !== undefined) {
      if (typeof rule_condition !== 'object' || rule_condition === null) {
        return NextResponse.json(
          { error: 'rule_condition must be a valid JSON object' },
          { status: 400 }
        );
      }
      updates.rule_condition = rule_condition;
    }
    if (severity !== undefined) {
      const validSeverities = ['low', 'medium', 'high', 'critical'];
      if (!validSeverities.includes(severity)) {
        return NextResponse.json(
          { error: `severity must be one of: ${validSeverities.join(', ')}` },
          { status: 400 }
        );
      }
      updates.severity = severity;
    }
    if (action !== undefined) {
      const validActions = ['flag', 'block', 'notify', 'review'];
      if (!validActions.includes(action)) {
        return NextResponse.json(
          { error: `action must be one of: ${validActions.join(', ')}` },
          { status: 400 }
        );
      }
      updates.action = action;
    }
    if (enabled !== undefined) updates.enabled = enabled;

    // Update fraud rule
    const { data: updatedRule, error: updateError } = await supabase
      .from('fraud_detection_rules')
      .update(updates)
      .eq('id', rule_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating fraud rule:', updateError);
      return NextResponse.json(
        { error: 'Failed to update fraud rule' },
        { status: 500 }
      );
    }

    // Log admin action
    await supabase.rpc('log_admin_action', {
      p_user_id: user.id,
      p_user_email: profile.email,
      p_action_type: 'fraud_rule_updated',
      p_action_details: {
        rule_id,
        rule_name: existingRule.rule_name,
        changes: updates,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedRule,
      message: 'Fraud detection rule updated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in PATCH /api/admin/fraud/rules:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/fraud/rules
 * Delete fraud detection rule
 * Admin-only access
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check admin authorization
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const rule_id = searchParams.get('rule_id');

    // Validate rule_id
    if (!rule_id) {
      return NextResponse.json(
        { error: 'rule_id is required' },
        { status: 400 }
      );
    }

    // Check if rule exists
    const { data: existingRule, error: fetchError } = await supabase
      .from('fraud_detection_rules')
      .select('*')
      .eq('id', rule_id)
      .single();

    if (fetchError || !existingRule) {
      return NextResponse.json(
        { error: 'Fraud rule not found' },
        { status: 404 }
      );
    }

    // Delete fraud rule
    const { error: deleteError } = await supabase
      .from('fraud_detection_rules')
      .delete()
      .eq('id', rule_id);

    if (deleteError) {
      console.error('Error deleting fraud rule:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete fraud rule' },
        { status: 500 }
      );
    }

    // Log admin action
    await supabase.rpc('log_admin_action', {
      p_user_id: user.id,
      p_user_email: profile.email,
      p_action_type: 'fraud_rule_deleted',
      p_action_details: {
        rule_id,
        rule_name: existingRule.rule_name,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Fraud detection rule deleted successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in DELETE /api/admin/fraud/rules:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
