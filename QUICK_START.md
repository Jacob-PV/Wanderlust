# 🚀 Quick Start - Get Running in 5 Minutes

## Step 1️⃣: Get Your API Key (2 minutes)
1. Visit https://platform.openai.com/api-keys
2. Sign in or create account
3. Click **"Create new secret key"**
4. **Copy the key** (starts with `sk-`)

## Step 2️⃣: Configure the App (1 minute)
```bash
# Copy the environment template
cp .env.example .env.local

# Edit .env.local and paste your key
# OPENAI_API_KEY=sk-your-key-here
```

## Step 3️⃣: Install & Run (2 minutes)
```bash
# Install dependencies
npm install

# Start the app
npm run dev
```

## Step 4️⃣: Open & Test
1. Open http://localhost:3000
2. Type a city name (e.g., "New York")
3. Select activity preferences
4. Click **"Generate Itinerary"**
5. Enjoy your AI-powered itinerary! 🎉

---

## 🆘 Having Issues?

### Error: "OpenAI API key is not configured"
- Check file is named `.env.local` (NOT `.env.example`)
- Verify your key is correct
- Restart the dev server

### Map not showing?
- Clear browser cache
- Check JavaScript is enabled
- Refresh the page

### Need more help?
See [SETUP.md](SETUP.md) or [README.md](README.md)

---

## 🎨 Want to Customize?

### Change Activity Types
Edit [types/index.ts](types/index.ts:45)

### Modify AI Prompt
Edit [app/api/generate-itinerary/route.ts](app/api/generate-itinerary/route.ts:29)

### Update Colors
Edit Tailwind classes in component files

---

## 🚀 Ready to Deploy?

```bash
# Push to GitHub
git init
git add .
git commit -m "Initial commit"
git push

# Then deploy on Vercel
# 1. Go to vercel.com
# 2. Import your repo
# 3. Add OPENAI_API_KEY env variable
# 4. Deploy!
```

---

**That's it! You're ready to generate amazing travel itineraries! ✈️**
