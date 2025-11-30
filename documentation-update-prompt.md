# Documentation Update Prompt

After implementing new features or making changes to the codebase, update ALL relevant documentation files to reflect the current state of the project.

## Instructions for Claude

Please review the recent changes made to this project and update the following documentation files comprehensively. Ensure all documentation is accurate, complete, and reflects the current implementation.

## Files to Update

### 1. CLAUDE.md

Update the following sections in CLAUDE.md:

**Key Architectural Decisions:**
- Add any new technologies or libraries added (e.g., react-day-picker, date-fns)
- Explain why these choices were made
- Document new APIs integrated (Google Places for reviews, etc.)

**Important Design Patterns:**
- Document new patterns introduced (multi-day trip structure, event swapping, etc.)
- Explain how new features are organized
- Update state management approach if changed

**Code Conventions:**
- Add any new naming conventions
- Document new component types
- Update file structure if changed

**External API Guidelines:**
- Add new APIs (Google Places API for reviews)
- Document rate limits and usage
- Include cost considerations
- Document Nominatim/LocationIQ for geocoding

**Common Modification Scenarios:**
Add sections for new features:
- "Adding Support for Longer Trips"
- "Modifying the Calendar/Date Picker"
- "Customizing Day Types (Arrival/Full/Departure)"
- "Changing Review Display"
- "Updating Location Autocomplete Behavior"

**Known Limitations & Future Improvements:**
- Update based on new features added
- Add any new limitations discovered
- Document what's now supported that wasn't before

**Environment Setup Reminders:**
Add any new environment variables:
- `GOOGLE_PLACES_API_KEY` - For reviews and place details
- `NEXT_PUBLIC_LOCATIONIQ_API_KEY` - If using LocationIQ instead of Nominatim
- Any other new API keys

### 2. README.md

Update the README.md with:

**Project Description:**
```markdown
# Travel Itinerary Generator

A modern, AI-powered travel planning application that creates personalized, 
multi-day itineraries with intelligent scheduling, real reviews, and interactive maps.

## ✨ Key Features

- 🤖 AI-powered itinerary generation using OpenAI
- 📅 Multi-day trip planning (1-14 days) with calendar date picker
- 📍 Weather.com-style location autocomplete
- ⭐ Real Google reviews and ratings for every activity
- 🗺️ Interactive maps with color-coded daily routes
- 🔄 Smart activity replacement with automatic rescheduling
- 📱 Fully responsive design (mobile, tablet, desktop)
- 🎨 Beautiful, modern UI with smooth animations
- 💾 Export and share itineraries

## 🛠️ Tech Stack

**Frontend:**
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion (animations)
- Lucide React (icons)

**Mapping:**
- Leaflet with react-leaflet
- OpenStreetMap tiles

**APIs:**
- OpenAI API (GPT-4 Turbo) - Itinerary generation
- Google Places API - Reviews, ratings, photos
- Nominatim (OpenStreetMap) - Geocoding (free, no API key)

**Other Libraries:**
- react-day-picker - Date range selection
- date-fns - Date manipulation
```

**Installation Instructions:**
```markdown
## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))
- Google Cloud account with Places API enabled ([Setup guide](https://developers.google.com/maps/documentation/places/web-service/get-api-key))

### Installation

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd travel-itinerary-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   
   Create a `.env.local` file in the root directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

### Deploying to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=<your-repo>)
```

**Feature Documentation:**
```markdown
## 📖 How to Use

### Creating a Single-Day Itinerary

1. Enter a destination city (autocomplete will help)
2. Select how far from city center you want to explore
3. Choose activity types you're interested in
4. Click "Generate My Itinerary"

### Planning a Multi-Day Trip

1. Enter your destination
2. Click the date selector and choose your travel dates
3. Use quick select buttons (Weekend, 3 days, 1 week) or select custom range
4. Select activity preferences and trip pace
5. Generate your personalized multi-day itinerary

### Replacing Activities

Don't like a suggested activity?
1. Click "Replace this ↻" on any activity card
2. Browse alternative suggestions
3. Select a replacement
4. AI will automatically optimize your schedule

### Navigating Multi-Day Trips

- Use day tabs to switch between days
- Click map markers to see activity details
- Export or share your complete itinerary
```

**API Costs & Limits:**
```markdown
## 💰 API Costs

Understanding the costs of running this app:

**OpenAI API:**
- Single-day itinerary: ~$0.01-0.02
- 3-day trip: ~$0.04-0.06
- 7-day trip: ~$0.08-0.12
- Activity replacement: ~$0.01-0.03 each

**Google Places API:**
- $200/month free credit (covers ~11,000 place lookups)
- Place Details: $17 per 1,000 requests
- Text Search: $32 per 1,000 requests

**Nominatim (OpenStreetMap):**
- Completely free!
- Rate limit: 1 request/second (handled automatically)

**Monthly estimate for moderate use:**
- ~100 itineraries generated: $5-10
- Google Places within free tier for most users
```

### 3. ARCHITECTURE.md

Create or update ARCHITECTURE.md:

```markdown
# System Architecture

## Overview

This travel itinerary generator is built as a modern Next.js application with 
AI-powered planning, real-time data from multiple APIs, and an interactive 
map-based interface.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (Browser)                      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   React UI   │  │ Leaflet Map  │  │  Date Picker │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                  │                  │             │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js API Routes                        │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ /api/generate-   │  │ /api/enrich-     │                │
│  │  itinerary       │  │  place           │                │
│  └────────┬─────────┘  └────────┬─────────┘                │
│           │                     │                           │
│  ┌────────┴─────────┐  ┌────────┴─────────┐                │
│  │ /api/replace-    │  │ /api/find-       │                │
│  │  activity        │  │  alternatives    │                │
│  └──────────────────┘  └──────────────────┘                │
└─────────┬──────────────────┬──────────────────┬─────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐
│   OpenAI API    │  │ Google Places   │  │  Nominatim   │
│   (GPT-4)       │  │   API           │  │  (OSM)       │
└─────────────────┘  └─────────────────┘  └──────────────┘
```

## Data Flow

### 1. Initial Itinerary Generation

```
User Input (city, dates, preferences)
         │
         ▼
Geocode city → Get coordinates (Nominatim)
         │
         ▼
Generate prompt for OpenAI
         │
         ▼
OpenAI generates structured itinerary
         │
         ▼
For each activity in parallel:
  └─→ Google Places API → Get reviews, ratings, photos
         │
         ▼
Merge Google data with itinerary
         │
         ▼
Return enriched itinerary to client
         │
         ▼
Display on map + timeline
```

### 2. Activity Replacement Flow

```
User clicks "Replace"
         │
         ▼
Find alternatives (Google Places Nearby Search)
         │
         ▼
User selects replacement
         │
         ▼
Send current itinerary + replacement to OpenAI
         │
         ▼
AI optimizes entire schedule (routing, timing)
         │
         ▼
Return new itinerary
         │
         ▼
Update UI with changes highlighted
```

## Component Structure

```
app/
├── page.tsx                        # Main page with form
├── layout.tsx                      # Root layout
├── api/
│   ├── generate-itinerary/
│   │   └── route.ts               # Itinerary generation
│   ├── replace-activity/
│   │   └── route.ts               # Activity replacement
│   ├── enrich-place/
│   │   └── route.ts               # Google Places enrichment
│   └── find-alternatives/
│       └── route.ts               # Find replacement options
│
components/
├── ItineraryForm.tsx              # Main input form
├── LocationAutocomplete.tsx        # City search with autocomplete
├── DateRangePicker.tsx            # Calendar date selection
├── ActivitySelector.tsx            # Activity type multi-select
├── ItineraryDisplay.tsx           # Timeline view of activities
├── DayNavigation.tsx              # Multi-day tab navigation
├── ActivityCard.tsx               # Individual activity card
├── ReplaceActivity.tsx            # Activity replacement UI
├── MapView.tsx                    # Leaflet map with markers
├── ReviewCard.tsx                 # Google review display
└── RatingDisplay.tsx              # Star rating component

types/
├── index.ts                       # Shared TypeScript types
└── api.ts                         # API request/response types

lib/
├── openai.ts                      # OpenAI API utilities
├── google-places.ts               # Google Places helpers
├── nominatim.ts                   # Geocoding utilities
└── date-utils.ts                  # Date manipulation helpers
```

## State Management

**Current Approach:** React hooks (useState, useEffect)

**Key State:**
```typescript
// Main application state
const [itinerary, setItinerary] = useState<MultiDayItinerary | null>(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

// Form state
const [city, setCity] = useState('');
const [dateRange, setDateRange] = useState<DateRange | null>(null);
const [radius, setRadius] = useState(5);
const [activities, setActivities] = useState<string[]>([]);
const [pace, setPace] = useState<'relaxed' | 'moderate' | 'packed'>('moderate');

// UI state
const [currentDay, setCurrentDay] = useState(0);
const [showMap, setShowMap] = useState(true);
```

## External Dependencies

### Critical APIs

**OpenAI API:**
- Purpose: Generate and optimize itineraries
- Model: GPT-4 Turbo
- Cost: ~$0.01-0.12 per itinerary
- Rate Limit: Tier-dependent

**Google Places API:**
- Purpose: Reviews, ratings, photos, place details
- Cost: $200/month free, then pay-per-use
- Rate Limit: As per Google Cloud quota
- Caching: Recommended for cost optimization

**Nominatim (OpenStreetMap):**
- Purpose: Geocoding (city → coordinates)
- Cost: Free
- Rate Limit: 1 request/second (enforced in code)
- User-Agent: Required header

### Libraries

**UI/UX:**
- Tailwind CSS - Styling
- Framer Motion - Animations
- Lucide React - Icons
- react-day-picker - Calendar
- date-fns - Date utilities

**Mapping:**
- Leaflet - Map rendering
- react-leaflet - React bindings
- OpenStreetMap - Tile provider

## Performance Considerations

**Optimization Strategies:**

1. **API Call Batching:**
   - Enrich multiple activities in parallel
   - Use Promise.all() for concurrent requests

2. **Caching:**
   - Google Places responses (24h cache)
   - Geocoding results (persistent cache)
   - Rate limiting for Nominatim

3. **Code Splitting:**
   - Lazy load map component
   - Dynamic imports for heavy dependencies

4. **Loading States:**
   - Skeleton screens during generation
   - Progressive enhancement (show map while enriching)

## Error Handling

**Strategy:** Graceful degradation

```typescript
// Example: If Google Places fails, show itinerary without reviews
try {
  const googleData = await fetchGoogleData(activity);
  activity.googleData = googleData;
} catch (error) {
  console.error('Failed to enrich activity:', error);
  // Continue without Google data
  activity.googleData = null;
}
```

**Error Types:**
- API failures (OpenAI, Google, Nominatim)
- Rate limiting
- Network issues
- Invalid user input
- Parsing errors

## Security Considerations

**API Key Protection:**
- Server-side only keys in `.env.local`
- Never expose in client code
- Use `NEXT_PUBLIC_` prefix only when necessary

**Input Validation:**
- Sanitize user inputs
- Validate date ranges
- Check coordinate bounds
- Limit request sizes

## Deployment Architecture

**Vercel (Recommended):**
```
User Request
     │
     ▼
Vercel Edge Network (CDN)
     │
     ▼
Next.js Serverless Functions
     │
     ├─→ OpenAI API
     ├─→ Google Places API
     └─→ Nominatim API
```

**Environment Variables in Vercel:**
- `OPENAI_API_KEY`
- `GOOGLE_PLACES_API_KEY`
- (No key needed for Nominatim)

## Future Architecture Improvements

**Potential Enhancements:**

1. **Database Layer:**
   - Save itineraries for users
   - Cache API responses
   - User accounts and preferences

2. **Redis Caching:**
   - Cache OpenAI responses
   - Cache Google Places data
   - Reduce API costs

3. **Background Jobs:**
   - Pre-fetch popular destinations
   - Update cached place data overnight
   - Generate example itineraries

4. **Microservices:**
   - Separate geocoding service
   - Dedicated caching layer
   - Analytics service
```

### 4. API.md

Create API.md documenting all endpoints:

```markdown
# API Documentation

Complete reference for all API endpoints in the travel itinerary app.

## Base URL

Development: `http://localhost:3000/api`
Production: `https://your-domain.com/api`

## Authentication

All endpoints are currently public. API keys are handled server-side.

---

## Endpoints

### 1. Generate Itinerary

**Endpoint:** `POST /api/generate-itinerary`

**Description:** Generate a complete multi-day itinerary using OpenAI.

**Request Body:**
```json
{
  "city": "New York",
  "radius": 5,
  "activities": ["museums", "restaurants", "parks"],
  "dateRange": {
    "startDate": "2024-11-16",
    "endDate": "2024-11-18"
  },
  "pace": "moderate",
  "dailyHours": 8
}
```

**Response:**
```json
{
  "days": [
    {
      "dayNumber": 1,
      "date": "2024-11-16",
      "dayType": "arrival",
      "summary": "Arrival day - taking it easy",
      "activities": [
        {
          "name": "Central Park",
          "address": "New York, NY 10024",
          "time": "2:00 PM - 4:00 PM",
          "duration": "2 hours",
          "description": "Enjoy a relaxing walk",
          "type": "park",
          "coordinates": {
            "lat": 40.785091,
            "lng": -73.968285
          },
          "googleData": {
            "rating": 4.8,
            "user_ratings_total": 50000,
            "reviews": [...],
            "photos": [...]
          }
        }
      ]
    }
  ]
}
```

**Status Codes:**
- 200: Success
- 400: Invalid input
- 500: Server error (OpenAI API failure)

---

### 2. Replace Activity

**Endpoint:** `POST /api/replace-activity`

**Description:** Replace an activity and regenerate optimized itinerary.

**Request Body:**
```json
{
  "currentItinerary": [...],
  "replaceIndex": 2,
  "replacement": {
    "name": "Museum of Modern Art",
    "type": "museum",
    "coordinates": {
      "lat": 40.7614,
      "lng": -73.9776
    }
  },
  "preferences": {
    "city": "New York",
    "radius": 5,
    "activities": ["museums", "restaurants"]
  }
}
```

**Response:**
```json
{
  "itinerary": [...],
  "changes": {
    "summary": "Replaced activity and adjusted times",
    "timingAdjusted": true,
    "reordered": false
  }
}
```

---

### 3. Enrich Place

**Endpoint:** `POST /api/enrich-place`

**Description:** Get Google Places data (reviews, ratings, photos).

**Request Body:**
```json
{
  "name": "Central Park",
  "address": "New York, NY",
  "city": "New York"
}
```

**Response:**
```json
{
  "place_id": "ChIJ4zGFAZpYwokRGUGph3Mf37k",
  "rating": 4.8,
  "user_ratings_total": 50000,
  "reviews": [
    {
      "author_name": "John Doe",
      "rating": 5,
      "text": "Amazing park!",
      "time": 1699564800
    }
  ],
  "photos": [...]
}
```

---

### 4. Find Alternatives

**Endpoint:** `GET /api/find-alternatives`

**Description:** Find alternative activities nearby.

**Query Parameters:**
- `type`: Activity type (museum, restaurant, etc.)
- `lat`: Latitude
- `lng`: Longitude
- `radius`: Search radius in meters (default: 5000)

**Example:**
```
GET /api/find-alternatives?type=museum&lat=40.7614&lng=-73.9776&radius=5000
```

**Response:**
```json
{
  "alternatives": [
    {
      "name": "Museum of Modern Art",
      "rating": 4.7,
      "userRatingsTotal": 12543,
      "vicinity": "11 W 53rd St",
      "type": "museum",
      "coordinates": {
        "lat": 40.7614,
        "lng": -73.9776
      },
      "openNow": true,
      "distance": 1.2
    }
  ]
}
```

---

## Rate Limits

**OpenAI API:**
- Tier-dependent (check OpenAI dashboard)
- Typical: 3,500 requests/min

**Google Places API:**
- As per Google Cloud quota
- Default: Generous free tier

**Nominatim:**
- 1 request/second (enforced in code)
- No hard limit

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {...}
}
```

**Common Error Codes:**
- `INVALID_INPUT`: Request validation failed
- `API_ERROR`: External API failure
- `RATE_LIMIT`: Rate limit exceeded
- `SERVER_ERROR`: Internal server error
```

### 5. Update Inline Code Comments

Add or update JSDoc comments for:

**New Components:**
```typescript
/**
 * DateRangePicker Component
 * 
 * Calendar-based date range selector for multi-day trips.
 * Uses react-day-picker for the calendar interface.
 * 
 * Features:
 * - Visual calendar with range selection
 * - Quick select buttons (weekend, 3 days, 1 week, 2 weeks)
 * - Prevents selection of past dates
 * - Calculates and displays trip duration
 * 
 * @param onDateRangeChange - Callback when date range is selected
 * 
 * @example
 * <DateRangePicker 
 *   onDateRangeChange={({ from, to }) => setDateRange({ from, to })} 
 * />
 */
```

**New API Functions:**
```typescript
/**
 * Generates a multi-day travel itinerary using OpenAI GPT-4.
 * 
 * Handles day-specific planning:
 * - Day 1: Arrival day (starts at 2 PM)
 * - Middle days: Full days (9 AM - 9 PM)
 * - Final day: Departure (ends by 2 PM)
 * 
 * @param preferences - Trip preferences including dates, location, activities
 * @returns Multi-day itinerary with activities grouped by day
 * 
 * @throws {Error} If OpenAI API call fails
 * @throws {Error} If date range is invalid
 * 
 * Cost: ~$0.04-0.12 depending on trip length
 * 
 * @example
 * const itinerary = await generateMultiDayItinerary({
 *   city: "New York",
 *   dateRange: { startDate: new Date(), endDate: addDays(new Date(), 3) },
 *   activities: ["museums", "restaurants"],
 *   pace: "moderate"
 * });
 */
```

**New Utility Functions:**
```typescript
/**
 * Formats a Nominatim geocoding result to match weather.com location format.
 * 
 * Converts OpenStreetMap data to:
 * "City, STATE_CODE, COUNTRY_CODE"
 * with optional county/region as subtext
 * 
 * For US locations, converts state names to abbreviations (e.g., "New York" → "NY")
 * 
 * @param result - Raw Nominatim API response
 * @returns Formatted location object with display name and coordinates
 * 
 * @example
 * const formatted = formatNominatimResult(nominatimResponse);
 * // Returns: { displayName: "New York, NY, US", subtext: "New York County", coordinates: {...} }
 */
```

### 6. Create CHANGELOG.md

Document all major changes:

```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- 📅 **Multi-day trip support** (1-14 days)
  - Calendar date picker with range selection
  - Day-by-day navigation with tabs
  - Arrival, full day, and departure day planning
  - Quick select buttons for common trip lengths
  
- ⭐ **Google Places integration**
  - Real reviews and ratings for every activity
  - User photos from Google
  - Opening hours and current status
  - Price level indicators
  - Phone numbers and websites
  
- 🗺️ **Enhanced location autocomplete**
  - Weather.com-style dropdown format
  - City, State, Country display
  - County/region subtext
  - Nominatim (OpenStreetMap) geocoding
  - Rate-limited to respect API policies
  
- 🔄 **Smart activity replacement**
  - Find alternative activities nearby
  - AI-powered rescheduling
  - Automatic route optimization
  - Time adjustment across itinerary
  
- 🎨 **Impressive UI improvements**
  - Modern, premium design
  - Smooth animations with Framer Motion
  - Glassmorphism effects
  - Mobile-optimized layouts
  - Loading states and skeletons
  
- 📱 **Better mobile experience**
  - Responsive design throughout
  - Touch-friendly controls
  - Optimized calendar for mobile
  - Large tap targets

### Changed
- Switched from Mapbox to Leaflet + OpenStreetMap (cost savings)
- Updated form to support multi-day trips
- Enhanced OpenAI prompts for better itinerary quality
- Improved error handling across all API calls

### Technical
- Added react-day-picker for calendar
- Added date-fns for date manipulation
- Integrated Google Places API
- Implemented Nominatim rate limiting
- Added TypeScript types for multi-day structures

## [1.0.0] - Initial Release

### Added
- Basic single-day itinerary generation
- OpenAI-powered planning
- Simple map view
- Activity type selection
- Basic UI
```

## Checklist for Documentation Updates

Run through this checklist:

- [ ] CLAUDE.md updated with:
  - [ ] New architectural decisions
  - [ ] New APIs and their usage
  - [ ] New environment variables
  - [ ] Updated "Common Modification Scenarios"
  - [ ] New known limitations

- [ ] README.md updated with:
  - [ ] Feature list (multi-day, reviews, etc.)
  - [ ] Complete tech stack
  - [ ] Updated installation steps
  - [ ] New environment variables
  - [ ] Usage instructions
  - [ ] Cost breakdown

- [ ] ARCHITECTURE.md created/updated with:
  - [ ] System diagram
  - [ ] Data flows
  - [ ] Component structure
  - [ ] API integrations
  - [ ] State management

- [ ] API.md created with:
  - [ ] All endpoints documented
  - [ ] Request/response examples
  - [ ] Error codes
  - [ ] Rate limits

- [ ] Inline code comments updated:
  - [ ] JSDoc for new components
  - [ ] JSDoc for new API routes
  - [ ] JSDoc for utility functions
  - [ ] Examples in complex logic

- [ ] CHANGELOG.md created/updated:
  - [ ] All new features listed
  - [ ] Breaking changes noted
  - [ ] Technical changes documented

- [ ] package.json updated:
  - [ ] Accurate description
  - [ ] All dependencies listed
  - [ ] Scripts documented

- [ ] .env.example created:
  - [ ] All required env vars
  - [ ] Example values
  - [ ] Comments explaining each

## Example .env.example to Create

```env
# OpenAI API Key
# Get from: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-...

# Google Places API Key
# Get from: https://console.cloud.google.com/
# Enable: Places API, Geocoding API
GOOGLE_PLACES_API_KEY=AIza...

# Optional: LocationIQ API Key (if using instead of Nominatim)
# Get from: https://locationiq.com/
# Free tier: 5,000 requests/day
# NEXT_PUBLIC_LOCATIONIQ_API_KEY=pk...
```

## Execution Instructions

Claude, please:

1. **Review the codebase** to understand all recent changes
2. **Update each documentation file** listed above
3. **Ensure consistency** across all docs
4. **Add missing sections** that should exist
5. **Remove outdated information**
6. **Verify all code examples** are accurate
7. **Check all links** work correctly
8. **Update version numbers** if applicable

Focus on making the documentation:
- ✅ Accurate and up-to-date
- ✅ Complete and comprehensive
- ✅ Easy to understand
- ✅ Helpful for new developers
- ✅ Useful for AI assistants in future sessions

Thank you for keeping our documentation excellent! 📚