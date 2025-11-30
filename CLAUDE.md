# Project Context for AI Assistants

This file provides context and conventions for AI assistants (like Claude) working on this codebase.

## Project Overview

The Travel Itinerary Generator is a Next.js web app that uses OpenAI's GPT-4o-mini to generate personalized day trip itineraries. Users select a city, radius, activity preferences, and optional budget, then receive a complete itinerary with activities, times, costs, travel times, and an interactive map showing all locations.

## Key Architectural Decisions

### Why These Technologies?

- **Next.js 15 with App Router**: Enables server-side API routes for secure OpenAI integration, SSR for SEO, built-in optimizations, and seamless Vercel deployment
- **Leaflet instead of Mapbox**: Free and open-source with no API keys required, lighter weight, good community support. User specifically requested this over Mapbox to avoid costs and API key management
- **OpenAI GPT-4o-mini**: Cost-effective ($0.15/1M input tokens vs $5/1M for GPT-4), fast response times (~2-4 seconds), sufficient capability for structured JSON generation. Each itinerary costs ~$0.00085
- **Google Places API**: Enriches activities with real reviews, ratings, photos, pricing, and contact details. $200/month free tier covers ~4,000 place enrichments. Optional but highly recommended for production
- **OpenStreetMap Nominatim**: Free geocoding service for city autocomplete with no API key required
- **TypeScript**: Type safety prevents runtime errors, excellent IDE support, self-documenting code
- **Tailwind CSS**: Rapid UI development, consistent design system, small bundle size with purging
- **Vercel**: Zero-config deployment, edge functions for API routes, automatic HTTPS, perfect Next.js integration

### Important Design Patterns

**API Routes in `/app/api`**:
- Server-side only (keeps OpenAI API key secure)
- Validation before OpenAI calls (prevent wasted tokens)
- Structured error responses (400 for client errors, 500 for server errors)
- JSON parsing with markdown stripping (OpenAI sometimes adds ```json blocks)

**Component Organization**:
- By feature: ItineraryForm (input), ItineraryDisplay (results), MapView (visualization)
- Google Places UI: RatingDisplay (star ratings), ReviewCard (individual reviews)
- Separation of concerns: page.tsx orchestrates, components handle specific UI
- Client components marked with 'use client' directive
- Progressive enrichment: ActivityCard fetches Google data independently

**State Management**:
- React useState for local state (no Redux/Zustand needed for this size)
- Parent component (page.tsx) holds global state (itinerary, loading, error)
- Props drilling acceptable for this small app (3 components)
- No prop drilling beyond 2 levels

**Error Handling**:
- Try-catch blocks in all async operations
- User-friendly error messages (not technical details)
- Console.error for debugging (server logs in production)
- Graceful degradation (missing travel times/costs don't break UI)

**React Strict Mode**:
- **DISABLED** in next.config.ts to prevent Leaflet double-initialization
- This is intentional - Leaflet doesn't support React 18's double-invocation pattern
- Only affects development mode, production works fine

## Code Conventions

### Naming

- **Components**: PascalCase (e.g., `ItineraryForm.tsx`, `MapView.tsx`)
- **Utilities**: camelCase (e.g., `getMarkerColor`, `createNumberedIcon`)
- **API routes**: kebab-case folder names (e.g., `generate-itinerary/route.ts`)
- **Types/Interfaces**: PascalCase with descriptive names (e.g., `GenerateItineraryRequest`)
- **Files**: Match the export name (`ItineraryForm.tsx` exports `ItineraryForm`)

### File Structure Preferences

- **Keep components under 300 lines** - extract helpers if needed
- **Co-locate helper functions** with components (not separate utils/ for small helpers)
- **One component per file** - no multiple component exports
- **Client-side only components** use 'use client' directive at top

### Styling Approach

- **Use Tailwind CSS utility classes exclusively**
- **No custom CSS** except for Leaflet fixes in globals.css
- **Mobile-first responsive design** (base styles for mobile, md: for tablet, lg: for desktop)
- **Consistent spacing**: Use 4, 6, 8 for padding/margins (e.g., p-6, mb-4)
- **Color palette**: Blue for primary actions, green for success/costs, red for errors
- **Group related classes**: Layout → Spacing → Colors → Typography → Effects
  ```typescript
  // Good
  className="flex items-center gap-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"

  // Bad (random order)
  className="text-white px-6 bg-blue-600 flex rounded-lg items-center hover:bg-blue-700 gap-4 py-3 transition-colors"
  ```

### TypeScript Usage

- **Always define proper types/interfaces** in types/index.ts
- **Avoid `any` type** - use `unknown` if type is truly unknown
- **Strict mode enabled** in tsconfig.json
- **Define return types** for functions (helps catch errors)
- **Use optional chaining** (`?.`) and nullish coalescing (`??`) for safety
- **Example**:
  ```typescript
  // Good
  const totalCost = itinerary?.totalCost ?? 0;

  // Bad
  const totalCost = itinerary.totalCost || 0;  // Wrong for 0 values
  ```

## External API Guidelines

### Google Places API

**Setup**: See [GOOGLE_SETUP.md](GOOGLE_SETUP.md) for complete setup instructions

**Model**: Progressive enrichment
- **Cost per place**: ~$0.049 (Text Search + Place Details)
- **Free tier**: $200/month credit (~4,000 place enrichments)
- **Caching**: 24-hour in-memory cache (production should use Redis/database)

**API Flow**:
1. **Text Search**: Find place by name + city (returns `place_id`)
2. **Place Details**: Get reviews, ratings, photos using `place_id`

**Fields Requested** (cost optimization):
```typescript
const fields = [
  'place_id',
  'name',
  'rating',
  'user_ratings_total',
  'reviews',
  'photos',
  'price_level',
  'opening_hours',
  'formatted_phone_number',
  'website',
  'formatted_address',
].join(',');
```

**Error Handling**:
- Handle `ZERO_RESULTS` gracefully (place not found)
- Handle `OVER_QUERY_LIMIT` (quota exceeded)
- Silently fail for non-critical enrichment
- Display itinerary even if Google data unavailable

**Cost Optimization Tips**:
- ✅ Server-side caching with 24h TTL
- ✅ Only request needed fields
- ✅ Progressive loading (don't block itinerary display)
- ✅ Graceful degradation (app works without Google data)
- Consider Redis/database caching for production

**Progressive Loading Pattern**:
```typescript
// Each ActivityCard fetches its own Google data
useEffect(() => {
  const enrichPlace = async () => {
    const response = await fetch('/api/enrich-place', {
      method: 'POST',
      body: JSON.stringify({ name, address, city, coordinates }),
    });
    if (response.ok) {
      setEnrichedData(await response.json());
    }
  };
  enrichPlace();
}, [name, address, city]);
```

**Photo Display**:
```typescript
// Photos require client-side API key (NEXT_PUBLIC_)
const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoRef}&key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY}`;
```

**Security**:
- Server key (`GOOGLE_PLACES_API_KEY`): API restrictions only
- Client key (`NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`): HTTP referrer restrictions
- Never expose server key to client
- Set up billing alerts in Google Cloud

### OpenAI API

**Model**: `gpt-4o-mini`
- **DO NOT** change to gpt-4 without user approval (33x more expensive)
- Temperature: 0.7 (balanced creativity vs consistency)
- Max tokens: 2000 (sufficient for 6-8 activities)

**Prompt Engineering Principles**:
1. **Role definition first**: "You are a travel itinerary planner..."
2. **Be extremely specific about JSON format** - include example structure
3. **Request coordinates explicitly** - AI sometimes omits them
4. **Constrain output size**: "6-8 activities" prevents excessive tokens
5. **Repeat critical requirements** at the end (AI pays more attention)
6. **Use BOLD/CAPS for emphasis**: "CRITICAL Requirements:", "IMPORTANT:"
7. **Test prompt changes** with multiple cities before committing

**Error Handling**:
- Always wrap OpenAI calls in try-catch
- Handle rate limiting gracefully (429 status)
- Strip markdown code blocks (``json ... ``) before parsing
- Validate JSON structure after parsing

**Cost Optimization**:
- Current cost: ~$0.00085 per itinerary
- Keep prompts concise but specific
- Don't increase max_tokens unnecessarily
- Consider caching popular cities (future enhancement)

### OpenStreetMap Nominatim API

**Rate Limiting**:
- **MUST include User-Agent header**: `'TravelItineraryApp/1.0'` (403 error without it)
- Fair use policy: 1 request per second recommended
- **Debounce autocomplete**: 300ms delay (currently implemented)
- No API key required

**Response Parsing**:
- Coordinates returned as **strings**, must parse to numbers
- Field is `lon` not `lng` - convert when storing
- `display_name` is best for autocomplete display
- `lat` and `lon` are required fields

**Graceful Degradation**:
- Handle empty results (no cities found)
- Show loading state during fetch
- Clear previous suggestions on new search

### Leaflet Tile Servers

**Current Setup**: OpenStreetMap standard tiles
- URL: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- Attribution required (legal requirement)
- No API key needed
- Fair use for low-traffic apps

**Alternative Tile Providers** (if needed):
- CartoDB Dark: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`
- Stamen Terrain: `https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg`

**Client-Side Rendering**:
- **CRITICAL**: MapView must render client-side only
- Use `isClient` state flag to prevent SSR
- Show loading placeholder during mount
- This prevents Leaflet's window/document dependencies from breaking SSR

## Common Modification Scenarios

### Adding a New Activity Type

**Step-by-step**:
1. Add to `ActivityType` union in [types/index.ts](types/index.ts#L250)
2. Add to `ACTIVITY_TYPES` array in [types/index.ts](types/index.ts#L268)
3. Add color to `activityTypeColors` in [components/ItineraryDisplay.tsx](components/ItineraryDisplay.tsx#L8)
4. Add hex color to `activityTypeColors` in [components/MapView.tsx](components/MapView.tsx#L57)
5. Test: Select new type → Generate itinerary → Verify colors on timeline and map

**Example** (adding "Beaches"):
```typescript
// 1. types/index.ts
export type ActivityType =
  | 'Restaurants'
  | 'Museums'
  // ...
  | 'Beaches';  // Add here

// 2. types/index.ts
export const ACTIVITY_TYPES: ActivityType[] = [
  'Restaurants',
  // ...
  'Beaches',  // Add here
];

// 3. ItineraryDisplay.tsx
const activityTypeColors: Record<string, string> = {
  'Restaurants': 'bg-orange-100 text-orange-800 border-orange-300',
  // ...
  'Beaches': 'bg-cyan-100 text-cyan-800 border-cyan-300',  // Add here
};

// 4. MapView.tsx
const activityTypeColors: Record<string, string> = {
  'Restaurants': '#f97316',
  // ...
  'Beaches': '#06b6d4',  // Cyan hex color
};
```

### Modifying the OpenAI Prompt

**Location**: [app/api/generate-itinerary/route.ts](app/api/generate-itinerary/route.ts#L117)

**Common Changes**:

**Adjust travel time assumptions**:
```typescript
5. **ACCOUNT FOR TRAVEL TIME**:
   - Consider walking time (15-20 min per mile)  // Change these
   - Consider public transit time (10-15 min between stops)  // values
```

**Change number of activities**:
```typescript
- Number of activities: 6-8 activities for a full day  // Change range
```

**Adjust time range**:
```typescript
- Time range: 9:00 AM to 9:00 PM  // Change start/end times
```

**IMPORTANT**:
- Test prompt changes with 3-5 different cities
- Verify JSON structure remains valid
- Check that all required fields are populated
- Monitor costs if adding complexity

### Changing Map Behavior

**Map initialization** in [components/MapView.tsx](components/MapView.tsx#L186):

```typescript
<MapContainer
  center={center}
  zoom={12}              // Change default zoom (1-18)
  scrollWheelZoom={true} // Enable/disable scroll zoom
/>
```

**Auto-fit bounds** ([MapView.tsx:141](components/MapView.tsx#L141)):
```typescript
map.fitBounds(bounds, {
  padding: [50, 50],  // Change margin around markers
  maxZoom: 14         // Prevent over-zooming on close activities
});
```

**Marker appearance** ([MapView.tsx:90](components/MapView.tsx#L90)):
- Change `width`, `height` for size
- Change `border-radius` to 0 for square markers
- Change `font-size` for larger numbers

### Modifying Budget Logic

**Client-side calculation** in [app/page.tsx](app/page.tsx#L46):
```typescript
const totalCostPerPerson = result.itinerary.reduce(
  (sum, item) => sum + (item.estimatedCost || 0),
  0
);

if (data.budget && data.travelers) {
  result.totalCost = totalCostPerPerson * data.travelers;
  result.budgetRemaining = data.budget - result.totalCost;
}
```

**Server-side budget guidance** in [route.ts](app/api/generate-itinerary/route.ts#L90):
```typescript
const budgetPerPerson = budget && travelers ? budget / travelers : 0;
```

## Testing Considerations

### Test with Various Cities
- **Major cities**: New York, Los Angeles, London, Tokyo
- **International**: Paris, Sydney, Rio de Janeiro (test non-English)
- **Smaller cities**: Portland, Austin, Charleston (limited activities)
- **Edge cases**: Very small towns (may lack activities)

### Test Edge Cases
- **Very small radius** (2 miles): Should still find 6-8 activities
- **Very large radius** (20 miles): Activities should be optimized geographically
- **All activity types selected**: Should provide variety
- **Single activity type**: Should find 6-8 of that type
- **Zero budget**: AI should recommend free/cheap activities
- **Large group** (20 travelers): Costs should multiply correctly
- **Missing coordinates**: Map shouldn't break

### Mobile Testing
- Test on actual mobile device or Chrome DevTools mobile viewport
- Verify autocomplete dropdown is accessible
- Check map markers are large enough to tap
- Ensure budget summary is readable on small screens

### API Error Scenarios
- **Invalid OpenAI API key**: Should show error message
- **Network timeout**: Should handle gracefully
- **Invalid JSON from AI**: Should catch parse error
- **Empty city search**: Should handle no results

## Performance Considerations

### OpenAI API Response Time
- **Average**: 2-4 seconds for itinerary generation
- **Always show loading modal** during API call
- **User feedback**: Spinner + message ("Generating Your Itinerary...")
- **Timeout handling**: Consider adding timeout after 30 seconds

### Map Loading
- **Lazy load map**: Only render when itinerary exists
- **Client-side only**: Prevents SSR overhead
- **Tile caching**: Browser automatically caches map tiles
- **Initial zoom**: Balanced to show all markers without loading excessive tiles

### Bundle Size
- **Next.js**: Automatic code splitting
- **Dynamic imports**: MapView is dynamically imported in page.tsx
- **Tailwind**: Purges unused classes in production
- **Current bundle size**: ~200KB (acceptable for this app)

### Potential Optimizations
- **Cache popular cities**: Store generated itineraries in Redis/database
- **Request debouncing**: Already implemented for city autocomplete (300ms)
- **Image optimization**: Use Next.js Image component if adding images
- **API route caching**: Consider caching identical requests (same city+preferences)

## Known Limitations & Future Improvements

### Current Limitations
- **Single-day itineraries only** - no multi-day support
- **No user authentication** - can't save or retrieve past itineraries
- **OpenAI knowledge cutoff** - may suggest closed/outdated places
- **No real-time availability** - doesn't check if attractions are open
- **No booking integration** - users must book activities separately
- **Static routes** - doesn't use real-time traffic data

### Potential Future Enhancements
- **Multi-day itineraries**: Add day selection, hotel recommendations
- **User accounts**: Save itineraries, share via link
- **PDF export**: Download itinerary as PDF
- **Real-time data**: Integration with Google Places API for hours/reviews
- **Weather integration**: Adjust recommendations based on forecast
- **Collaborative planning**: Multiple users edit same itinerary
- **Analytics**: Track popular cities, activity types
- **Route optimization**: Use routing APIs for exact travel times

## Environment Setup Reminders

### Required Environment Variables

**Development** (`.env.local`):
```env
# Required
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx

# Required for Google Places integration
GOOGLE_PLACES_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Optional - for displaying Google Place photos
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**Production** (Vercel Dashboard):
- `OPENAI_API_KEY`: Get from [OpenAI Platform](https://platform.openai.com/api-keys)
- `GOOGLE_PLACES_API_KEY`: Get from [Google Cloud Console](https://console.cloud.google.com/apis/credentials) - See [GOOGLE_SETUP.md](GOOGLE_SETUP.md)
- `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`: Optional, for photos only

**Note**: Nominatim and OSM are still free without keys

### Setup Steps
1. `npm install` - Install all dependencies
2. Create `.env.local` from `.env.example`
3. Add OpenAI API key to `.env.local`
4. (Optional) Follow [GOOGLE_SETUP.md](GOOGLE_SETUP.md) to set up Google Places API
5. Add Google Places API key(s) to `.env.local`
6. `npm run dev` - Start development server
7. Open http://localhost:3000

## When Making Changes

### Before Modifying Code

**Checklist**:
- [ ] Check if similar functionality already exists
- [ ] Consider impact on API costs (OpenAI charges per token)
- [ ] Ensure TypeScript types are updated if changing data structures
- [ ] Test on mobile viewport (Chrome DevTools or actual device)
- [ ] Review existing documentation for context

**Cost Considerations**:
- Adding fields to AI prompt increases input tokens
- Increasing max_tokens increases costs
- Current cost per itinerary: ~$0.00085
- Test prompt changes to estimate new costs

### After Making Changes

**Verification Steps**:
1. **Update relevant documentation** (README, ARCHITECTURE, etc.)
2. **Test the full user flow**:
   - Enter city → Select preferences → Generate → View results → View map
3. **Check browser console** for errors/warnings
4. **Verify responsive design** on mobile, tablet, desktop
5. **Test with different cities** to ensure reliability
6. **Run TypeScript check**: `npx tsc --noEmit`
7. **Build locally**: `npm run build` to catch build errors

**Git Workflow**:
```bash
git checkout -b feature/your-feature-name
# Make changes
git add .
git commit -m "feat: descriptive commit message"
git push origin feature/your-feature-name
# Create pull request
```

## Quick Reference Commands

```bash
# Development
npm install              # Install dependencies
npm run dev             # Start dev server (http://localhost:3000)
npm run build           # Build for production
npm run start           # Run production build locally
npm run lint            # Run ESLint

# TypeScript
npx tsc --noEmit        # Check types without building

# Testing
# (No test suite currently - manual testing only)

# Deployment
vercel                  # Deploy to Vercel (requires Vercel CLI)
git push origin main    # Auto-deploys if connected to Vercel
```

## AI Assistant Preferences

### When Helping with This Project

**Prioritize**:
1. **User experience** - Clear error messages, loading states, intuitive UI
2. **Error handling** - Graceful degradation, no crashes
3. **Mobile responsiveness** - Test on small screens
4. **API cost optimization** - Don't waste OpenAI tokens
5. **Type safety** - Maintain TypeScript strictness

**Code Style**:
- **Concise but readable** - No unnecessary complexity
- **Functional components** - Always use hooks, never class components
- **Descriptive names** - `handleCitySelect` better than `handleClick`
- **Early returns** - Reduce nesting with guard clauses

**Comments**:
- **Add comments for complex logic** - Why, not what
- **Avoid obvious comments** - Don't comment `setIsLoading(true)`
- **Use JSDoc for functions** - Helps with IDE autocomplete
- **Inline comments for decisions** - Explain architectural choices

**Error Messages**:
- **User-friendly** - "Failed to generate itinerary" not "OpenAI API error"
- **Actionable** - "Please try again" or "Check your internet connection"
- **Logged for debugging** - `console.error()` for developers

**Performance**:
- **Consider API costs** - Each OpenAI call costs money
- **Optimize bundle size** - Use dynamic imports for heavy components
- **Lazy load when possible** - Map only loads when needed
- **Test load times** - Keep initial page load under 3 seconds

## Project-Specific Notes

### OpenAI Prompt Tuning
- The prompt is **carefully tuned for realistic locations**
- Don't make it too creative - users want actual places, not fictional ones
- Always include specific addresses in the prompt requirements
- Geographic optimization is critical for travel time accuracy

### Map Marker Accessibility
- Markers should be **at least 32x32px** for touch targets
- Use **high contrast colors** (white border on colored background)
- Numbers should be **bold and 14px+** for readability
- Consider color-blind friendly palette (avoid red-green only)

### Form Validation
- **Client-side validation** for better UX (instant feedback)
- **Server-side validation** for security (never trust client)
- Current validation: city required, preferences min 1, radius required
- Budget and travelers are optional (gracefully handled)

### Rate Limiting Considerations
- **Not currently implemented** - each request hits OpenAI immediately
- **Production consideration**: Add rate limiting to prevent abuse
- **Options**: Redis-based limiter, Vercel rate limiting, API key rotation
- **Cost protection**: Set billing alerts on OpenAI dashboard

### Leaflet-Specific Quirks
- **React Strict Mode must be disabled** - This is intentional
- **Client-side rendering only** - Use `isClient` flag pattern
- **Custom markers** - Must use DivIcon, not regular Icon class
- **Bounds must be set after markers** - Use FitBounds component pattern

### Budget Feature Details
- **Per-person costs** from AI, multiplied by travelers on client
- **Budget remaining** can be negative (shown as "X over budget")
- **Free activities** shown in green with "Free" label
- **Cost estimates** are guidelines, not guarantees

---

**Last Updated**: 2025-01-29
**For Questions**: Check [ARCHITECTURE.md](ARCHITECTURE.md), [DEVELOPMENT.md](DEVELOPMENT.md), or [API.md](API.md)
**Quick Start**: See [QUICK_START.md](QUICK_START.md) for 5-minute setup
