# ⬤ SUPABASE SETUP GUIDE

## Overview

This guide will help you set up Supabase for Obsidian Reality's live data integration.

The three sovereign layers require real-time data:
- **Evidentia T1**: Properties with Merkle proofs
- **Vaticor AE**: Market signals with predictive intelligence
- **VIPCIRCL**: Ghost offers in the Sicario queue

---

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - **Name**: `obsidian-reality` (or your preferred name)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
6. Click "Create new project"
7. Wait for provisioning (~2 minutes)

---

## Step 2: Get Your API Keys

Once your project is ready:

1. Go to **Project Settings** (gear icon in sidebar)
2. Navigate to **API** section
3. Copy the following values:

   ```
   Project URL: https://xxxxx.supabase.co
   anon public key: eyJxxx...
   service_role key: eyJxxx... (keep this SECRET!)
   ```

---

## Step 3: Configure Environment Variables

1. In the `apps/web` directory, create `.env.local`:

   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and fill in your Supabase values:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...your-anon-key
   SUPABASE_SERVICE_KEY=eyJxxx...your-service-role-key
   ```

3. **IMPORTANT**: Never commit `.env.local` to git!

---

## Step 4: Run Database Migration

The migration file creates all necessary tables:
- `properties`
- `transactions`
- `market_signals`
- `merkle_proofs`

### Option A: Using Supabase CLI (Recommended)

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

   (Find your project ref in the URL: `https://app.supabase.com/project/YOUR-REF-HERE`)

4. Run migrations:
   ```bash
   supabase db push
   ```

### Option B: Using Supabase Dashboard

1. Go to your project in Supabase
2. Click **SQL Editor** in the sidebar
3. Open the file: `supabase/migrations/001_obsidian_core.sql`
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run**
7. Verify all tables were created (check the **Database** > **Tables** section)

---

## Step 5: Seed Initial Data

Now populate the database with sample data:

```bash
cd apps/web
npx tsx scripts/seedLiveData.ts
```

You should see:
```
⬤ SEEDING LIVE OBSIDIAN DATA...
⬤ SEEDING PROPERTIES...
  ✓ Property: 123 Silent Valley Rd | Root: a1f4c8e9b2d3a5f7...
  ✓ Property: 889 Ocean View Dr | Root: b2e5f9c3d6a0f8b1...
  ...
⬤ PROPERTIES SEEDED

⬤ SEEDING MARKET SIGNALS...
  ✓ Signal: zoning_shift | Location: 9v6g | Confidence: 92%
  ...
⬤ MARKET SIGNALS SEEDED

⬤ SEEDING GHOST OFFERS...
  ✓ Ghost Offer: ghost-1234... | Status: active | 94.2% of target
  ...
⬤ GHOST OFFERS SEEDED

⬤ LIVE DATA SEEDED SUCCESSFULLY
⬤ THE DATABASE BREATHES
```

---

## Step 6: Verify Real-Time Subscriptions

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Navigate to: `http://localhost:3000/dashboard/live`

3. You should see:
   - Live properties with Merkle proofs (Evidentia)
   - Market signals with confidence scores (Vaticor)
   - Active ghost offers with deadlines (VIPCIRCL)
   - A pulsing "LIVE" indicator in the header

4. Open your browser console and check for:
   ```
   ⬤ LIVE DIRECTIVE: {...}
   ```

---

## Step 7: Test Real-Time Updates

To verify real-time subscriptions are working:

1. Keep the live dashboard open in your browser
2. Go to Supabase Dashboard > **Table Editor**
3. Add a new property or update an existing one
4. Watch the dashboard update **instantly** without refresh!

Example test:
1. Go to `properties` table
2. Update a property's `status` from `monitoring` to `acquiring`
3. The card on your dashboard should update immediately

---

## Architecture Notes

### Real-Time Subscriptions

The app uses Supabase's real-time subscriptions via PostgreSQL's logical replication:

```typescript
const channel = supabase
  .channel('properties-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'properties' }, (payload) => {
    // Handle INSERT, UPDATE, DELETE
  })
  .subscribe();
```

### Row Level Security (RLS)

All tables have RLS enabled:
- **Authenticated users** can read all data
- **Service role** can insert/update/delete (for seeding and system operations)

To customize access:
1. Go to **Authentication** > **Policies**
2. Modify policies per table
3. Example: Restrict users to only see their own properties

---

## Troubleshooting

### Issue: "Failed to fetch" error

**Solution**: Check that your environment variables are set correctly in `.env.local`

### Issue: Real-time subscriptions not working

**Solution**:
1. Verify Realtime is enabled: **Database** > **Replication** > Enable for all tables
2. Check browser console for WebSocket errors

### Issue: Seed script fails with "permission denied"

**Solution**: Make sure you're using the `SUPABASE_SERVICE_KEY` (not the anon key) in the seed script

### Issue: CORS errors

**Solution**: Add your local dev URL to allowed origins:
1. **Settings** > **API** > **API Settings**
2. Add `http://localhost:3000` to allowed origins

---

## Next Steps

Once Supabase is set up:

1. **Add authentication**: Integrate Clerk for user management
2. **Connect RENTCAST API**: Pull real property data
3. **Implement MPC network**: For secure ghost offer execution
4. **Add WebSockets**: For real-time collaboration
5. **Deploy to production**: Vercel + Supabase production instance

---

## Resources

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Real-time](https://supabase.com/docs/guides/realtime)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

⬤ THE DATABASE AWAITS. THE SOVEREIGNS ARE READY TO BREATHE.
