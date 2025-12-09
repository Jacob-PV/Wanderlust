# Vercel KV Setup Guide

This guide walks you through setting up Vercel KV (Redis) for database-backed sharing with short URLs.

## What You Get

✅ **Clean, short URLs**: `yourapp.com/trip/a7b3x9` (instead of long compressed URLs)
✅ **Works for ANY size itinerary**: No URL length limits
✅ **View tracking**: See how many times your itinerary has been viewed
✅ **90-day expiration**: Automatic cleanup of old itineraries
✅ **Free tier**: 5,000 shares/month, 10,000 views/month
✅ **1-click setup**: No configuration needed on Vercel

## Setup Instructions

### Option 1: Via Vercel Dashboard (Recommended)

1. **Go to your Vercel project**
   - Visit [vercel.com/dashboard](https://vercel.com/dashboard)
   - Select your `travel-itenerary` project

2. **Navigate to Storage**
   - Click the "Storage" tab in the top navigation
   - Click "Create Database"

3. **Create KV Database**
   - Select "KV" (Redis)
   - Name it: `itinerary-storage`
   - Click "Create"

4. **Connect to Project**
   - Click "Connect to Project"
   - Select your project from the dropdown
   - Click "Connect"
   - ✅ Done! Environment variables are automatically added

5. **Verify Environment Variables**
   - Go to "Settings" → "Environment Variables"
   - You should see:
     - `REDIS_URL` (this is all you need!)

### Option 2: Via Vercel CLI

```bash
# Install Vercel CLI (if you haven't already)
npm install -g vercel

# Link to your project
vercel link

# Create KV database
vercel storage create kv itinerary-storage

# Pull environment variables to local
vercel env pull .env.local
```

## Local Development Setup

To test the share feature locally, you need to pull the Vercel KV environment variables:

```bash
# Pull environment variables from Vercel
vercel env pull .env.local

# Your .env.local should now have:
# REDIS_URL="redis://default:xxxxx@your-kv-url.upstash.io:6379"

# Start development server
npm run dev
```

**Important**: Do NOT commit `.env.local` to git. It's already in `.gitignore`.

## Testing the Share Feature

### 1. Generate an Itinerary
```bash
npm run dev
```
- Open http://localhost:3000
- Create a multi-day itinerary (e.g., Paris, 3 days)

### 2. Click the Share Button
- After itinerary is generated, click green "Share" button
- You should see a modal with a short URL like:
  - `http://localhost:3000/trip/a7b3x9`

### 3. Test the Share Link
- Copy the URL
- Open in new incognito window
- Itinerary should load correctly
- Refresh page → view count should increment

### 4. Test Social Sharing
- Click Twitter, Facebook, WhatsApp, or Email buttons
- Links should include the short URL

## What Gets Stored in Vercel KV

For each shared itinerary, we store:

```typescript
// The itinerary data
itinerary:abc123 → { city, days, activities, ... }

// Metadata for analytics
meta:abc123 → { id, createdAt, city, dayCount, views }

// View counts
views:abc123 → { count: 42 }

// Total shares counter
stats:total_shares → 1234
```

All data expires after **90 days** automatically.

## Monitoring Usage

### Via Vercel Dashboard
1. Go to your project → Storage → itinerary-storage
2. View metrics:
   - Total keys stored
   - Commands executed
   - Data transferred

### Programmatically
Add a stats page (optional):

```typescript
// app/stats/page.tsx
import { getStats } from '@/lib/share-db';

export default async function StatsPage() {
  const stats = await getStats();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Sharing Statistics</h1>
      <p>Total shares: {stats.totalShares}</p>
    </div>
  );
}
```

## Free Tier Limits

**Vercel KV Free Tier:**
- ✅ 256 MB storage (thousands of itineraries)
- ✅ 30,000 commands per month
- ✅ 100 concurrent connections

**Capacity Estimates:**
- **Save itinerary**: ~3 commands
- **Load itinerary**: ~2 commands
- **Track view**: ~1 command

**Monthly Capacity (Free):**
- ~5,000 itinerary shares
- ~10,000 itinerary views

**After Free Tier:**
- $0.20 per 100,000 commands
- Very affordable for most apps

## Deployment to Production

### First Deployment
```bash
# Deploy to Vercel
vercel --prod

# Environment variables are already set from dashboard
# No additional configuration needed!
```

### After Code Changes
```bash
git add .
git commit -m "Add database-backed sharing"
git push origin main

# Auto-deploys if connected to GitHub
# Or manually: vercel --prod
```

## Troubleshooting

### "Error: No KV credentials found" or "REDIS_URL is not defined"

**Cause**: Environment variables not set

**Fix**:
```bash
# Pull from Vercel
vercel env pull .env.local

# Verify REDIS_URL is present
cat .env.local | grep REDIS_URL

# Should show: REDIS_URL="redis://default:xxxxx@..."

# Restart dev server
npm run dev
```

### "Itinerary not found" when opening share link

**Possible causes**:
1. **Expired**: Itineraries expire after 90 days
2. **Wrong environment**: Created in local, trying to access in production (or vice versa)
3. **ID typo**: Check the URL for typos

**Fix**:
- Create new share in the same environment you're testing
- Check Vercel KV dashboard to see if data exists

### Share button shows "Failed to create share link"

**Check**:
1. Console for error messages
2. Network tab for failed API calls
3. Vercel KV dashboard for connectivity issues

**Common fixes**:
```bash
# Verify environment variable
cat .env.local | grep REDIS_URL

# Should show: REDIS_URL="redis://default:xxxxx@..."
# If empty, pull again: vercel env pull .env.local
```

### Build succeeds locally but fails on Vercel

**Check**:
- TypeScript errors: `npx tsc --noEmit`
- Build locally: `npm run build`
- Vercel build logs for specific error

## Migrating from Old Share System

The old URL-encoded share system (`/share?data=...`) still works and is kept for backward compatibility:

- **Old shares**: Continue to work via `/share` page
- **New shares**: Use database via `/trip/[id]` page
- Both systems can coexist

To deprecate old system eventually:
1. Remove `/app/share/page.tsx`
2. Remove `/lib/share.ts` (old URL encoding)
3. Remove `/app/api/shorten-url/route.ts` (unused)

## Security

**Data Privacy:**
- ✅ No user accounts needed
- ✅ No personal data collected
- ✅ Itineraries are public to anyone with the link
- ✅ Auto-deletion after 90 days

**Best Practices:**
- Don't share itineraries with sensitive information
- Treat share links like public URLs
- Can implement deletion feature if needed (code already exists in `lib/share-db.ts`)

## Next Steps

1. ✅ Set up Vercel KV (follow steps above)
2. ✅ Test locally with `vercel env pull`
3. ✅ Create test itinerary and share
4. ✅ Deploy to production
5. ✅ Monitor usage in Vercel dashboard

## Need Help?

- **Vercel KV Docs**: https://vercel.com/docs/storage/vercel-kv
- **Vercel Support**: https://vercel.com/help
- **Check server logs**: Vercel dashboard → Deployments → View Function Logs

---

**Setup time**: ~5 minutes
**Cost**: Free for most apps
**Benefits**: Clean URLs, unlimited itinerary size, view tracking

🚀 Happy sharing!
