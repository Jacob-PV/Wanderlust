# API Integration Documentation

This document details all external API integrations used in the Travel Itinerary Generator.

## Table of Contents

- [OpenAI API](#openai-api)
- [OpenStreetMap Nominatim API](#openstreetmap-nominatim-api)
- [Leaflet Tile Servers](#leaflet-tile-servers)

---

## OpenAI API

### Overview

The OpenAI API powers the AI-driven itinerary generation using the GPT-4o-mini model.

### Configuration

**Environment Variable**: `OPENAI_API_KEY`

```env
# .env.local
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Get API Key**: [OpenAI Platform](https://platform.openai.com/api-keys)

### Model Used

**Model ID**: `gpt-4o-mini`

**Why GPT-4o-mini?**
- **Cost-effective**: $0.15 per 1M input tokens, $0.60 per 1M output tokens
- **Fast**: Lower latency than GPT-4
- **Capable**: Sufficient for structured JSON generation
- **Reliable**: Consistent output format

**Comparison with GPT-4**:
| Feature | GPT-4o-mini | GPT-4 |
|---------|-------------|-------|
| Input cost | $0.15/1M tokens | $5.00/1M tokens |
| Output cost | $0.60/1M tokens | $15.00/1M tokens |
| Speed | ~2-4 seconds | ~5-10 seconds |
| Quality | Good | Excellent |
| Use case | Itinerary generation | Complex reasoning |

### API Request Structure

**Endpoint**: `https://api.openai.com/v1/chat/completions`

**Method**: POST

**Headers**:
```javascript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_API_KEY"
}
```

**Request Body** (as used in our app):
```typescript
{
  model: 'gpt-4o-mini',
  messages: [
    {
      role: 'system',
      content: 'You are a helpful travel assistant that generates detailed itineraries. Always respond with valid JSON only, no additional text or formatting.'
    },
    {
      role: 'user',
      content: `You are a travel itinerary planner. Generate a detailed day itinerary for ${city}...`
    }
  ],
  temperature: 0.7,      // Creativity (0.0 = deterministic, 1.0 = creative)
  max_tokens: 2000       // Maximum response length
}
```

### Prompt Engineering

**Our Prompt Structure**:

```typescript
const prompt = `You are a travel itinerary planner. Generate a detailed day itinerary for ${city} with the following specifications:

- Search radius: ${radius} miles from the city center
- Activity preferences: ${preferences.join(', ')}
- Number of activities: 6-8 activities for a full day
- Time range: 9:00 AM to 9:00 PM
- Total budget: $${budget} USD for ${travelers} traveler(s) = $${budgetPerPerson.toFixed(2)} per person

CRITICAL Requirements:
1. Return ONLY valid JSON, no additional text or markdown
2. Include realistic locations that actually exist in ${city}
3. Provide specific addresses for each location
4. Include varied activities based on the preferences
5. **ACCOUNT FOR TRAVEL TIME**: Space activities appropriately with realistic travel time between locations
   - Consider walking time (15-20 min per mile)
   - Consider public transit time (10-15 min between stops)
   - Consider driving time in traffic (varies by city)
   - Leave buffer time between activities for transitions
6. **OPTIMIZE ROUTE**: Arrange activities in a logical geographic order to minimize backtracking
7. **REALISTIC TIMING**: Each activity's start time should account for:
   - Duration of previous activity
   - Travel time from previous location (estimate 10-30 minutes depending on distance)
   - Short breaks between activities (5-10 minutes)
8. **COST ESTIMATES**: Provide realistic cost estimates per person in USD
   - Include admission fees, meal costs, or activity costs
   - Use $0 for free activities (parks, walking tours, etc.)
   - Keep total costs within budget of $${budgetPerPerson.toFixed(2)} per person
   - Consider typical prices in ${city}
9. Include realistic coordinates (latitude/longitude) for each location within ${radius} miles of the city center

Return the response in this EXACT JSON format:
{
  "city": "${city}",
  "itinerary": [
    {
      "name": "Activity/Location Name",
      "address": "Full street address",
      "time": "Start time - End time (e.g., 9:00 AM - 10:30 AM)",
      "duration": "X hours/minutes",
      "description": "Brief description of what to do here (1-2 sentences)",
      "type": "One of: ${preferences.join(', ')}",
      "coordinates": {
        "lat": 0.0,
        "lng": 0.0
      },
      "travelTime": "Estimated travel time from previous location (e.g., '15 min walk' or '10 min drive'). Use 'Start of day' for first location.",
      "estimatedCost": 0.0
    }
  ]
}

IMPORTANT:
- Return ONLY the JSON object, no markdown code blocks or additional text
- Ensure times are sequential and realistic with travel time included
- Activities should be geographically optimized to minimize travel time
- estimatedCost should be per person in USD (use 0 for free activities)
- Total costs should stay within $${budgetPerPerson.toFixed(2)} per person budget`;
```

**Key Prompt Techniques**:
1. **System role**: Sets AI as travel assistant
2. **Clear instructions**: Specific requirements (6-8 activities, time range)
3. **Format specification**: Exact JSON structure with examples
4. **Constraints**: Budget, radius, preferences
5. **Important reminders**: Repeated at end for emphasis
6. **Examples**: Shows expected format

### Response Handling

**Successful Response** (200):
```typescript
{
  choices: [
    {
      message: {
        content: '{"city": "New York", "itinerary": [...]}'
      }
    }
  ],
  usage: {
    prompt_tokens: 850,
    completion_tokens: 1200,
    total_tokens: 2050
  }
}
```

**Our Parsing Logic**:
```typescript
// Extract response text
const responseText = completion.choices[0].message.content?.trim() || '';

// Remove markdown code blocks if AI adds them (sometimes happens)
let jsonText = responseText;
if (jsonText.startsWith('```json')) {
  jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
} else if (jsonText.startsWith('```')) {
  jsonText = jsonText.replace(/```\n?/g, '');
}

// Parse JSON
const itinerary: Itinerary = JSON.parse(jsonText);
```

### Error Handling

**Common Errors**:

**1. Invalid API Key** (401):
```json
{
  "error": {
    "message": "Incorrect API key provided",
    "type": "invalid_request_error"
  }
}
```
**Solution**: Verify `OPENAI_API_KEY` in `.env.local`

**2. Rate Limit** (429):
```json
{
  "error": {
    "message": "Rate limit reached",
    "type": "rate_limit_error"
  }
}
```
**Solution**: Implement retry logic or upgrade API plan

**3. Insufficient Credits** (429):
```json
{
  "error": {
    "message": "You exceeded your current quota",
    "type": "insufficient_quota"
  }
}
```
**Solution**: Add credits to OpenAI account

**4. Invalid JSON Response** (SyntaxError):
```
SyntaxError: Unexpected token in JSON
```
**Solution**: Already handled with try-catch and markdown stripping

### Cost Estimation

**Average Request**:
- Input: ~850 tokens (prompt with user data)
- Output: ~1,200 tokens (8 activities with details)
- Total: ~2,050 tokens

**Cost per Request**:
- Input: 850 tokens × $0.15/1M = $0.0001275
- Output: 1,200 tokens × $0.60/1M = $0.0007200
- **Total: ~$0.00085 per itinerary** (less than 1 cent)

**Monthly Costs** (estimates):
| Usage | Requests | Cost |
|-------|----------|------|
| Low (100/month) | 100 | $0.09 |
| Medium (1,000/month) | 1,000 | $0.85 |
| High (10,000/month) | 10,000 | $8.50 |
| Very High (100,000/month) | 100,000 | $85.00 |

**Cost Optimization Tips**:
1. Cache popular city itineraries (future feature)
2. Reduce `max_tokens` if possible
3. Use shorter prompts where feasible
4. Implement request throttling

### Rate Limits

**Free Tier**:
- 3 requests per minute (RPM)
- 200 requests per day (RPD)

**Paid Tier** (varies by usage):
- 3,500+ RPM
- 10,000+ RPD

**Our Implementation**:
- No rate limiting (user-triggered requests are infrequent)
- Future: Add request queue for high traffic

### Best Practices

**1. API Key Security**:
```typescript
// ✅ Good: Server-side only
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ❌ Bad: Never expose in client code
const apiKey = 'sk-proj-...';
```

**2. Error Handling**:
```typescript
try {
  const completion = await openai.chat.completions.create({...});
  const itinerary = JSON.parse(responseText);
  return NextResponse.json(itinerary);
} catch (error) {
  console.error('OpenAI API error:', error);
  return NextResponse.json(
    { error: 'Failed to generate itinerary' },
    { status: 500 }
  );
}
```

**3. Response Validation**:
```typescript
// Verify required fields exist
if (!itinerary.city || !itinerary.itinerary || itinerary.itinerary.length === 0) {
  throw new Error('Invalid itinerary structure');
}
```

---

## OpenStreetMap Nominatim API

### Overview

Nominatim is OpenStreetMap's free geocoding service, used for city autocomplete and coordinate lookup.

### Configuration

**No API key required!**

**Rate Limiting**: Fair use policy (1 request per second recommended)

**Terms of Use**: [Nominatim Usage Policy](https://operations.osmfoundation.org/policies/nominatim/)

### Endpoint

**Base URL**: `https://nominatim.openstreetmap.org`

**Search Endpoint**: `/search`

### API Request Structure

**Method**: GET

**Parameters**:
```typescript
{
  q: string,              // Search query (city name)
  format: 'json',         // Response format
  limit: 5,               // Max results (1-50)
  addressdetails: 1,      // Include address breakdown
  featuretype: 'city'     // Filter to cities (optional)
}
```

**Example Request**:
```
GET https://nominatim.openstreetmap.org/search?q=New%20York&format=json&limit=5&addressdetails=1&featuretype=city
```

**Required Headers**:
```typescript
{
  'User-Agent': 'TravelItineraryApp/1.0'  // Required by Nominatim
}
```

### Our Implementation

**Location** [components/ItineraryForm.tsx](components/ItineraryForm.tsx#L40):

```typescript
const fetchCitySuggestions = async () => {
  if (city.length < 2) {
    setSuggestions([]);
    return;
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        city
      )}&format=json&limit=5&addressdetails=1&featuretype=city`,
      {
        headers: {
          'User-Agent': 'TravelItineraryApp/1.0'
        }
      }
    );
    const data: NominatimResult[] = await response.json();
    setSuggestions(data);
    setShowSuggestions(true);
  } catch (error) {
    console.error('Error fetching city suggestions:', error);
  }
};

// Debounce to respect rate limits
const debounce = setTimeout(fetchCitySuggestions, 300);
```

### Response Structure

**Successful Response**:
```json
[
  {
    "place_id": 297618410,
    "licence": "Data © OpenStreetMap contributors, ODbL 1.0",
    "osm_type": "relation",
    "osm_id": 175905,
    "lat": "40.7127281",
    "lon": "-74.0060152",
    "class": "boundary",
    "type": "administrative",
    "place_rank": 16,
    "importance": 0.9754895765402,
    "addresstype": "city",
    "name": "New York",
    "display_name": "New York, New York, United States",
    "boundingbox": ["40.4773991", "40.9161785", "-74.2590879", "-73.7001809"]
  }
]
```

**Key Fields We Use**:
- `place_id`: Unique identifier
- `lat`, `lon`: Coordinates
- `display_name`: Full formatted name
- `name`: City name

### Type Definition

```typescript
export interface NominatimResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;              // Note: String, not number
  lon: string;              // Note: String, not number
  class: string;
  type: string;
  place_rank: number;
  importance: number;
  addresstype: string;
  name: string;
  display_name: string;     // Used for autocomplete display
  boundingbox: [string, string, string, string];
}
```

### Coordinate Conversion

**Nominatim returns strings**:
```typescript
const handleCitySelect = (result: NominatimResult) => {
  setCity(result.display_name);
  setCityCoordinates({
    lat: parseFloat(result.lat),   // Convert string to number
    lng: parseFloat(result.lon),   // Note: lon → lng
  });
  setShowSuggestions(false);
};
```

### Rate Limiting

**Fair Use Policy**:
- Max 1 request per second
- No bulk downloads
- Cache results when possible

**Our Implementation**:
- Debounce: 300ms delay before request
- Only search if `city.length >= 2`
- Client-side caching in state

**Debounce Logic**:
```typescript
useEffect(() => {
  const debounce = setTimeout(fetchCitySuggestions, 300);
  return () => clearTimeout(debounce);  // Cleanup
}, [city]);
```

### Error Handling

**Common Errors**:

**1. Missing User-Agent** (403):
```
HTTP 403 Forbidden
```
**Solution**: Always include User-Agent header (implemented)

**2. Rate Limit Exceeded** (429):
```
HTTP 429 Too Many Requests
```
**Solution**: Increase debounce time or implement backoff

**3. No Results**:
```json
[]
```
**Solution**: Show "No cities found" message (not currently implemented)

**4. Network Error**:
```
Failed to fetch
```
**Solution**: Handle in catch block, log error

### Best Practices

**1. Respect Rate Limits**:
```typescript
// ✅ Good: Debounce input
const debounce = setTimeout(fetchCitySuggestions, 300);

// ❌ Bad: Call on every keystroke
onChange={(e) => {
  setCity(e.target.value);
  fetchCitySuggestions();  // Too frequent!
}}
```

**2. Include User-Agent**:
```typescript
// ✅ Good: Identify your app
headers: {
  'User-Agent': 'TravelItineraryApp/1.0'
}

// ❌ Bad: No User-Agent (will get 403)
headers: {}
```

**3. Validate Results**:
```typescript
// Check if results exist before displaying
{showSuggestions && suggestions.length > 0 && (
  <div className="autocomplete-dropdown">
    {suggestions.map(result => ...)}
  </div>
)}
```

### Alternative Geocoding Services

If Nominatim becomes unreliable or rate-limited:

**1. Mapbox Geocoding API**:
- Requires API key
- 100,000 requests/month free
- Faster and more accurate
- Better autocomplete

**2. Google Places Autocomplete**:
- Requires API key and billing
- Very accurate
- Expensive ($2.83-$17 per 1,000 requests)

**3. LocationIQ**:
- Similar to Nominatim
- 5,000 requests/day free
- Faster response times

---

## Leaflet Tile Servers

### Overview

Leaflet uses tile servers to render map imagery. We use OpenStreetMap's free tile server.

### Configuration

**No API key required!**

**Tile URL**: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`

**Attribution Required**: Yes (legal requirement)

### Implementation

**Location**: [components/MapView.tsx](components/MapView.tsx#L105)

```typescript
<TileLayer
  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
/>
```

### Tile URL Parameters

- `{s}`: Subdomain (a, b, or c) for load balancing
- `{z}`: Zoom level (0-19)
- `{x}`: Tile X coordinate
- `{y}`: Tile Y coordinate

**Example**:
```
https://a.tile.openstreetmap.org/12/1205/1539.png
               ^                   ^  ^    ^
               |                   |  |    |
          subdomain              zoom x    y
```

### Alternative Tile Providers

**1. CartoDB (Dark Mode)**:
```typescript
<TileLayer
  attribution='&copy; OpenStreetMap, &copy; CartoDB'
  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
/>
```

**2. Stamen Terrain**:
```typescript
<TileLayer
  attribution='Map tiles by Stamen Design, under CC BY 3.0. Data by OpenStreetMap, under ODbL'
  url="https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg"
/>
```

**3. Mapbox Satellite** (requires token):
```typescript
<TileLayer
  attribution='Imagery © Mapbox'
  url="https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}.png?access_token=YOUR_MAPBOX_TOKEN"
/>
```

### Usage Policy

**OpenStreetMap Tile Usage Policy**:
- Heavy use requires own tile server
- Cache tiles when possible
- Include proper attribution
- Fair use for low-traffic apps

**Our Usage**:
- Low traffic (user-triggered map loads)
- Attribution included
- No caching (browser default)
- Well within fair use limits

### Performance

**Tile Loading**:
- Cached by browser
- Loaded on-demand (zoom/pan)
- Lazy loading (not SSR)

**Optimization**:
```typescript
<MapContainer
  zoom={12}           // Default zoom
  scrollWheelZoom={true}  // Enable scroll zoom
>
```

---

## API Monitoring

### Tracking API Usage

**OpenAI**:
- Dashboard: [platform.openai.com/usage](https://platform.openai.com/usage)
- Metrics: Requests, tokens, costs
- Alerts: Set up billing alerts

**Nominatim**:
- No built-in monitoring
- Use browser Network tab
- Implement client-side logging

**Leaflet Tiles**:
- No monitoring needed (free)
- Browser caches tiles automatically

### Cost Tracking

**Implement Usage Logging** (future feature):

```typescript
// app/api/generate-itinerary/route.ts
const logAPIUsage = async (tokens: number, cost: number) => {
  // Log to database or analytics service
  await analytics.track('openai_request', {
    tokens,
    cost,
    timestamp: new Date(),
  });
};

// After OpenAI call
const usage = completion.usage;
const cost = (usage.prompt_tokens * 0.15 + usage.completion_tokens * 0.60) / 1000000;
await logAPIUsage(usage.total_tokens, cost);
```

### Error Monitoring

**Recommended: Sentry Integration**

```bash
npm install @sentry/nextjs
```

```typescript
// app/api/generate-itinerary/route.ts
import * as Sentry from '@sentry/nextjs';

try {
  const completion = await openai.chat.completions.create({...});
} catch (error) {
  Sentry.captureException(error, {
    tags: { api: 'openai' },
    extra: { city, radius, preferences },
  });
  throw error;
}
```

---

## API Testing

### Testing OpenAI API

**Using curl**:
```bash
curl https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [
      {
        "role": "user",
        "content": "Generate a JSON itinerary for New York"
      }
    ],
    "max_tokens": 500
  }'
```

**Using Postman**:
1. Create new request
2. Method: POST
3. URL: `https://api.openai.com/v1/chat/completions`
4. Headers:
   - `Content-Type: application/json`
   - `Authorization: Bearer YOUR_API_KEY`
5. Body: Raw JSON (see curl example)

### Testing Nominatim API

**Using browser**:
```
https://nominatim.openstreetmap.org/search?q=New+York&format=json&limit=5
```

**Using curl**:
```bash
curl "https://nominatim.openstreetmap.org/search?q=New+York&format=json&limit=5" \
  -H "User-Agent: TravelItineraryApp/1.0"
```

### Testing in Development

**API Route Testing**:
```bash
# Start dev server
npm run dev

# Test API endpoint
curl -X POST http://localhost:3000/api/generate-itinerary \
  -H "Content-Type: application/json" \
  -d '{
    "city": "New York",
    "radius": "5",
    "preferences": ["Museums", "Restaurants"],
    "coordinates": {"lat": 40.7128, "lng": -74.0060}
  }'
```

---

## Summary

### API Costs (Monthly Estimates)

| API | Free Tier | Paid Usage | Our App |
|-----|-----------|------------|---------|
| OpenAI | N/A | $0.85/1K requests | ~$0.85-$85/month |
| Nominatim | Unlimited (fair use) | N/A | Free |
| OSM Tiles | Unlimited (fair use) | N/A | Free |

### API Dependencies

```
Travel Itinerary Generator
│
├── OpenAI API (Required)
│   ├── Environment: OPENAI_API_KEY
│   ├── Cost: ~$0.00085 per request
│   └── Usage: Itinerary generation
│
├── Nominatim API (Required)
│   ├── Environment: None
│   ├── Cost: Free
│   └── Usage: City autocomplete
│
└── OSM Tiles (Required)
    ├── Environment: None
    ├── Cost: Free
    └── Usage: Map rendering
```

### Recommended Next Steps

1. **Implement caching** for popular cities
2. **Add error monitoring** (Sentry)
3. **Track API costs** in dashboard
4. **Consider backup APIs** (Mapbox, Google Places)
5. **Implement rate limiting** for high traffic
