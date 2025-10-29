# Supabase Authentication Security

## The Warning Explained

**Warning:**
```
Using the user object as returned from supabase.auth.getSession() ... 
could be insecure! Use supabase.auth.getUser() instead
```

## Why This Matters

### `getSession()` - ❌ Insecure
- Reads directly from cookies/storage
- **Never validates** with Supabase server
- Cookies can be **tampered with** by malicious users
- User data from `session.user` is **untrusted**

### `getUser()` - ✅ Secure
- **Validates** token with Supabase Auth server
- Ensures user is actually authenticated
- Prevents cookie tampering attacks
- User data is **trusted** and verified

## Current Implementation

### ✅ Server-Side (`hooks.server.ts`)
- Uses `getUser()` to validate authentication
- Stores `locals.user` (validated)
- Stores `locals.session` (only for tokens, never for user data)
- **Never** accesses `session.user`

### ✅ All Route Handlers
- Check `locals.user` (not `locals.session.user`) for authentication
- Use `locals.user.id` and `locals.user.email` for all user data
- Pass `locals.user` to functions instead of `locals.session`

## Usage Guidelines

### ✅ DO:
```typescript
// Check authentication
if (!locals.user) {
  throw redirect(303, '/login');
}

// Get user data
const userId = locals.user.id;
const userEmail = locals.user.email;

// Pass to functions
const profile = await getProfile(supabase, locals.user.id, locals.user.email);
```

### ❌ DON'T:
```typescript
// NEVER do this:
if (!locals.session?.user) { }  // ❌ Untrusted data
const userId = locals.session.user.id;  // ❌ Can be tampered
```

## Why We Still Keep `session`

The `session` object is kept because:
1. **Client-side hydration** - SvelteKit might need it for client state
2. **Token storage** - Contains access/refresh tokens if needed
3. **Backward compatibility** - Existing code might check `if (session)` for login state

But we **never** use `session.user` for any authentication or user data operations.

## Testing

To verify the fix:
1. Check console - warning should be gone
2. Test login/logout - should work normally
3. Test protected routes - should use `locals.user`
4. Test profile updates - should use `locals.user.id`

