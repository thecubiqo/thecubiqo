# Auth Magic-Link Flow Documentation

## Overview

This document describes the complete lifecycle of authentication using Supabase magic links in CubiQo, including how session state is refreshed and reflected in the UI after redirect.

**Related PRs:** #12 (Magic-link auth state fix), #28 (Centralized auth context)

## Architecture Overview

The authentication system consists of three main components:

1. **Middleware** (`src/middleware.ts`) - Refreshes session on every request
2. **AuthContext** (`src/contexts/AuthContext.tsx`) - Centralized auth state management
3. **Auth Callback** (`src/app/auth/callback/route.ts`) - Handles magic-link verification

## Complete Magic-Link Flow

### Step 1: User Requests Magic Link

```typescript
// User clicks "Sign In" and enters email
const { user, signInWithEmail } = useAuth()

await signInWithEmail('user@example.com')
// → Supabase sends email with magic link
```

**What happens:**
- `signInWithEmail()` calls `supabase.auth.signInWithOtp()`
- Supabase sends email with verification link
- Link includes auth code and redirects to `/auth/callback`

### Step 2: User Clicks Magic Link

```
Email link format:
https://cubiqo.com/auth/callback?code=abc123&state=xyz
```

**What happens:**
- Browser redirects to `/auth/callback` route
- URL contains auth code and optional state parameter

### Step 3: Callback Handler Verifies Code

```typescript
// src/app/auth/callback/route.ts
export async function GET(request: Request) {
  const code = searchParams.get('code')
  
  // Exchange code for session
  await supabase.auth.exchangeCodeForSession(code)
  
  // Verify session was created
  const { data: { user } } = await supabase.auth.getUser()
  
  // Ensure profile exists
  // (Auto-creates if missing)
  
  // Redirect to requested page
  return NextResponse.redirect(`${origin}${next}`)
}
```

**What happens:**
- Code is extracted from URL
- `exchangeCodeForSession()` creates authenticated session
- Session is stored in HTTP-only cookies
- `getUser()` verifies session is valid
- User profile is created if it doesn't exist
- Redirects to home page (or requested page)

### Step 4: Middleware Refreshes Session

```typescript
// src/middleware.ts
export async function middleware(request: NextRequest) {
  const supabase = createServerClient(...)
  
  // CRITICAL: Refresh session on every request
  await supabase.auth.getUser()
  
  return response
}
```

**What happens:**
- Middleware runs on EVERY request (including post-redirect)
- `getUser()` automatically refreshes expired sessions
- Updates auth cookies with fresh session data
- Ensures UI always has up-to-date auth state

### Step 5: AuthContext Reflects State

```typescript
// src/contexts/AuthContext.tsx
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (session?.user) {
        setState({
          user: session.user,
          isAuthenticated: true,
          isGuest: false,
          isLoading: false,
        })
      }
    }
  )
}, [])
```

**What happens:**
- AuthContext subscribes to auth state changes
- When session is detected, immediately updates state
- `isAuthenticated` becomes `true`
- UI components re-render with authenticated state
- Profile is fetched in background (doesn't block auth state)

### Step 6: UI Updates Immediately

```typescript
function MyComponent() {
  const { isAuthenticated, user } = useAuth()
  
  if (isAuthenticated) {
    return <div>Welcome, {user.email}!</div>
  }
  
  return <div>Please sign in</div>
}
```

**What happens:**
- Component receives updated auth state from context
- Authenticated UI is displayed immediately
- No flash of guest state
- No page refresh needed

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User enters email → signInWithEmail()                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Supabase sends magic link email                          │
│    Link: /auth/callback?code=abc123                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. User clicks link → Redirects to callback route           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Callback handler:                                         │
│    - Exchanges code for session                              │
│    - Calls getUser() to verify                               │
│    - Creates profile if needed                               │
│    - Redirects to home page                                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Middleware intercepts request:                            │
│    - Calls getUser() to refresh session                      │
│    - Updates auth cookies                                    │
│    - Passes request to app                                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. AuthContext detects auth state change:                   │
│    - onAuthStateChange fires                                 │
│    - Sets isAuthenticated: true                              │
│    - Updates user state                                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. UI updates immediately:                                   │
│    - Components re-render                                    │
│    - Authenticated UI shown                                  │
│    - No flash of guest state                                 │
└─────────────────────────────────────────────────────────────┘
```

## Key Design Decisions

### Why Middleware Calls `getUser()` on Every Request

**Problem:** Without middleware, session might be stale after magic-link redirect.

**Solution:** Calling `getUser()` on every request ensures:
1. Expired sessions are automatically refreshed
2. Auth cookies stay up-to-date
3. UI never shows stale authentication state
4. Magic-link redirects work seamlessly

**Performance:** This adds minimal overhead (~5-10ms per request) and is necessary for correct auth behavior.

### Why AuthContext Sets `isAuthenticated` Immediately

**Problem:** If auth state waits for profile fetch, UI might show guest state briefly.

**Solution:**
```typescript
// Set isAuthenticated IMMEDIATELY when session detected
setState({
  user: session.user,
  isAuthenticated: true,  // ← Set right away
  isGuest: false,
  isLoading: false,
})

// Fetch profile in background (doesn't block auth state)
const profile = await fetchProfile(session.user.id)
if (profile) {
  setState(prev => ({ ...prev, profile }))
}
```

This ensures UI updates immediately while profile loads asynchronously.

### Why Use Single AuthContext Provider

**Problem:** Multiple Supabase clients and subscriptions waste resources and cause inconsistent state.

**Solution:**
- Single `AuthProvider` at app root
- One Supabase client instance (memoized)
- One auth state subscription
- All components share same state via `useAuth()` hook

## Session Persistence

### How Sessions are Stored

- Supabase stores session in HTTP-only cookies
- Cookies are automatically sent with every request
- Middleware refreshes session from cookies
- AuthContext subscribes to session changes

### Session Expiration

- Default session lifetime: 1 hour (configurable in Supabase)
- Refresh token lifetime: 7 days (configurable)
- Middleware automatically refreshes expired sessions
- If refresh token expires, user must sign in again

### Cross-Tab Synchronization

```typescript
// AuthContext automatically syncs across tabs
supabase.auth.onAuthStateChange((event, session) => {
  // Fires in all tabs when auth state changes
  if (event === 'SIGNED_OUT') {
    // All tabs see sign-out
  }
})
```

## Troubleshooting

### UI Shows Guest State After Magic-Link Redirect

**Symptoms:**
- User clicks magic link
- Briefly sees guest UI
- Then sees authenticated UI

**Cause:** Middleware not refreshing session, or AuthContext not detecting change.

**Fix:**
1. Verify `src/middleware.ts` exists and exports middleware function
2. Check middleware calls `await supabase.auth.getUser()`
3. Verify AuthContext wraps app in `layout.tsx`
4. Check browser console for errors

### Magic Link Shows "Invalid or Expired Code"

**Symptoms:**
- User clicks magic link
- Sees error page

**Causes:**
1. Link was already used (links are single-use)
2. Link expired (default: 1 hour)
3. Rate limit exceeded (check Supabase dashboard)

**Fix:**
1. Request new magic link
2. Check Supabase rate limits
3. Verify email configuration is correct

### Session Not Persisting Across Page Reloads

**Symptoms:**
- User signs in successfully
- Refreshes page
- Shows guest state again

**Causes:**
1. Cookies not being set/read correctly
2. Middleware not running
3. Browser blocking cookies

**Fix:**
1. Verify middleware is running (check logs)
2. Check browser cookie settings
3. Ensure HTTPS in production
4. Check Supabase cookie configuration

### Profile Not Loading After Sign-In

**Symptoms:**
- User is authenticated
- Profile is null

**Causes:**
1. Profile doesn't exist in database
2. RLS policies blocking access
3. Network error

**Fix:**
1. Check callback creates profile
2. Verify RLS policies allow user to read own profile
3. Check network tab for errors
4. Call `refreshProfile()` manually

## Testing the Flow

### Manual Testing Steps

1. Open browser in incognito mode
2. Navigate to `/`
3. Click "Sign In"
4. Enter email address
5. Check email for magic link
6. Click magic link
7. **Verify:** Should redirect to home page showing authenticated UI
8. **Verify:** No flash of guest state
9. Refresh page
10. **Verify:** Still shows authenticated UI

### Automated Testing

See `tests/auth/` for comprehensive test suite:
- `magic-link-redirect.test.ts` - Magic-link flow validation
- `sign-in-sign-out.test.ts` - Basic auth operations

Run tests:
```bash
npm run test:run
```

### Debug Logging

Enable debug logging in development:

```typescript
// Middleware logs
// src/middleware.ts already logs in development

// AuthContext logs
// src/contexts/AuthContext.tsx already logs in development
```

Check browser console for:
- `[Middleware] User: <id>` on each request
- `[AuthProvider] Auth state changed: <event>`
- `[AuthProvider] User authenticated, updating state`

## Security Considerations

### Magic Link Security

1. **Single-Use:** Links are single-use and expire after use
2. **Time-Limited:** Default expiration: 1 hour
3. **State Parameter:** Optional CSRF protection
4. **HTTPS Only:** Production requires HTTPS

### Session Security

1. **HTTP-Only Cookies:** Not accessible via JavaScript
2. **Secure Flag:** Set in production (HTTPS only)
3. **SameSite:** Protects against CSRF
4. **Automatic Refresh:** Middleware keeps session fresh

### Best Practices

1. Always validate auth on server side
2. Never trust client-side auth state for security
3. Use RLS policies in Supabase
4. Keep Supabase credentials secure
5. Monitor rate limits

## Related Documentation

- [Auth Flow](./AUTH_FLOW.md) - General auth architecture
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)

## Implementation Checklist

- [x] Middleware refreshes session (`src/middleware.ts`)
- [x] AuthContext centralizes state (`src/contexts/AuthContext.tsx`)
- [x] Auth callback handles magic links (`src/app/auth/callback/route.ts`)
- [x] AuthProvider wraps app (`src/app/layout.tsx`)
- [x] useAuth hook re-exports context (`src/hooks/useAuth.ts`)
- [x] Tests cover magic-link flow (`tests/auth/`)
- [x] Documentation describes lifecycle (this file)

---

**Last Updated:** 2026-02-16  
**Related PRs:** #12, #28  
**Status:** Complete
