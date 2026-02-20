# Cubiqo Examples

This directory contains example code demonstrating how to use various Cubiqo features.

## Available Examples

### 📧 `cubiqo-communication-usage.ts`

Demonstrates how to use the auto-generated Cubiqo email and phone fields for user communication.

**Key Examples:**
- Get user's communication details
- Send morning reminders via phone
- Send research emails
- Find users by Cubiqo email
- List all communication channels
- Batch communication to multiple users
- Type-safe field access

**Related Documentation:**
- [CUBIQO_COMMUNICATION_FIELDS.md](../CUBIQO_COMMUNICATION_FIELDS.md) - Feature documentation
- [CUBIQO_COMMUNICATION_VISUAL_SUMMARY.txt](../CUBIQO_COMMUNICATION_VISUAL_SUMMARY.txt) - Visual guide

## Usage

These examples are meant to be copied and adapted for your use case. They demonstrate best practices for:

1. **Type Safety** - Using TypeScript types from `@/types`
2. **Database Access** - Using Supabase client correctly
3. **Error Handling** - Proper error checking and responses
4. **Code Organization** - Modular, reusable functions

## Integration Notes

Many examples include "TODO" comments for services that need to be integrated:

```typescript
// TODO: Integrate with Twilio or similar service
// TODO: Integrate with Resend or similar email service
```

These placeholders indicate where you should add your actual service integrations.

## Testing Examples

You can import and test these examples in your tests:

```typescript
import { getUserCommunicationDetails } from '@/examples/cubiqo-communication-usage'

// Test in your test file
describe('Communication', () => {
  it('should get user details', async () => {
    const details = await getUserCommunicationDetails()
    expect(details).toBeDefined()
  })
})
```

## Contributing Examples

If you create a useful example that demonstrates a feature, consider adding it to this directory!

Guidelines:
1. Include clear comments explaining what the code does
2. Use TypeScript for type safety
3. Follow the existing code style
4. Add the example to this README
5. Include usage examples in comments
