# Architecture Documentation

## System Architecture Overview

The Travel Itinerary Generator is a full-stack web application built with Next.js 15, utilizing a client-server architecture with AI-powered itinerary generation.

```
┌─────────────────────────────────────────────────────────────┐
│                         User Browser                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    React Components                    │  │
│  │  - ItineraryForm (user input)                         │  │
│  │  - ItineraryDisplay (results view)                    │  │
│  │  - MapView (interactive Leaflet map)                  │  │
│  └───────────────┬───────────────────────────────────────┘  │
│                  │ HTTP POST /api/generate-itinerary         │
└──────────────────┼───────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                      Next.js Server                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              API Route Handler                        │  │
│  │         /api/generate-itinerary/route.ts              │  │
│  │  - Validates request                                  │  │
│  │  - Constructs AI prompt                               │  │
│  │  - Calls OpenAI API                                   │  │
│  │  - Parses & returns JSON                              │  │
│  └───────────────┬───────────────────────────────────────┘  │
└──────────────────┼───────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                      External APIs                           │
│  ┌──────────────────────┐  ┌──────────────────────────┐    │
│  │    OpenAI API        │  │ OpenStreetMap Nominatim  │    │
│  │  - GPT-4o-mini       │  │  - City geocoding        │    │
│  │  - Itinerary gen     │  │  - City autocomplete     │    │
│  └──────────────────────┘  └──────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. User Input Flow
```
User enters city
    → ItineraryForm debounces input
    → Calls Nominatim API (client-side)
    → Displays autocomplete suggestions
    → User selects city
    → Coordinates stored in state

User selects preferences
    → Radius selection (2-20 miles)
    → Activity types (Museums, Restaurants, etc.)
    → Budget (optional)
    → Number of travelers (optional)
    → Form validation
    → Submit enabled when city + preferences selected
```

### 2. Itinerary Generation Flow
```
User clicks "Generate Itinerary"
    → page.tsx:handleGenerateItinerary() called
    → Loading state activated (modal displayed)
    → POST request to /api/generate-itinerary
        → Server validates request body
        → Server constructs AI prompt with:
            - City & coordinates
            - Radius
            - Activity preferences
            - Budget per person (if provided)
            - Number of travelers (if provided)
        → OpenAI API call (GPT-4o-mini)
        → AI generates JSON itinerary with:
            - Activity names & addresses
            - Time slots (9 AM - 9 PM)
            - Geographic coordinates
            - Travel times between locations
            - Cost estimates per person
        → Server parses & validates JSON
        → Server returns itinerary
    → Client receives itinerary
    → Client calculates budget totals:
        - Total cost per person (sum of all activities)
        - Total cost for all travelers
        - Budget remaining (if budget provided)
    → State updated with itinerary
    → UI switches from form to results view
    → Map component renders with markers
```

### 3. Display & Interaction Flow
```
ItineraryDisplay renders
    → Budget summary card (if costs exist)
        - Per person cost
        - Total cost (if travelers specified)
        - Budget remaining (if budget specified)
    → Activity timeline
        - Numbered cards (1, 2, 3...)
        - Travel time badges between activities
        - Activity details (time, duration, cost, description)
        - Color-coded activity type badges

MapView renders
    → Client-side only (prevents SSR issues)
    → Leaflet map initialized
    → Numbered markers for each activity
        - Custom color per activity type
        - Popup with name, type, time
    → Auto-fit bounds to show all markers
    → Interactive zoom/pan

User clicks "Regenerate"
    → Clears current itinerary
    → Returns to form view
    → Form data preserved (city, radius, preferences)
    → User can modify and regenerate
```

## Component Hierarchy

```
app/page.tsx (Main Page Component)
├── Header
│   ├── Title
│   └── Subtitle
├── Error Display (conditional)
│   └── Error message banner
├── ItineraryForm (if !itinerary)
│   ├── City Input
│   │   ├── Text input
│   │   └── Autocomplete dropdown
│   │       └── Nominatim API results
│   ├── Radius Select
│   │   └── Dropdown (2, 5, 10, 20 miles)
│   ├── Budget & Travelers Inputs
│   │   ├── Budget input (optional)
│   │   └── Travelers input (1-20)
│   ├── Activity Preferences
│   │   └── Checkbox grid (10 activity types)
│   └── Submit Button
│       └── Loading state
├── ItineraryDisplay (if itinerary)
│   ├── Header
│   │   ├── Title with city name
│   │   └── Regenerate button
│   ├── Budget Summary Card (conditional)
│   │   ├── Per Person Cost
│   │   ├── Total Cost
│   │   └── Budget Remaining
│   ├── Activity Timeline
│   │   └── For each activity:
│   │       ├── Travel Time Badge (if index > 0)
│   │       └── Activity Card
│   │           ├── Number badge
│   │           ├── Activity name
│   │           ├── Address
│   │           ├── Activity type badge (color-coded)
│   │           ├── Time & duration
│   │           ├── Cost (if available)
│   │           └── Description
│   └── MapView
│       ├── Leaflet MapContainer
│       ├── OpenStreetMap TileLayer
│       ├── Markers (numbered, color-coded)
│       │   └── Popups (name, type, time)
│       └── FitBounds component
├── Loading Modal (if isLoading)
│   ├── Spinner
│   └── "Generating Your Itinerary" message
└── Footer
    └── "Powered by OpenAI and OpenStreetMap"
```

## State Management

### Global State (page.tsx)
```typescript
const [itinerary, setItinerary] = useState<Itinerary | null>(null);
// Stores the generated itinerary with all activities
// null = show form, object = show results

const [isLoading, setIsLoading] = useState(false);
// Loading state during API call
// Displays modal overlay with spinner

const [error, setError] = useState<string | null>(null);
// Error messages from API failures
// Displayed in red banner at top of page

const [requestData, setRequestData] = useState<GenerateItineraryRequest | null>(null);
// Stores the last request parameters
// Used for regeneration (future feature)
```

### Local State (ItineraryForm)
```typescript
const [city, setCity] = useState('');
// City name typed by user

const [cityCoordinates, setCityCoordinates] = useState<Coordinates | undefined>();
// Lat/lng from selected city (Nominatim)

const [radius, setRadius] = useState('5');
// Search radius in miles (default: 5)

const [preferences, setPreferences] = useState<string[]>([]);
// Selected activity types (Museums, Restaurants, etc.)

const [budget, setBudget] = useState<string>('');
// Optional total budget in USD

const [travelers, setTravelers] = useState<string>('1');
// Number of travelers (default: 1)

const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
// Autocomplete results from Nominatim API

const [showSuggestions, setShowSuggestions] = useState(false);
// Toggle autocomplete dropdown visibility
```

### Local State (MapView)
```typescript
const [isClient, setIsClient] = useState(false);
// Client-side rendering flag
// Prevents Leaflet initialization during SSR
// Set to true in useEffect after mount
```

## API Routes

### POST /api/generate-itinerary

**Location**: `app/api/generate-itinerary/route.ts`

**Purpose**: Generate a personalized travel itinerary using OpenAI's GPT-4o-mini model

**Request Body**:
```typescript
{
  city: string;              // Required: Destination city name
  radius: string;            // Required: Search radius (2, 5, 10, 20 miles)
  preferences: string[];     // Required: Activity types (min 1)
  coordinates?: {            // Optional: City center lat/lng
    lat: number;
    lng: number;
  };
  budget?: number;           // Optional: Total budget in USD
  travelers?: number;        // Optional: Number of travelers
}
```

**Response** (Success - 200):
```typescript
{
  city: string;              // City name
  itinerary: [
    {
      name: string;          // Activity/location name
      address: string;       // Full street address
      time: string;          // Time slot (e.g., "9:00 AM - 10:30 AM")
      duration: string;      // Duration (e.g., "1.5 hours")
      description: string;   // What to do here
      type: string;          // Activity type
      coordinates: {
        lat: number;
        lng: number;
      };
      travelTime?: string;   // Travel time from previous (e.g., "15 min walk")
      estimatedCost?: number; // Cost per person in USD
    }
  ];
  totalCost?: number;        // Total cost for all travelers (calculated client-side)
  budgetRemaining?: number;  // Remaining budget (calculated client-side)
}
```

**Response** (Error - 400):
```typescript
{
  error: "Missing required fields"
}
```

**Response** (Error - 500):
```typescript
{
  error: "OpenAI API key is not configured"
}
// OR
{
  error: "Failed to parse itinerary response. Please try again."
}
// OR
{
  error: "Failed to generate itinerary. Please try again."
}
```

**Processing Steps**:
1. Validate request body (city, radius, preferences present)
2. Check OpenAI API key exists
3. Calculate budget per person (if budget & travelers provided)
4. Construct AI prompt with:
   - City, radius, preferences
   - Budget constraints (if applicable)
   - Travel time requirements
   - Route optimization instructions
   - Cost estimation requirements
5. Call OpenAI API (GPT-4o-mini, temp=0.7, max_tokens=2000)
6. Parse JSON response (strip markdown if present)
7. Return itinerary JSON

## External Dependencies

### OpenAI API
**Purpose**: AI-powered itinerary generation
**Model**: gpt-4o-mini
**Usage**: Text generation with structured JSON output
**Configuration**: API key in environment variable
**Cost**: Pay-per-token pricing

### OpenStreetMap Nominatim API
**Purpose**: City geocoding and autocomplete
**Usage**:
- Client-side API calls for city search
- Returns lat/lng coordinates
- Returns formatted display names
**Rate Limits**: Fair use policy (1 request/second recommended)
**Cost**: Free

### Leaflet
**Purpose**: Interactive map rendering
**Usage**:
- Display itinerary locations on map
- Custom numbered markers
- Popups with activity details
**Configuration**: Client-side only rendering (no SSR)

## Key Technical Decisions

### Why Next.js 15 App Router?
- Server-side rendering for SEO
- API routes for backend logic
- Built-in optimization (code splitting, image optimization)
- Vercel deployment support

### Why GPT-4o-mini?
- Cost-effective ($0.15/1M input tokens vs $5/1M for GPT-4)
- Fast response times
- Sufficient capability for itinerary generation
- Structured JSON output support

### Why Leaflet instead of Mapbox?
- Free and open-source
- No API keys required
- Good community support
- Lighter weight than Mapbox GL JS

### Why OpenStreetMap Nominatim?
- Free geocoding service
- No API keys required
- Good coverage worldwide
- Autocomplete support

### Why Disable React Strict Mode?
- Leaflet doesn't support React 18 double-invocation pattern
- Strict mode causes map container to initialize twice
- Only affects development mode
- Production builds work fine either way

### Why Client-Side Map Rendering?
- Leaflet requires browser DOM APIs
- Server-side rendering causes hydration errors
- Client-side flag (`isClient`) prevents SSR issues
- Loading placeholder shown during mount

## Security Considerations

### API Key Protection
- OpenAI API key stored in environment variable
- Never exposed to client
- Server-side API routes only

### Input Validation
- Form validation before submission
- Server-side validation in API route
- Type safety with TypeScript

### Rate Limiting
- Nominatim: Client-side debouncing (300ms)
- OpenAI: No rate limiting (user pays per request)

## Performance Optimizations

### Code Splitting
- Dynamic import for MapView component
- Reduces initial bundle size
- Map loads only when needed

### Debouncing
- City autocomplete debounced to 300ms
- Reduces Nominatim API calls
- Better user experience

### Memoization
- Activity type colors computed once
- Marker icons created per render (Leaflet requirement)

### Map Optimization
- Auto-fit bounds to markers
- Max zoom level (14) prevents over-zooming
- Lazy loading of map tiles

## Deployment Architecture

### Vercel Deployment
```
GitHub Repository
    → Push to main branch
    → Vercel detects changes
    → Builds Next.js app
        - Compiles TypeScript
        - Bundles client code
        - Optimizes assets
    → Deploys to CDN
        - Edge functions for API routes
        - Static assets on CDN
        - Environment variables injected
    → Live at https://your-app.vercel.app
```

### Environment Variables (Production)
- `OPENAI_API_KEY`: Set in Vercel dashboard
- Automatically injected at build time
- Not included in client bundle

## Error Handling

### Client-Side Errors
- Form validation (empty fields)
- Network errors (fetch failures)
- Displayed in red banner at top

### Server-Side Errors
- Missing environment variables (500)
- Invalid request body (400)
- OpenAI API failures (500)
- JSON parsing errors (500)

### Graceful Degradation
- Missing travel times: Skip display
- Missing costs: Skip display
- Missing coordinates: Map doesn't render
- API errors: Show error message, allow retry

## Future Scalability

### Potential Enhancements
1. **Database Integration**
   - Save itineraries to PostgreSQL
   - User accounts (NextAuth.js)
   - Itinerary history

2. **Caching Layer**
   - Redis cache for popular cities
   - Reduce OpenAI API costs
   - Faster response times

3. **Real-Time Features**
   - WebSocket for live updates
   - Collaborative itinerary planning
   - Real-time map updates

4. **Multi-Day Itineraries**
   - Day tabs/carousel
   - Multi-day budget tracking
   - Hotel recommendations

5. **Analytics**
   - Track popular cities
   - Monitor API costs
   - User behavior analytics

## Accessibility

### WCAG Compliance
- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation support
- High contrast colors (WCAG AA)

### Screen Reader Support
- Alt text on map markers
- Descriptive button labels
- Form field labels
- Error announcements

## Browser Support

### Tested Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Required Features
- ES6+ JavaScript
- CSS Grid
- Fetch API
- LocalStorage (future feature)

## Monitoring & Debugging

### Development Tools
- Next.js Dev Server with HMR
- React Developer Tools
- TypeScript type checking
- ESLint for code quality

### Production Monitoring (Recommended)
- Vercel Analytics
- Sentry for error tracking
- OpenAI usage dashboard
- Vercel logs for API routes
