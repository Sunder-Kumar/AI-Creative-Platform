# Setup Guide - Authentication & Stripe

## Authentication Issues Fixed

### 1. Stripe Subscription Error - "User not authenticated"

**Problem:** The API route was trying to use client-side Supabase auth on the server.

**Solution:** Fixed the `/api/create-checkout-session` route to use the admin client to get user email from the profile or auth.users table.

### 2. Email Confirmation Issue

**Problem:** Supabase requires email confirmation by default, so users can't log in immediately after signup.

**Solutions:**

#### Option A: Disable Email Confirmation (Recommended for Development)

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers** → **Email**
3. Find **"Confirm email"** setting
4. **Disable** "Enable email confirmations"
5. Save changes

After disabling, users can sign up and log in immediately without email confirmation.

#### Option B: Keep Email Confirmation Enabled (Production)

The app now handles email confirmation properly:

1. **Signup:** Users will see a message to check their email
2. **Email Link:** Users click the confirmation link in their email
3. **Callback:** The app handles the callback at `/auth/callback`
4. **Login:** After confirmation, users can log in normally

**To configure the email redirect URL in Supabase:**
1. Go to **Authentication** → **URL Configuration**
2. Add your site URL: `http://localhost:3000` (for development)
3. Add redirect URL: `http://localhost:3000/auth/callback`

## Testing the Fixes

### Test Stripe Subscription:
1. Sign up or log in
2. Go to Dashboard → Subscribe
3. Click "Subscribe Now"
4. Should redirect to Stripe checkout (use test card: 4242 4242 4242 4242)

### Test Email Confirmation (if enabled):
1. Sign up with a new email
2. Check your email for confirmation link
3. Click the link
4. Should redirect to dashboard automatically

## Environment Variables Required

Make sure you have all these in your `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Common Issues

### "User not authenticated" in Stripe
- ✅ Fixed: Now uses admin client to get user email

### "Email not confirmed" error
- ✅ Fixed: Better error messages and email confirmation flow
- Or disable email confirmation in Supabase settings

### Profile not created on signup
- Make sure you ran the SQL schema in Supabase
- Check that the trigger function is created correctly

### Trial chat counters not updating
- Re-run `supabase/schema.sql` so the `trial_chats_used` and `trial_active` columns exist.
- The `/api/chat` route increments the counter after each trial chat; ensure your Supabase service key is configured so the API route can update profiles.

