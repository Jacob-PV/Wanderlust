# Changelog

All notable changes to the Wanderlust Travel Itinerary Generator will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-01-30

### Added - Multi-Day Trip Support

#### =Å Calendar & Date Selection
- **Visual calendar date picker** using react-day-picker with range selection
- **Quick select buttons** for common trip lengths:
  - Single day
  - Weekend (2 days)
  - 3 days
  - 1 week
  - 2 weeks
- **Date range validation** - prevents past dates, 14-day maximum
- **Trip duration display** - shows calculated number of days
- **Responsive calendar design** - optimized for mobile and desktop

#### =Ó Multi-Day Planning
- **Intelligent day-type system**:
  - Arrival day: Activities start at 2:00 PM (accounts for travel/check-in)
  - Full days: Activities from 9:00 AM to 9:00 PM
  - Departure day: Activities end by 2:00 PM (checkout/travel)
- **Trip pace control** - User selects activity intensity:
  - Relaxed: 3-4 activities per full day
  - Moderate: 5-6 activities per full day
  - Packed: 7-8 activities per full day
- **Daily hours slider** - Customize hours of activities per day (6-12 hours)
- **Day-by-day navigation** with tab interface
- **Per-day summaries** - Optional AI-generated day themes

#### =ú Enhanced Mapping
- **Multi-day map view** with color-coded markers (14 distinct colors)
- **Daily route visualization** - Dashed polylines connecting activities on same day
- **Day legend** showing color coding and activity counts per day
- **Smaller markers** for multi-day trips (better visibility with many activities)
- **Enhanced popups** with day badges and activity context

#### = Activity Replacement System
- **Replace any activity** - "Replace this »" button on every activity card
- **Find alternatives** API endpoint using Google Places Nearby Search
- **AI-powered rescheduling** - Automatically optimizes entire itinerary after replacement
- **Route optimization** - Minimizes backtracking when activities change
- **Time adjustments** - Recalculates all timing after replacement
- **Change notifications** - Toast messages with summary of changes
- **Undo/Redo support** for single-day itineraries (multi-day coming soon)

### Added - Google Places Integration

#### P Reviews & Ratings
- **Real star ratings** - 1-5 stars from Google Places
- **Review counts** - Display total number of reviews
- **User reviews** - Full text reviews with author names and photos
- **Review cards** - Formatted display with author profile pictures
- **Expandable reviews** - "Show/Hide reviews" toggle per activity
- **Rating display component** - Reusable star visualization

#### =ø Place Photos
- **High-quality photos** from Google Places
- **Lazy loading** - Images load as needed
- **Photo credits** - Attribution to Google Places
- **Responsive images** - Optimized for different screen sizes

#### =µ Place Details
- **Price levels** - Display cost indicators (Free, $, $$, $$$, $$$$)
- **Open/closed status** - Live status badges ( Open now /  Closed)
- **Opening hours** - Current open/closed information
- **Contact information** - Direct links to:
  - Website
  - Phone number (tap to call on mobile)
- **Verified addresses** - Google-verified locations

#### =€ Performance Optimizations
- **Progressive enrichment** - Itinerary loads instantly, reviews load in background
- **24-hour caching** - Reduces API costs and improves speed
- **Parallel fetching** - Multiple activities enriched simultaneously
- **Graceful degradation** - App works without Google Places data

### Added - UI/UX Improvements

#### <¨ Visual Enhancements
- **Enhanced day navigation** with gradient tabs
- **Stagger animations** for activity cards
- **Loading skeletons** while enriching activities
- **Shimmer effects** for loading states
- **Premium card designs** with hover effects and shadows
- **Glass effect containers** with backdrop blur
- **Emoji indicators** for day types ( Arrival, < Full, =K Departure)

#### =ñ Mobile Improvements
- **Responsive calendar** - Optimized layout for small screens
- **Touch-friendly controls** - Large tap targets
- **Swipeable day tabs** - Horizontal scroll on mobile
- **Collapsible sections** - Reviews toggle to save space
- **Mobile-optimized forms** - Better input experiences

####  Accessibility
- **Keyboard navigation** - Full keyboard support for calendar and tabs
- **ARIA labels** - Screen reader support
- **Focus indicators** - Clear visual focus states
- **Semantic HTML** - Proper heading hierarchy

### Changed

#### API Routes
- **`/api/generate-itinerary`** - Now supports both single-day and multi-day generation
  - Accepts optional `dateRange`, `pace`, and `dailyHours` parameters
  - Returns `MultiDayItinerary` for multi-day trips
  - Returns `Itinerary` for single-day trips
  - Dynamic token allocation based on trip length (1000 + 500 * numDays)
- **Enhanced OpenAI prompts** - Separate prompts for single-day vs multi-day
- **Better geographic optimization** - Minimizes backtracking across days

#### Components
- **ItineraryForm.tsx** - Now includes DateRangePicker and trip pace controls
- **Page.tsx** - Handles both single-day and multi-day state separately
- **MapView** - Enhanced for both single and multi-day display
- **Activity cards** - Now include Google Places data and replace button

#### Type System
- **New types**:
  - `DateRange` - Start and end dates
  - `TripPace` - 'relaxed' | 'moderate' | 'packed'
  - `DayType` - 'arrival' | 'full' | 'departure'
  - `DayItinerary` - Single day within multi-day trip
  - `MultiDayItinerary` - Complete multi-day trip structure
  - `GooglePlaceData` - Google Places enrichment data
  - `EnrichPlaceRequest` - Request format for place enrichment
- **Extended types**:
  - `GenerateItineraryRequest` - Added dateRange, pace, dailyHours
  - `ItineraryItem` - Added optional googleData field

#### Styling
- **Custom CSS** for react-day-picker calendar
- **Range slider styles** for trip pace and daily hours
- **New color scheme** for multi-day maps (14 day colors)
- **Enhanced scrollbar** - Custom styled scrollbars

### Technical

#### New Dependencies
- **react-day-picker** (v9.4.5) - Calendar component
- **date-fns** (v4.1.0) - Date manipulation utilities

#### Performance
- **Code splitting** - Dynamic imports for map components
- **Reduced bundle size** - Tree-shaking optimizations
- **Faster initial load** - Progressive enhancement pattern

#### Error Handling
- **Better error messages** - User-friendly error displays
- **Graceful degradation** - Works without optional APIs
- **Validation** - Input validation for dates and trip parameters

### Fixed
- **Leaflet double-initialization** - Disabled React Strict Mode
- **Map bounds** - Proper fitting for multi-day trips
- **Coordinate parsing** - Handle Nominatim string coordinates
- **CSS conflicts** - Scoped calendar styles to prevent conflicts

### Security
- **API key protection** - Server-side only keys never exposed
- **Input sanitization** - Validate all user inputs
- **Rate limiting** - Respect Nominatim 1req/sec limit
- **Environment variables** - Proper separation of public/private keys

### Cost Optimizations
- **Caching** - 24-hour cache for Google Places data
- **Field selection** - Only request needed Google Places fields
- **Batch operations** - Parallel enrichment of activities
- **Smart prompts** - Optimized OpenAI token usage

### Documentation
- **Updated README.md** - Multi-day features, usage instructions, cost breakdown
- **Updated CLAUDE.md** - New architectural decisions and patterns
- **Updated ARCHITECTURE.md** - System design documentation
- **Updated API.md** - New endpoints and parameters
- **Created CHANGELOG.md** - This file!
- **Updated .env.example** - Cost information and multi-day notes

## [1.0.0] - 2025-01-15

### Added
- Initial release of Travel Itinerary Generator
- AI-powered single-day itinerary generation using OpenAI GPT-4o-mini
- Interactive map with Leaflet and OpenStreetMap
- City autocomplete using Nominatim
- Activity type selection (10 types)
- Radius selection (1-100 miles)
- Budget tracking with traveler count
- Responsive design with Tailwind CSS
- Premium UI with Framer Motion animations
- Custom color palette (teal, coral, amber)
- Glassmorphism effects
- Gradient buttons and cards
