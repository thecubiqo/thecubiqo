# Cubiqo Communication Fields Feature

## Overview

Every user who signs up on Cubiqo automatically receives:
- **Cubiqo Email**: A unique email address in the format `name@yourcubiqo.com`
- **Cubiqo Phone**: A unique phone number in the format `+1-CUBIQO-{5-digits}`

These communication methods enable Cubiqo to interact with users through various channels:
- Send morning reminders via phone calls
- Send research emails
- Deliver notifications and updates
- Enable seamless communication workflows

## Implementation Details

### Database Schema

Two new columns have been added to the `profiles` table:

```sql
ALTER TABLE profiles 
ADD COLUMN cubiqo_email TEXT,
ADD COLUMN cubiqo_phone TEXT;
```

Both fields have unique constraints to ensure no duplicates exist.

### Email Generation Logic

**Function**: `generate_cubiqo_email(p_display_name, p_handle, p_user_id)`

The email is generated based on the following priority:

1. **Display Name**: If a user has a `display_name` (e.g., "John Smith"), it's converted to lowercase and sanitized to create the email prefix (e.g., "johnsmith@yourcubiqo.com")
2. **Handle Number**: If no display name exists, the handle number is used (e.g., CQ#12345 → "12345@yourcubiqo.com")
3. **Fallback**: If neither exists, the first 8 characters of the user ID are used

**Uniqueness**: If an email already exists, a counter is appended (e.g., "johnsmith2@yourcubiqo.com", "johnsmith3@yourcubiqo.com", etc.)

**Examples**:
- Display name "Alice" → `alice@yourcubiqo.com`
- Display name "Bob Smith" → `bobsmith@yourcubiqo.com`
- Handle CQ#93 → `93@yourcubiqo.com`

### Phone Generation Logic

**Function**: `generate_cubiqo_phone(p_handle, p_user_id)`

The phone number is generated from the user's handle:

1. **Extract Handle Number**: From the format CQ#12345, extract "12345"
2. **Pad to 5 Digits**: Ensure the number is always 5 digits (e.g., CQ#93 → 00093)
3. **Format**: Create the phone number as `+1-CUBIQO-{5-digits}`

**Uniqueness**: If a phone number already exists (rare, since handles are unique), a counter is incremented

**Examples**:
- Handle CQ#1 → `+1-CUBIQO-00001`
- Handle CQ#93 → `+1-CUBIQO-00093`
- Handle CQ#12345 → `+1-CUBIQO-12345`
- Handle CQ#99999 → `+1-CUBIQO-99999`

### Automatic Trigger

A database trigger runs before every profile insertion:

```sql
CREATE TRIGGER trg_auto_generate_communication_fields
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_communication_fields();
```

This trigger automatically:
1. Generates the handle (if not provided)
2. Generates the cubiqo_email (if not provided)
3. Generates the cubiqo_phone (if not provided)

### TypeScript Types

The `Profile` type has been updated to include these new fields:

```typescript
type Profile = {
  // ... existing fields
  cubiqo_email: string | null
  cubiqo_phone: string | null
}
```

## Usage in Code

### Accessing User's Cubiqo Email and Phone

```typescript
import { getCurrentProfile } from '@/lib/auth/actions'

const profile = await getCurrentProfile()

if (profile) {
  const email = profile.cubiqo_email  // e.g., "alice@yourcubiqo.com"
  const phone = profile.cubiqo_phone  // e.g., "+1-CUBIQO-12345"
  
  // Use these for communication
  console.log(`User can be reached at ${email} or ${phone}`)
}
```

### Querying Profiles by Cubiqo Email

```typescript
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()

const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('cubiqo_email', 'alice@yourcubiqo.com')
  .single()
```

## Migration

The migration file `20260218000001_cubiqo_communication_fields.sql` handles:

1. **Schema Updates**: Adds columns and constraints
2. **Function Creation**: Creates the generation functions
3. **Trigger Setup**: Sets up the automatic trigger
4. **Backfilling**: Automatically generates fields for existing users

### Running the Migration

```bash
# Using Supabase CLI
supabase db push

# Or manually in Supabase dashboard
# Copy and paste the contents of:
# supabase/migrations/20260218000001_cubiqo_communication_fields.sql
```

## Testing

Tests have been created in `tests/cubiqo-communication-fields.test.ts` to verify:

- ✅ Automatic generation of cubiqo_email
- ✅ Automatic generation of cubiqo_phone
- ✅ Email format correctness
- ✅ Phone format correctness
- ✅ Uniqueness constraints
- ✅ TypeScript type definitions

Run tests with:

```bash
npm test tests/cubiqo-communication-fields.test.ts
```

## Future Enhancements

Potential future improvements:

1. **Email Service Integration**: Connect to an email service to enable actual email delivery
2. **Phone Service Integration**: Connect to Twilio or similar service for phone calls/SMS
3. **Custom Domains**: Allow organizations to use custom domains (e.g., `user@company.cubiqo.com`)
4. **International Phone Numbers**: Support country-specific phone formats
5. **User Preferences**: Allow users to opt-in/out of different communication channels
6. **Communication History**: Track all communications sent via these channels

## Security Considerations

- Email and phone numbers are stored in the database with RLS (Row Level Security) policies
- Only the user can view their own cubiqo_email and cubiqo_phone
- These fields are not publicly visible by default
- Uniqueness is enforced at the database level
- Auto-generation happens securely on the server side

## Support

For questions or issues related to this feature:

1. Check the migration file: `supabase/migrations/20260218000001_cubiqo_communication_fields.sql`
2. Review the tests: `tests/cubiqo-communication-fields.test.ts`
3. Check TypeScript types: `src/types/database.types.ts`
4. Open an issue on GitHub: [thecubiqo/thecubiqo](https://github.com/thecubiqo/thecubiqo/issues)
