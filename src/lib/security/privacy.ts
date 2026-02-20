/**
 * Privacy and Compliance Utilities
 * 
 * GDPR and CCPA compliance helpers for data management.
 */

export interface DataExportRequest {
  userId: string;
  format: 'json' | 'csv' | 'xml';
  includeDeleted?: boolean;
}

export interface DataDeletionRequest {
  userId: string;
  reason?: string;
  immediate?: boolean; // If false, schedule for 30 days
}

export interface UserDataExport {
  user: {
    id: string;
    email: string;
    created_at: string;
    updated_at: string;
  };
  profile: {
    full_name?: string;
    avatar_url?: string;
    preferences: Record<string, unknown>;
  };
  journal_entries: Array<{
    id: string;
    content: string;
    color: string;
    created_at: string;
  }>;
  oauth_tokens: Array<{
    provider: string;
    scopes: string[];
    created_at: string;
  }>;
  audit_log: Array<{
    action: string;
    timestamp: string;
    ip_address?: string;
  }>;
  analytics_events: Array<{
    event_name: string;
    timestamp: string;
  }>;
}

/**
 * Export all user data (GDPR Right to Access)
 */
export async function exportUserData(
  request: DataExportRequest
): Promise<UserDataExport> {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { userId } = request;

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  // Fetch journal entries
  const { data: journalEntries } = await supabase
    .from('journal_entries')
    .select('id, content, color, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  // Fetch OAuth tokens (without actual tokens)
  const { data: oauthTokens } = await supabase
    .from('oauth_tokens')
    .select('provider, scopes, created_at')
    .eq('user_id', userId);

  // Fetch audit log
  const { data: auditLog } = await supabase
    .from('audit_log')
    .select('action, timestamp, ip_address')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(1000);

  // Fetch analytics events
  const { data: analyticsEvents } = await supabase
    .from('feature_events')
    .select('event_name, timestamp')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(1000);

  return {
    user: {
      id: profile?.id || userId,
      email: profile?.email || '',
      created_at: profile?.created_at || '',
      updated_at: profile?.updated_at || '',
    },
    profile: {
      full_name: profile?.full_name,
      avatar_url: profile?.avatar_url,
      preferences: profile?.preferences || {},
    },
    journal_entries: journalEntries || [],
    oauth_tokens: oauthTokens || [],
    audit_log: auditLog || [],
    analytics_events: analyticsEvents || [],
  };
}

/**
 * Delete all user data (GDPR Right to Erasure)
 */
export async function deleteUserData(
  request: DataDeletionRequest
): Promise<{
  success: boolean;
  deletedAt: string;
  scheduledFor?: string;
}> {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { userId, immediate = false } = request;

  if (!immediate) {
    // Schedule deletion for 30 days (grace period)
    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + 30);

    await supabase
      .from('deletion_requests')
      .insert({
        user_id: userId,
        scheduled_for: scheduledDate.toISOString(),
        reason: request.reason,
        status: 'pending',
      });

    return {
      success: true,
      deletedAt: '',
      scheduledFor: scheduledDate.toISOString(),
    };
  }

  // Immediate deletion
  const deletedAt = new Date().toISOString();

  // Delete in order (respecting foreign key constraints)
  await supabase.from('feature_events').delete().eq('user_id', userId);
  await supabase.from('audit_log').delete().eq('user_id', userId);
  await supabase.from('oauth_tokens').delete().eq('user_id', userId);
  await supabase.from('journal_entries').delete().eq('user_id', userId);
  await supabase.from('flag_overrides').delete().eq('user_id', userId);
  await supabase.from('profiles').delete().eq('id', userId);

  // Delete from Supabase Auth
  const { error } = await supabase.auth.admin.deleteUser(userId);
  
  if (error) {
    throw new Error(`Failed to delete user from auth: ${error.message}`);
  }

  // Log deletion (for compliance audit trail)
  await logDeletion(userId, request.reason);

  return {
    success: true,
    deletedAt,
  };
}

/**
 * Anonymize user data (alternative to deletion)
 */
export async function anonymizeUserData(userId: string): Promise<void> {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const anonymousId = `anon_${Date.now()}`;

  // Update profile with anonymized data
  await supabase
    .from('profiles')
    .update({
      email: `${anonymousId}@deleted.local`,
      full_name: 'Deleted User',
      avatar_url: null,
      preferences: {},
    })
    .eq('id', userId);

  // Anonymize journal entries
  await supabase
    .from('journal_entries')
    .update({
      content: '[Content deleted by user request]',
    })
    .eq('user_id', userId);

  // Delete OAuth tokens
  await supabase
    .from('oauth_tokens')
    .delete()
    .eq('user_id', userId);

  // Keep audit log but anonymize IP addresses
  await supabase
    .from('audit_log')
    .update({
      ip_address: null,
      user_agent: null,
    })
    .eq('user_id', userId);
}

/**
 * Check user consent status
 */
export async function getUserConsent(userId: string): Promise<{
  analytics: boolean;
  marketing: boolean;
  dataProcessing: boolean;
  thirdPartySharing: boolean;
  timestamp: string;
}> {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data } = await supabase
    .from('user_consent')
    .select('*')
    .eq('user_id', userId)
    .single();

  return data || {
    analytics: false,
    marketing: false,
    dataProcessing: true,  // Required for service
    thirdPartySharing: false,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Update user consent
 */
export async function updateUserConsent(
  userId: string,
  consent: {
    analytics?: boolean;
    marketing?: boolean;
    dataProcessing?: boolean;
    thirdPartySharing?: boolean;
  }
): Promise<void> {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await supabase
    .from('user_consent')
    .upsert({
      user_id: userId,
      ...consent,
      timestamp: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

  // Log consent update for audit trail
  await supabase.from('audit_log').insert({
    user_id: userId,
    action: 'consent_updated',
    details: consent,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Get data retention policy
 */
export function getDataRetentionPolicy(): Record<string, string> {
  return {
    userProfile: 'Until account deletion',
    journalEntries: 'Until account deletion',
    auditLogs: '7 years (compliance requirement)',
    oauthTokens: 'Until revoked or account deletion',
    analytics: '2 years',
    errorLogs: '90 days',
    accessLogs: '180 days',
    deletionRequests: '3 years (compliance requirement)',
  };
}

/**
 * Log data deletion for audit trail
 */
async function logDeletion(userId: string, reason?: string): Promise<void> {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Store in separate audit table that survives user deletion
  await supabase.from('deletion_audit').insert({
    user_id: userId,
    deletion_date: new Date().toISOString(),
    reason: reason || 'User requested deletion',
  });
}

/**
 * Format data export based on requested format
 */
export function formatDataExport(
  data: UserDataExport,
  format: 'json' | 'csv' | 'xml'
): string {
  if (format === 'json') {
    return JSON.stringify(data, null, 2);
  }

  if (format === 'csv') {
    // Simple CSV export (in production, use proper CSV library)
    let csv = 'Type,ID,Content,Timestamp\n';
    
    data.journal_entries.forEach(entry => {
      csv += `Journal,${entry.id},"${entry.content.replace(/"/g, '""')}",${entry.created_at}\n`;
    });
    
    data.audit_log.forEach(log => {
      csv += `Audit,${log.action},"",${log.timestamp}\n`;
    });
    
    return csv;
  }

  if (format === 'xml') {
    // Simple XML export
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<user_data>\n';
    xml += `  <user id="${data.user.id}" email="${data.user.email}" />\n`;
    xml += '  <journal_entries>\n';
    data.journal_entries.forEach(entry => {
      xml += `    <entry id="${entry.id}" created_at="${entry.created_at}">\n`;
      xml += `      <content>${escapeXml(entry.content)}</content>\n`;
      xml += `    </entry>\n`;
    });
    xml += '  </journal_entries>\n';
    xml += '</user_data>';
    return xml;
  }

  return JSON.stringify(data);
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
