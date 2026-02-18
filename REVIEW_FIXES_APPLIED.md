# Code Review Fixes Applied

## Issue 1: `is_active` column doesn't exist in org_members table
**Fixed in:**
- `/src/lib/emergent/security/rbac.ts` (2 locations)
- `/src/app/api/emergent/orgs/route.ts`
- `/src/app/api/emergent/projects/route.ts`

**Solution:** Changed `.eq('is_active', true)` to `.not('joined_at', 'is', null)` to filter only joined members

## Issue 2: Column naming mismatch (auth_tag vs authTag)
**Fixed in:**
- `/src/lib/emergent/integrations/playbook-executor.ts`

**Solution:** Added fallback to handle both snake_case (database) and camelCase (types):
```typescript
const authTag = (secret as any).auth_tag || (secret as any).authTag
```

## Issue 3: `currency` column doesn't exist in credits table
**Fixed in:**
- `/src/lib/emergent/agent-types.ts` - Removed from Credits interface
- `/src/lib/emergent/orchestrator.ts` - Removed from returned object

## Issue 4: `credit_id` column doesn't exist in credit_transactions table
**Fixed in:**
- `/src/lib/emergent/agent-types.ts` - Changed CreditTransaction interface to use `orgId` and `balanceAfter`
- `/src/lib/emergent/orchestrator.ts` - Updated to query credits table for org_id, use correct column names

**Solution:** Transaction now correctly references `org_id` and includes `balance_after` as per actual schema

## Summary of Changes

✅ All database queries now match actual schema  
✅ Column names corrected (snake_case in DB, mapped to camelCase in types)  
✅ Removed non-existent columns from interfaces  
✅ Added fallback handling for naming convention variations  

## Verification

All issues identified in code review have been addressed. The implementation now correctly aligns with the database schema defined in migrations.

---

**Status:** ✅ **ALL REVIEW ISSUES FIXED**

Ready for re-review!
