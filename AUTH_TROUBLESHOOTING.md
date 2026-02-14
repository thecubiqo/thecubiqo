# Authentication Troubleshooting Guide

## Common Auth Issues and Solutions

### Issue 1: 404 Error After Clicking Magic Link

**Status**: ✅ FIXED

**Problem**: Clicking the magic link in email resulted in 404 error because `/auth/error` page didn't exist.

**Solution**: Created `/auth/error` page to handle authentication failures gracefully.

**Files Changed**:
- `src/app/auth/error/page.tsx` - New error page
- `src/app/auth/callback/route.ts` - Improved error handling

---

### Issue 2: Magic Link Not Working

**Possible Causes**:

1. **Supabase Auth Settings Not Configured**
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add your site URL (e.g., `http://localhost:3000` for dev)
   - Add redirect URLs:
     - `http://localhost:3000/auth/callback` (local dev)
     - `https://yourdomain.com/auth/callback` (production)

2. **Email Provider Not Set Up**
   - Go to Supabase Dashboard → Authentication → Email Templates
   - Ensure email provider is configured
   - Check SMTP settings if using custom provider

3. **Environment Variables Missing**
   - Verify `NEXT_PUBLIC_SUPABASE_URL` is set
   - Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set
   - Run `npm run validate-env` to check

4. **Magic Link Expired**
   - Magic links expire after a certain time (default: 1 hour)
   - Request a new magic link

5. **Magic Link Already Used**
   - Each magic link can only be used once
   - Request a new magic link if needed

---

### Issue 3: "Auth Callback Failed" Error

**Symptoms**: Redirected to `/auth/error?error=auth_callback_failed`

**Possible Causes**:

1. **Code Exchange Failed**
   - Check browser console for error messages
   - Verify Supabase credentials are correct
   - Check Supabase service status

2. **Network Issues**
   - Check internet connection
   - Check if Supabase API is accessible
   - Look for CORS errors in browser console

**Debug Steps**:
```bash
# Check if Supabase is configured
npm run validate-env

# Check browser console for detailed error messages
# Open DevTools → Console tab

# Check Supabase logs
# Go to Supabase Dashboard → Logs → Auth Logs
```

---

### Issue 4: "Invalid Code" Error

**Symptoms**: Redirected to `/auth/error?error=invalid_code`

**Possible Causes**:

1. **No Auth Code in URL**
   - Magic link didn't include the code parameter
   - Email template might be incorrect

2. **Malformed URL**
   - Check if the magic link URL is complete
   - Verify email template in Supabase includes `{{ .ConfirmationURL }}`

**Fix**:
- Go to Supabase Dashboard → Authentication → Email Templates
- Verify "Confirm signup" template uses correct URL variable
- Reset to default template if customized

---

### Issue 5: "Session Error" Error

**Symptoms**: Redirected to `/auth/error?error=session_error`

**Possible Causes**:

1. **User Fetch Failed After Auth**
   - Session was created but user data couldn't be retrieved
   - Possible Supabase API issue

2. **RLS Policies Too Restrictive**
   - User might be blocked by Row Level Security policies
   - Check Supabase → Database → Policies

**Debug Steps**:
```sql
-- Run in Supabase SQL Editor to check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

---

### Issue 6: Profile Not Created

**Symptoms**: Auth succeeds but user has no profile

**Possible Causes**:

1. **RLS Prevents Profile Creation**
   - Check if authenticated users can insert into profiles table
   - Verify policy: "Users can insert own profile"

2. **Database Trigger Failed**
   - Check if `auto_generate_handle` trigger exists
   - Check Supabase logs for errors

**Fix**:
```sql
-- Verify trigger exists
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'trg_auto_generate_handle';

-- Manually create profile if needed
INSERT INTO profiles (id, email) 
VALUES ('YOUR_USER_ID', 'user@example.com');
```

---

## Debugging Checklist

### Before Filing a Bug Report:

- [ ] Run `npm run validate-env` - are all variables set?
- [ ] Check Supabase Dashboard → Authentication → URL Configuration
- [ ] Check browser console for error messages
- [ ] Check Supabase Dashboard → Logs → Auth Logs
- [ ] Try requesting a new magic link
- [ ] Try in incognito/private browser window
- [ ] Verify email was actually sent (check spam folder)
- [ ] Test with a different email address

### Logs to Collect:

1. **Browser Console Logs**:
   - Open DevTools → Console
   - Look for errors starting with `[Auth Callback]`

2. **Supabase Auth Logs**:
   - Go to Supabase Dashboard → Logs → Auth Logs
   - Filter by your user email or timestamp

3. **Network Logs**:
   - Open DevTools → Network tab
   - Filter by "auth" or "callback"
   - Check for failed requests

---

## Quick Fixes

### Force Signout and Retry:
```javascript
// Open browser console and run:
localStorage.clear()
sessionStorage.clear()
// Then refresh the page
```

### Test Auth Manually:
```bash
# Visit these URLs to test error page:
http://localhost:3000/auth/error?error=auth_callback_failed
http://localhost:3000/auth/error?error=invalid_code
http://localhost:3000/auth/error?error=session_error
```

### Verify Supabase Connection:
```javascript
// Open browser console and run:
const { createClient } = await import('@supabase/supabase-js')
const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_ANON_KEY'
)
const { data, error } = await supabase.auth.getSession()
console.log('Session:', data, 'Error:', error)
```

---

## Production Checklist

Before deploying to production:

- [ ] Update Supabase Auth URL Configuration with production URLs
- [ ] Set `NEXT_PUBLIC_APP_URL` to production domain
- [ ] Test magic link flow in production environment
- [ ] Configure custom email templates (optional)
- [ ] Set up email rate limiting (optional)
- [ ] Test error pages work correctly
- [ ] Monitor Supabase Auth Logs after launch

---

## Support

If you're still experiencing issues:

1. Check [Supabase Documentation](https://supabase.com/docs/guides/auth)
2. Search [Supabase GitHub Issues](https://github.com/supabase/supabase/issues)
3. Join [Supabase Discord](https://discord.supabase.com)
4. Contact CubiQo support at support@cubiqo.ai

---

**Last Updated**: 2026-02-14
**Status**: Auth error page implemented and working
