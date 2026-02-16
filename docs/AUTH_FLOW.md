# Authentication Flow Documentation

## Overview

CubiQo implements a comprehensive authentication system using Supabase for authentication management. This document explains the complete auth flow including session refresh, magic link handling, and UI state synchronization.

## Architecture Components

### 1. Proxy Middleware (`src/proxy.ts`)
**Related PRs: #12, #44**

The proxy middleware handles:
- Session refresh on every request via `supabase.auth.getUser()`
- Founders Pass route protection (PIN-based auth)
- Regional routing based on geolocation
- Cookie management for auth state

**Key Features:**
```typescript
// Session refresh - ensures fresh auth state
await supabase.auth.getUser()

// Route protection for admin areas
if (pathname.startsWith('/founders-pass')) {
  const hasPinCookie = request.cookies.get('founders-pass-auth')?.value === 'true'
  // Redirect to PIN entry if unauthorized
}
```

### 2. AuthContext (`src/contexts/AuthContext.tsx`)
**Related PRs: #28, #12**

Centralized auth state management:
- Single source of truth for authentication
- Real-time auth state subscription
- Automatic cleanup on unmount
- Null-safe types throughout

**Usage:**
```typescript
import { useAuth } from '@/hooks/useAuth'

function MyComponent() {
  const { user, profile, isAuthenticated, signInWithEmail, signOut } = useAuth()
  
  if (isAuthenticated) {
    return <div>Welcome {profile?.handle}</div>
  }
  
  return <div>Please sign in</div>
}
```

### 3. Server Client (`src/lib/supabase/server.ts`)
**Related PR: #35**

Server-side authentication for API routes:
- Uses `@supabase/ssr` cookies adapter
- Maintains session across server requests
- Proper cookie handling for Next.js 16+

**Usage in API Routes:**
```typescript
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  
  // Session is automatically maintained
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  // Proceed with authenticated logic
  return Response.json({ user })
}
```

## Auth Flow Diagrams

### Magic Link Flow

```
1. User enters email → signInWithEmail()
   ↓
2. Supabase sends magic link email
   ↓
3. User clicks link → redirects to /auth/callback
   ↓
4. Middleware refreshes session → getUser()
   ↓
5. AuthContext detects SIGNED_IN event
   ↓
6. UI updates immediately (isAuthenticated: true)
   ↓
7. Profile fetched in background
   ↓
8. Full auth state available
```

### Session Persistence Flow

```
Request arrives
   ↓
Proxy Middleware runs → supabase.auth.getUser()
   ↓
Session refreshed (if expired)
   ↓
Auth cookies updated
   ↓
Page renders with fresh session
   ↓
AuthContext subscribes → onAuthStateChange
   ↓
UI reflects current auth state
```

## Key Design Decisions

### Why Middleware Calls getUser()
**PR #12**

Calling `getUser()` on every request ensures:
1. Expired sessions are refreshed automatically
2. Auth cookies stay up-to-date
3. UI never shows stale auth state
4. Magic link redirects work seamlessly

### Why AuthContext Centralizes State
**PR #28**

Centralizing auth in context provides:
1. Single subscription to auth changes
2. Consistent state across all components
3. Easier testing and debugging
4. Proper cleanup on unmount

### Why Server Client Uses SSR Adapter
**PR #35**

The `@supabase/ssr` adapter:
1. Handles cookie reading/writing correctly in Next.js 16+
2. Maintains session across API routes
3. Supports both Pages and App Router
4. Properly handles concurrent requests

## Common Patterns

### Protected Page (Client Component)
```typescript
'use client'

import { useAuth } from '@/hooks/useAuth'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function ProtectedPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, isLoading, router])
  
  if (isLoading) return <div>Loading...</div>
  if (!isAuthenticated) return null
  
  return <div>Protected content</div>
}
```

### Protected API Route
```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Authenticated logic here
  return NextResponse.json({ data: 'Protected data' })
}
```

### Check Auth in Server Component
```typescript
import { createClient } from '@/lib/supabase/server'

export default async function ServerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return <div>Please sign in</div>
  }
  
  return <div>Welcome {user.email}</div>
}
```

## Troubleshooting

### Session Not Persisting
1. Check that proxy middleware is running (`src/proxy.ts`)
2. Verify `getUser()` is called in proxy middleware
3. Ensure cookies are being set correctly
4. Check browser doesn't block cookies

### UI Not Updating After Magic Link
1. Verify AuthContext is wrapping app in `layout.tsx`
2. Check `onAuthStateChange` subscription is active
3. Ensure no race conditions in component mounting
4. Test with `process.env.NODE_ENV === 'development'` logs

### API Route Returns 401
1. Verify server client is created with `await createClient()`
2. Check cookies are being passed in request
3. Ensure Next.js 16+ cookie handling is correct
4. Test with Postman/curl including cookies

### Profile Not Loading
1. Check RLS policies on `profiles` table
2. Verify user ID matches profile ID
3. Ensure profile was created on signup
4. Check for network errors in console

## Security Considerations

### Session Security
- Sessions expire automatically (Supabase default: 1 hour)
- Refresh tokens stored in HTTP-only cookies
- CSRF protection via Supabase SDK
- Secure cookie flags in production

### Route Protection
- Proxy middleware protects sensitive routes
- PIN-based additional security for Founders Pass
- API routes validate session on every request
- Client-side guards are UX only (not security)

### Best Practices
1. Always validate auth on the server side
2. Never trust client-side auth state for security
3. Use proxy middleware for broad route protection
4. Use API route guards for data access
5. Keep sensitive operations server-side

## Testing Auth Flow

### Manual Testing
1. Visit `/auth/login`
2. Enter email
3. Check email for magic link
4. Click link → should redirect and show authenticated UI
5. Refresh page → should stay authenticated
6. Sign out → should clear auth state
7. Try accessing protected route → should redirect

### Automated Testing
See `tests/auth-context.test.ts` for unit tests covering:
- AuthContext exports and structure
- Layout integration
- Hook re-exports
- State management

## Related Documentation

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js Proxy Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [React Context](https://react.dev/reference/react/useContext)

---

*This document reflects the consolidated auth architecture from PRs #12, #28, #35, and #44.*
