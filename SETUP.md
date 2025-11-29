# Quick Setup Guide

## Step 1: Get Your OpenAI API Key

1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (you won't be able to see it again!)

## Step 2: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and paste your OpenAI API key:
   ```env
   OPENAI_API_KEY=sk-proj-your-actual-key-here
   ```

## Step 3: Install Dependencies

```bash
npm install
```

## Step 4: Run the Development Server

```bash
npm run dev
```

## Step 5: Open the Application

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Troubleshooting

### "OpenAI API key is not configured" Error

- Make sure you created a `.env.local` file (not `.env.example`)
- Verify your API key is correct and starts with `sk-`
- Restart the development server after adding the key

### Map Not Loading

- Leaflet requires client-side rendering. The app uses dynamic imports to handle this.
- Make sure JavaScript is enabled in your browser

### City Autocomplete Not Working

- The app uses OpenStreetMap's Nominatim API (no API key required)
- Check your internet connection
- The API has rate limits - wait a moment between requests

## Testing the Application

1. Enter a city name (e.g., "San Francisco")
2. Select a radius (e.g., "Within 5 miles")
3. Choose at least one activity preference
4. Click "Generate Itinerary"
5. Wait 5-10 seconds for AI to generate your itinerary
6. View the results and explore the interactive map!

## Production Build

To test the production build locally:

```bash
npm run build
npm run start
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Next Steps

- Deploy to Vercel (see [README.md](README.md))
- Customize the activity types in `types/index.ts`
- Modify the AI prompt in `app/api/generate-itinerary/route.ts`
- Adjust styling in Tailwind CSS classes
