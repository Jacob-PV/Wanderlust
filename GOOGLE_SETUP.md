# Google Places API Setup Guide

This guide walks you through setting up Google Places API integration to enable real reviews, ratings, photos, and additional details for itinerary activities.

## Overview

The Google Places integration adds:
- ⭐ Real star ratings (1-5)
- 💬 Actual user reviews with names and photos
- 📸 Place photos
- 💵 Price level indicators ($, $$, $$$, $$$$)
- ⏰ Open/closed status
- 📞 Phone numbers and websites
- 📍 Accurate addresses from Google

## Cost Information

### Pricing (as of 2024)
- **Text Search**: $32 per 1,000 requests
- **Place Details**: $17 per 1,000 requests
- **Photos**: $7 per 1,000 requests (optional, client-side)
- **Total per place**: ~$0.049 (Text Search + Place Details)

### Free Tier
- Google provides **$200 free credit per month**
- This covers approximately **4,000 place enrichments per month**
- For a typical itinerary with 6-8 activities: ~500-800 itineraries/month free

### Cost Optimization Built-in
- ✅ **24-hour server-side caching** reduces repeat calls
- ✅ **Only essential fields requested** to minimize costs
- ✅ **Graceful degradation** - app works without Google data
- ✅ **Progressive loading** - enrichment happens after itinerary loads

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** → **New Project**
3. Enter project name: `Travel Itinerary Generator`
4. Click **Create**
5. Wait for project creation (takes ~30 seconds)
6. Select your new project from the dropdown

## Step 2: Enable Required APIs

1. In the Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for and enable each of these APIs:

### Required APIs:
   - ✅ **Places API** - For place details and reviews
   - ✅ **Places API (New)** - For enhanced features (optional but recommended)
   - ✅ **Geocoding API** - For location search (may already be enabled)

### How to Enable:
   1. Search for "Places API"
   2. Click on it
   3. Click **Enable**
   4. Repeat for each API above

## Step 3: Create API Credentials

### Server-Side API Key (Required)

This key is used for Text Search and Place Details (never exposed to browser).

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **API Key**
3. Copy the API key (starts with `AIzaSy...`)
4. Click **Edit API key** (pencil icon)
5. Name it: `Server-Side Places Key`
6. Under **API restrictions**:
   - Select **Restrict key**
   - Check: ✅ Places API
   - Check: ✅ Places API (New)
   - Check: ✅ Geocoding API
7. Click **Save**

**Add to `.env.local`:**
```env
GOOGLE_PLACES_API_KEY=AIzaSy_your_actual_key_here
```

### Client-Side API Key (Optional - for Photos)

This key is exposed to the browser for displaying Google Place photos.

1. Click **+ CREATE CREDENTIALS** → **API Key**
2. Copy the API key
3. Click **Edit API key**
4. Name it: `Client-Side Photos Key`
5. Under **Application restrictions**:
   - Select **HTTP referrers (web sites)**
   - Add referrers:
     ```
     http://localhost:3000/*
     https://yourdomain.com/*
     https://*.vercel.app/*
     ```
6. Under **API restrictions**:
   - Select **Restrict key**
   - Check: ✅ Places API
7. Click **Save**

**Add to `.env.local`:**
```env
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=AIzaSy_your_client_key_here
```

## Step 4: Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your keys:
   ```env
   # Required
   OPENAI_API_KEY=sk-proj-xxxxx
   GOOGLE_PLACES_API_KEY=AIzaSy_your_server_key_here

   # Optional (for photos)
   NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=AIzaSy_your_client_key_here
   ```

3. Save the file

## Step 5: Test the Integration

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Generate an itinerary with a popular city (e.g., "New York")

3. Check for Google Places enrichment:
   - ⭐ Star ratings should appear below activity names
   - 💬 Reviews should load progressively
   - 📸 Photos should display (if client key configured)
   - ⏰ Open/closed status badges
   - 📞 Website and phone number links

4. Check browser console for any errors:
   - Open DevTools (F12)
   - Look for "Could not enrich" messages (normal for some places)
   - Check for API errors (403 = wrong key, 429 = quota exceeded)

## Step 6: Set Up Billing Alerts (Recommended)

Protect yourself from unexpected charges:

1. Go to [Google Cloud Billing](https://console.cloud.google.com/billing)
2. Select your billing account
3. Click **Budgets & alerts** in left menu
4. Click **CREATE BUDGET**
5. Configure:
   - **Name**: Travel App Monthly Budget
   - **Budget amount**: $10 (or your comfort level)
   - **Alert threshold**: 50%, 75%, 90%, 100%
6. Add your email for alerts
7. Click **Finish**

## Step 7: Production Deployment (Vercel)

### Add Environment Variables to Vercel

1. Go to your project on [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Settings** → **Environment Variables**
3. Add each variable:
   - Key: `GOOGLE_PLACES_API_KEY`
   - Value: `AIzaSy_your_server_key_here`
   - Environments: ✅ Production, ✅ Preview, ✅ Development
4. Add client key (if using photos):
   - Key: `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`
   - Value: `AIzaSy_your_client_key_here`
   - Environments: ✅ Production, ✅ Preview, ✅ Development
5. Click **Save**

### Update API Key Restrictions

1. Go back to [Google Cloud Credentials](https://console.cloud.google.com/apis/credentials)
2. Edit **Client-Side Photos Key**
3. Under **HTTP referrers**, add:
   ```
   https://your-vercel-domain.vercel.app/*
   https://*.vercel.app/*
   ```
4. Click **Save**

### Redeploy

1. Trigger a new deployment:
   ```bash
   git push origin main
   ```
2. Or manually redeploy from Vercel dashboard

## Troubleshooting

### "Google Places API is not configured" Error
- ✅ Check that `GOOGLE_PLACES_API_KEY` is in `.env.local`
- ✅ Restart dev server after adding env variables
- ✅ Verify no typos in variable name

### "Place not found" for Activities
- ✅ Normal for some activities (AI-generated names may not match Google)
- ✅ App gracefully falls back to OpenAI data only
- ✅ More common with generic names like "Local Coffee Shop"

### Photos Not Loading
- ✅ Check that `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` is set
- ✅ Verify API key has Places API enabled
- ✅ Check HTTP referrer restrictions match your domain
- ✅ Look for CORS errors in browser console

### 403 Forbidden Error
- ✅ API key not valid or not properly restricted
- ✅ Re-check API restrictions include Places API
- ✅ For client key, verify HTTP referrers are correct

### 429 Over Query Limit
- ✅ You've exceeded the free tier ($200/month)
- ✅ Check [Google Cloud Billing](https://console.cloud.google.com/billing)
- ✅ Consider enabling billing with a budget alert
- ✅ Caching should reduce requests significantly

### Slow Loading
- ✅ Normal - Google Places adds ~1-2 seconds per activity
- ✅ Progressive loading means itinerary shows first, details load after
- ✅ Subsequent requests for same places are cached (24h TTL)

### Some Activities Show Reviews, Others Don't
- ✅ Expected behavior - not all places have Google reviews
- ✅ Obscure or very new places may not exist in Google Places
- ✅ App continues to work with OpenAI data only

## Monitoring Usage and Costs

### Check API Usage

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** → **Dashboard**
4. Click on **Places API** or **Places API (New)**
5. View usage graphs and metrics

### View Costs

1. Go to [Billing Reports](https://console.cloud.google.com/billing/reports)
2. Filter by project: `Travel Itinerary Generator`
3. View current month costs
4. Check per-API breakdown

### Estimate Monthly Costs

**Example scenario:**
- 100 itineraries generated per day
- 7 activities per itinerary (average)
- 700 place enrichments per day
- 21,000 place enrichments per month

**Costs:**
- Text Search: 21,000 × $0.032 = $672
- Place Details: 21,000 × $0.017 = $357
- **Total: ~$1,029/month**

**With caching (50% cache hit rate):**
- Actual API calls: 10,500
- Text Search: 10,500 × $0.032 = $336
- Place Details: 10,500 × $0.017 = $178.50
- **Total: ~$514.50/month**

**Free tier covers:**
- $200 free credit = ~4,000 enrichments/month
- Beyond that, costs apply

## Optional: Implement Additional Caching

For production with high traffic, consider:

### Redis Caching (Recommended for Production)

```typescript
// Example with Vercel KV (Redis)
import { kv } from '@vercel/kv';

const cacheKey = `place:${name}:${city}`;
const cached = await kv.get(cacheKey);

if (cached) {
  return cached;
}

// Fetch from Google...
await kv.set(cacheKey, placeData, { ex: 86400 }); // 24h TTL
```

### Database Caching

```typescript
// Store in PostgreSQL/MongoDB
const cached = await db.places.findOne({ name, city });

if (cached && Date.now() - cached.updatedAt < 86400000) {
  return cached.data;
}

// Fetch from Google...
await db.places.upsert({ name, city, data: placeData, updatedAt: Date.now() });
```

## Security Best Practices

### Do's ✅
- ✅ Use separate keys for server-side and client-side
- ✅ Restrict server key to only required APIs
- ✅ Restrict client key to your domains only
- ✅ Set up billing alerts
- ✅ Monitor usage regularly
- ✅ Keep keys in `.env.local` (never commit)

### Don'ts ❌
- ❌ Never expose server-side key to client
- ❌ Never commit API keys to git
- ❌ Never use same key for both server and client
- ❌ Never skip HTTP referrer restrictions
- ❌ Never enable billing without alerts

## Support Resources

- [Google Places API Documentation](https://developers.google.com/maps/documentation/places/web-service/overview)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Pricing Calculator](https://cloud.google.com/products/calculator)
- [Google Maps Platform Support](https://developers.google.com/maps/support)

## Summary Checklist

Before going to production, ensure:

- [ ] Google Cloud project created
- [ ] Places API, Places API (New), Geocoding API enabled
- [ ] Server-side API key created and restricted
- [ ] Client-side API key created (optional, for photos)
- [ ] Environment variables added to `.env.local`
- [ ] Environment variables added to Vercel
- [ ] HTTP referrer restrictions configured
- [ ] Billing alerts set up
- [ ] Tested in development
- [ ] Tested in production
- [ ] Monitoring usage in Google Cloud Console

---

**Questions or Issues?**
Check the troubleshooting section above or refer to [CLAUDE.md](CLAUDE.md) for project-specific guidance.
