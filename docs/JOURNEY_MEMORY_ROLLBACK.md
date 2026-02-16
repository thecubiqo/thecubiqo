# Journey Memory Rollback Controls

## Overview

The Journey Memory system provides comprehensive privacy and rollback controls to ensure users maintain full control over their data. This document outlines the rollback procedures, audit trail, and administrative controls.

## User-Initiated Rollback

### Delete Individual Memories

Users can delete individual memories through the Journey Settings page:

1. Navigate to `/journey`
2. Scroll to the Privacy Controls section
3. Click "Delete" next to any memory
4. Confirm the deletion

**API Endpoint:** `DELETE /api/journey/memories/{memoryId}`

**Effect:**
- Memory is permanently deleted
- Action is logged in `journey_rollback_logs`
- Cannot be undone

### Delete All Memories

Users can delete all their memories at once:

1. Navigate to `/journey`
2. Click "Delete All Memories" button
3. Confirm the action

**API Endpoint:** `DELETE /api/journey/consent?deleteMemories=true`

**Effect:**
- All user memories are permanently deleted
- Consent status is revoked
- Action is logged in `journey_rollback_logs` with count
- Cannot be undone

### Revoke Consent Only

Users can opt out without deleting existing memories:

1. Navigate to `/journey`
2. Click "Change Settings"
3. Click "No Thanks" or set opted_in to false

**API Endpoint:** `POST /api/journey/consent` with `{ optedIn: false }`

**Effect:**
- Future memory collection is stopped
- Existing memories are retained but no longer accessible through the UI
- User can re-opt-in later to access existing memories

## Automatic Rollback

### Retention Period Expiry

Memories automatically expire based on user's retention preference:

- Default: 365 days
- Options: 30, 90, 180, 365 days, or Forever
- Cleanup runs automatically via database trigger

**Database Function:** `cleanup_expired_journey_memories()`

**Effect:**
- Expired memories are deleted
- Action is logged as 'expired_deletion'
- Runs periodically (configure via pg_cron or app scheduler)

## Audit Trail

All rollback actions are logged in the `journey_rollback_logs` table:

```sql
SELECT * FROM journey_rollback_logs
WHERE user_id = 'user-uuid'
ORDER BY created_at DESC;
```

### Log Fields

- `action_type`: Type of action (delete_memory, delete_all, revoke_consent, etc.)
- `affected_memory_id`: ID of deleted memory (if single deletion)
- `affected_count`: Number of memories affected
- `reason`: User-provided or system reason
- `metadata`: Additional context (deleted memory snapshot, request details)
- `performed_by`: user/admin/system

## Admin Controls

Admins can monitor and manage rollback actions through the Admin Dashboard.

### View Rollback Logs

Navigate to `/admin/journey` to view:

- Recent rollback events
- Affected user counts
- Deletion patterns
- Audit trail

### Emergency Data Deletion (Admin)

In case of data breach or legal requirement:

```sql
-- Delete all memories for a specific user
DELETE FROM journey_memories WHERE user_id = 'user-uuid';

-- Log the admin action
INSERT INTO journey_rollback_logs (user_id, action_type, affected_count, reason, performed_by)
VALUES ('user-uuid', 'admin_emergency_delete', 0, 'Legal request', 'admin');
```

### Bulk Cleanup

Remove all expired memories across all users:

```sql
SELECT cleanup_expired_journey_memories();
```

## Privacy Guarantees

1. **User Control**: Users have complete control over their data
2. **Transparency**: All deletions are logged in audit trail
3. **Permanent Deletion**: Deleted memories cannot be recovered
4. **No Third-Party Access**: Data is never shared with third parties
5. **Encryption**: All data is encrypted at rest and in transit

## Recovery Options

**Important:** Journey Memory system does NOT support recovery of deleted data.

- Deleted memories are permanently removed from the database
- No backups are kept of user memories
- This is by design to ensure privacy and GDPR compliance

## GDPR Compliance

The rollback system supports GDPR requirements:

- **Right to Erasure**: Users can delete all their data
- **Right to Data Portability**: Users can export their memories (future feature)
- **Right to Rectification**: Users can update/delete individual memories
- **Audit Trail**: All data operations are logged

## API Reference

### User Endpoints

- `GET /api/journey/consent` - Get consent status
- `POST /api/journey/consent` - Update consent
- `DELETE /api/journey/consent` - Revoke consent (with optional memory deletion)
- `GET /api/journey/memories` - List memories
- `DELETE /api/journey/memories/{id}` - Delete single memory

### Admin Endpoints

- `GET /api/admin/journey/metrics` - View system metrics
- `POST /api/admin/journey/feature-flag` - Toggle feature
- `GET /api/admin/journey/rollback-logs` - View all rollback logs (future)

## Troubleshooting

### Memory Not Deleting

1. Check user has proper authentication
2. Verify memory belongs to the authenticated user
3. Check database RLS policies
4. Review error logs

### Audit Trail Missing

1. Ensure triggers are enabled
2. Check database function `set_journey_memory_expiry()`
3. Verify RLS policies allow log creation

## Future Enhancements

- [ ] Soft delete with recovery window (24 hours)
- [ ] Memory export (JSON/CSV)
- [ ] Scheduled deletion (delete at specific date)
- [ ] Bulk memory management
- [ ] Admin override capabilities
- [ ] Data retention policy enforcement

## Support

For issues or questions about rollback controls:
- Check audit logs first
- Review error messages in console
- Contact admin with user ID and timestamp
- Include rollback log entries if available

---

**Last Updated:** 2026-02-15  
**Version:** 1.0  
**Feature Flag:** `journey_memory`
