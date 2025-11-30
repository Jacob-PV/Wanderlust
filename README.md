# Wanderlust - Travel Itinerary Generator

A visually stunning, premium web application that generates personalized multi-day travel itineraries using AI. Built with Next.js, TypeScript, Tailwind CSS, Framer Motion, and powered by OpenAI's GPT models.

![Travel Itinerary Generator](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat&logo=tailwindcss)
![Framer Motion](https://img.shields.io/badge/Framer%20Motion-11-ff69b4?style=flat)

## ✨ Features

### Core Functionality
- **AI-Powered Itinerary Generation**: Generate customized single-day or multi-day itineraries using OpenAI's GPT-4o-mini
- **📅 Multi-Day Trip Planning**: Plan trips from 1 to 14 days with intelligent day-by-day scheduling
- **📆 Calendar Date Picker**: Visual calendar with range selection and quick-select buttons (Weekend, 3 days, 1 week, etc.)
- **🎯 Trip Pace Control**: Choose your pace - Relaxed (3-4 activities), Moderate (5-6), or Packed (7-8 per day)
- **🔄 Smart Activity Replacement**: Don't like a suggestion? Replace any activity with automatic schedule optimization
- **Smart Travel Time Calculation**: Accounts for realistic travel time between locations with route optimization
- **Budget Tracking & Cost Estimates**: Set your budget, specify travelers, and get per-activity cost estimates with budget tracking
- **City Autocomplete**: Search for cities with autocomplete powered by OpenStreetMap Nominatim
- **Interactive Multi-Day Maps**: View all itinerary locations with color-coded daily routes on interactive Leaflet maps
- **Customizable Preferences**: Select from 10+ activity types including restaurants, museums, parks, and more
- **Radius Selection**: Choose search radius from 1 to 100 miles

### Google Places Integration (NEW!)
- ⭐ **Real Star Ratings**: See actual ratings from Google Places (1-5 stars with review counts)
- 💬 **Genuine Reviews**: Read real user reviews with author names and profile photos
- 📸 **Place Photos**: View high-quality photos from Google Places for each activity
- 💵 **Price Levels**: See cost indicators ($, $$, $$$, $$$$) from Google
- ⏰ **Open/Closed Status**: Know if places are currently open with live status badges
- 📞 **Contact Information**: Direct links to websites and phone numbers
- 📍 **Verified Addresses**: Google-verified addresses for accurate navigation
- 🔄 **Progressive Loading**: Itinerary loads instantly, reviews enrich progressively
- 💰 **Smart Caching**: 24-hour cache reduces API costs significantly

### Premium UI/UX
- **Wanderlust Theme**: Beautiful travel-inspired color palette (deep teal, warm coral, golden amber)
- **Glassmorphism Design**: Modern glass-effect containers with backdrop blur
- **Smooth Animations**: Page transitions, staggered list animations, and micro-interactions using Framer Motion
- **Premium Typography**: Custom Google Fonts (Inter & Manrope) with optimized hierarchy
- **Split-Screen Layout**: Elegant desktop layout with sticky map and scrollable itinerary
- **Delightful Loading States**: Rotating messages, animated progress bars, and premium loading modal
- **Enhanced Map Markers**: Gradient-filled numbered markers with custom popups
- **Responsive Design**: Mobile-first approach with beautiful breakpoints for all screen sizes
- **Icon Integration**: Lucide React icons throughout for visual clarity
- **Premium Buttons & Cards**: Gradient backgrounds, hover effects, and shadow depth

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Map**: Leaflet & React Leaflet with custom markers
- **Date Handling**: react-day-picker & date-fns
- **Geocoding**: OpenStreetMap Nominatim API
- **AI**: OpenAI API (GPT-4o-mini)
- **Reviews & Enrichment**: Google Places API
- **Fonts**: Google Fonts (Inter & Manrope)
- **Deployment**: Vercel-ready

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))
- Google Places API key (optional, for reviews and ratings - [Setup guide](GOOGLE_SETUP.md))

## Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd travel_itenerary
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and add your API keys:
   ```env
   # Required
   OPENAI_API_KEY=your_openai_api_key_here

   # Optional (for Google Places reviews and ratings)
   GOOGLE_PLACES_API_KEY=your_google_places_api_key_here

   # Optional (for displaying Google Place photos)
   NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your_client_google_api_key_here
   ```

   > **Note**: The app works without Google Places API, but adding it provides real reviews, ratings, photos, and contact information. See [GOOGLE_SETUP.md](GOOGLE_SETUP.md) for detailed setup instructions.

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Creating a Single-Day Itinerary

1. **Enter a City**: Start typing a city name and select from the autocomplete suggestions
2. **Select Radius**: Choose how far from the city center you want to explore (1-100 miles)
3. **Choose Activity Preferences**: Select one or more activity types you're interested in
4. **Set Budget** (optional): Enter your budget per person and number of travelers
5. **Generate Itinerary**: Click the "Generate My Itinerary" button
6. **View Results**: See your personalized itinerary with timeline and interactive map
7. **Replace Activities**: Click "Replace this ↻" on any activity to swap it out
8. **Regenerate**: Click "New Trip" to create a different itinerary

### Planning a Multi-Day Trip

1. **Enter Your Destination**: Type and select your destination city
2. **Select Travel Dates**: Click the date picker and choose your travel dates
   - Use quick select buttons: Single day, Weekend (2 days), 3 days, 1 week, 2 weeks
   - Or manually select a custom date range on the calendar
3. **Choose Trip Pace**: Select your preferred pace
   - **Relaxed**: 3-4 activities per full day, plenty of downtime
   - **Moderate**: 5-6 activities per full day, balanced schedule
   - **Packed**: 7-8 activities per full day, action-packed adventure
4. **Set Daily Hours**: Adjust the slider for hours of activities per day (6-12 hours)
5. **Select Activity Preferences**: Choose activity types you're interested in
6. **Set Budget** (optional): Enter total budget and number of travelers
7. **Generate**: Click "Generate My Itinerary"
8. **Navigate Days**: Use day tabs to browse your itinerary day-by-day
9. **View on Map**: See all activities color-coded by day with routes connecting them
10. **Replace Activities**: Click "Replace this ↻" on any activity card to find alternatives

### Understanding Day Types

- **Arrival Day (Day 1)**: Activities start at 2:00 PM to account for travel/check-in
- **Full Days (Middle Days)**: Activities run from 9:00 AM to 9:00 PM
- **Departure Day (Last Day)**: Activities end by 2:00 PM for checkout/travel

## Project Structure

```
travel_itenerary/
├── app/
│   ├── api/
│   │   ├── generate-itinerary/
│   │   │   └── route.ts          # API route for single/multi-day itinerary generation
│   │   ├── enrich-place/
│   │   │   └── route.ts          # API route for Google Places enrichment
│   │   ├── replace-activity/
│   │   │   └── route.ts          # API route for activity replacement
│   │   └── find-alternatives/
│   │       └── route.ts          # API route for finding alternative activities
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Main page component
│   └── globals.css               # Global styles including calendar styles
├── components/
│   ├── ItineraryForm.tsx         # Form with city autocomplete and date picker
│   ├── DateRangePicker.tsx       # Calendar component for date selection
│   ├── ItineraryDisplay.tsx      # Single-day itinerary display
│   ├── DayNavigation.tsx         # Multi-day itinerary with day tabs
│   ├── MapView.tsx               # Single-day interactive map
│   ├── MultiDayMapView.tsx       # Multi-day map with color-coded routes
│   ├── ReplaceActivity.tsx       # Activity replacement UI
│   ├── RatingDisplay.tsx         # Star rating display component
│   └── ReviewCard.tsx            # Individual review card component
├── types/
│   └── index.ts                  # TypeScript type definitions
├── .env.example                  # Environment variables template
├── GOOGLE_SETUP.md               # Google Places API setup guide
├── CLAUDE.md                     # AI assistant context and conventions
├── ARCHITECTURE.md               # System architecture documentation
├── API.md                        # API endpoint documentation
├── next.config.ts                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
└── package.json                  # Project dependencies
```

## API Route

### POST `/api/generate-itinerary`

Generates a personalized itinerary based on user preferences.

**Request Body:**
```json
{
  "city": "San Francisco, California, United States",
  "radius": "5",
  "preferences": ["Museums", "Restaurants", "Parks & Outdoors"],
  "coordinates": {
    "lat": 37.7749,
    "lng": -122.4194
  }
}
```

**Response:**
```json
{
  "city": "San Francisco",
  "itinerary": [
    {
      "name": "Golden Gate Park",
      "address": "Golden Gate Park, San Francisco, CA",
      "time": "9:00 AM - 11:00 AM",
      "duration": "2 hours",
      "description": "Explore the beautiful urban park with gardens and museums",
      "type": "Parks & Outdoors",
      "coordinates": {
        "lat": 37.7694,
        "lng": -122.4862
      }
    }
  ]
}
```

## Activity Types

- Restaurants
- Museums
- Parks & Outdoors
- Nightlife & Bars
- Shopping
- Historical Sites
- Entertainment
- Coffee Shops
- Art Galleries
- Sports & Recreation

## Deployment

### Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Deploy on Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add your environment variable: `OPENAI_API_KEY`
   - Click "Deploy"

Your app will be live at `https://your-project.vercel.app`

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key for itinerary generation | Yes |
| `GOOGLE_PLACES_API_KEY` | Server-side Google Places API key for reviews/ratings | No (but recommended) |
| `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` | Client-side Google Places API key for photos | No (optional) |

**Notes**:
- The app works without Google Places API keys, but adding them provides real reviews, ratings, photos, and contact information
- See [GOOGLE_SETUP.md](GOOGLE_SETUP.md) for detailed setup instructions
- Google provides $200/month free credit (~4,000 place enrichments)
- No Mapbox token required - uses OpenStreetMap's free Nominatim API

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Key Components

#### ItineraryForm
Handles user input with city autocomplete using OpenStreetMap Nominatim API.

#### ItineraryDisplay
Displays the generated itinerary in a timeline format with color-coded activity types. Progressively enriches each activity with Google Places data (ratings, reviews, photos, contact info).

#### MapView
Renders an interactive Leaflet map with numbered markers for each location.

## API Costs

Understanding the costs of running this app:

**OpenAI API:**
- Single-day itinerary: ~$0.01-0.02
- 3-day trip: ~$0.04-0.06
- 7-day trip: ~$0.08-0.12
- Activity replacement: ~$0.01-0.03 each

**Google Places API:**
- $200/month free credit (~4,000 place lookups)
- Place Details: $0.017 per request
- Text Search: $0.032 per request
- 24-hour in-memory caching reduces costs significantly

**Nominatim (OpenStreetMap):**
- Completely free!
- Rate limit: 1 request/second (handled automatically)

**Monthly estimate for moderate use:**
- ~100 itineraries generated: $5-10 (OpenAI)
- Google Places within free tier for most users

## Future Enhancements

- [ ] Save/export itinerary feature
- [ ] Share itinerary via link
- [x] ~~Multiple day itineraries~~ ✅ **Implemented!**
- [x] ~~Activity replacement~~ ✅ **Implemented!**
- [ ] Weather integration
- [ ] User accounts to save itineraries
- [ ] PDF export
- [ ] Undo/Redo for multi-day itineraries
- [ ] Route optimization with real-time traffic
- [ ] Booking integration (OpenTable, Resy, etc.)
- [ ] Redis/database caching for Google Places data

## Technologies Used

- [Next.js](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Framer Motion](https://www.framer.com/motion/) - Production-ready animation library
- [Lucide React](https://lucide.dev/) - Beautiful icon library
- [Leaflet](https://leafletjs.com/) - Interactive maps
- [React Leaflet](https://react-leaflet.js.org/) - React wrapper for Leaflet
- [react-day-picker](https://react-day-picker.js.org/) - Calendar date picker
- [date-fns](https://date-fns.org/) - Date manipulation utilities
- [OpenAI](https://openai.com/) - AI itinerary generation
- [Google Places API](https://developers.google.com/maps/documentation/places) - Real reviews, ratings, and place data
- [OpenStreetMap](https://www.openstreetmap.org/) - Free geocoding and maps
- [Google Fonts](https://fonts.google.com/) - Inter & Manrope typefaces

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you encounter any issues, please open an issue on GitHub.
