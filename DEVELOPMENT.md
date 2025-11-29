# Development Guide

## Getting Started

### Prerequisites
- Node.js 18.x or higher
- npm or yarn package manager
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))
- Code editor (VS Code recommended)
- Git for version control

### Initial Setup

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
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local`:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

### Development Scripts

```bash
npm run dev      # Start development server with hot reload
npm run build    # Build for production
npm run start    # Start production server locally
npm run lint     # Run ESLint to check code quality
```

## Project Structure

```
travel_itenerary/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   └── generate-itinerary/
│   │       └── route.ts          # Itinerary generation endpoint
│   ├── layout.tsx                # Root layout (includes Leaflet CSS)
│   ├── page.tsx                  # Main page component
│   └── globals.css               # Global styles + Leaflet fixes
├── components/                   # React components
│   ├── ItineraryForm.tsx         # User input form
│   ├── ItineraryDisplay.tsx      # Itinerary results display
│   └── MapView.tsx               # Leaflet map component
├── types/                        # TypeScript definitions
│   └── index.ts                  # All type definitions
├── public/                       # Static assets
├── node_modules/                 # Dependencies
├── .env.local                    # Environment variables (not committed)
├── .env.example                  # Environment template
├── next.config.ts                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # Dependencies and scripts
└── README.md                     # Project documentation
```

## Common Development Tasks

### Adding New Activity Types

**Step 1**: Update the types definition ([types/index.ts](types/index.ts))

```typescript
export type ActivityType =
  | 'Restaurants'
  | 'Museums'
  // ... existing types
  | 'Your New Type';  // Add new type here

export const ACTIVITY_TYPES: ActivityType[] = [
  'Restaurants',
  'Museums',
  // ... existing types
  'Your New Type',  // Add to array
];
```

**Step 2**: Add color mapping in [components/ItineraryDisplay.tsx](components/ItineraryDisplay.tsx)

```typescript
const activityTypeColors: Record<string, string> = {
  'Restaurants': 'bg-orange-100 text-orange-800 border-orange-300',
  // ... existing colors
  'Your New Type': 'bg-purple-100 text-purple-800 border-purple-300',  // Add color
};
```

**Step 3**: Add color mapping in [components/MapView.tsx](components/MapView.tsx)

```typescript
const activityTypeColors: Record<string, string> = {
  'Restaurants': '#f97316',  // hex color
  // ... existing colors
  'Your New Type': '#a855f7',  // Add hex color for marker
};
```

**Step 4**: Test the new activity type
- Restart dev server
- Select new activity type in form
- Generate itinerary
- Verify colors and display

### Modifying the OpenAI Prompt

The AI prompt is in [app/api/generate-itinerary/route.ts](app/api/generate-itinerary/route.ts#L36)

**To adjust travel time assumptions:**
```typescript
const prompt = `You are a travel itinerary planner...

5. **ACCOUNT FOR TRAVEL TIME**:
   - Consider walking time (15-20 min per mile)  // Change these values
   - Consider public transit time (10-15 min between stops)
   - Consider driving time in traffic (varies by city)
   - Leave buffer time between activities for transitions (5-10 minutes)
```

**To change number of activities:**
```typescript
const prompt = `You are a travel itinerary planner...

- Number of activities: 6-8 activities for a full day  // Change range here
```

**To adjust time range:**
```typescript
const prompt = `You are a travel itinerary planner...

- Time range: 9:00 AM to 9:00 PM  // Change start/end times
```

**To modify cost estimation logic:**
```typescript
const prompt = `You are a travel itinerary planner...

8. **COST ESTIMATES**: Provide realistic cost estimates per person in USD
   - Include admission fees, meal costs, or activity costs
   - Use $0 for free activities (parks, walking tours, etc.)
   - Consider typical prices in ${city}  // Add more specific instructions
```

**Important**: After modifying the prompt:
- Test with multiple cities
- Verify JSON structure remains valid
- Check that all required fields are populated

### Customizing Map Styling

**Change map tiles** ([components/MapView.tsx](components/MapView.tsx#L105)):

```typescript
// Current: OpenStreetMap standard
<TileLayer
  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
/>

// Alternative: Dark mode
<TileLayer
  attribution='&copy; OpenStreetMap'
  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
/>

// Alternative: Satellite
<TileLayer
  attribution='Imagery © Mapbox'
  url="https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}.png?access_token=YOUR_TOKEN"
/>
```

**Change marker appearance** ([components/MapView.tsx](components/MapView.tsx#L30)):

```typescript
const createNumberedIcon = (number: number, color: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 32px;           // Change size
        height: 32px;
        border-radius: 50%;    // Make square: change to 0
        background-color: ${color};
        border: 3px solid white;  // Change border width
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);  // Customize shadow
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 14px;       // Change font size
      ">
        ${number}
      </div>
    `,
    iconSize: [32, 32],        // Must match width/height
    iconAnchor: [16, 16],      // Half of iconSize
    popupAnchor: [0, -16],     // Adjust popup position
  });
};
```

**Change default zoom and bounds** ([components/MapView.tsx](components/MapView.tsx#L96)):

```typescript
<MapContainer
  center={center}
  zoom={12}                    // Change default zoom (1-18)
  className="w-full h-full"
  scrollWheelZoom={true}       // Enable/disable scroll zoom
/>

// Auto-fit bounds (FitBounds component)
map.fitBounds(bounds, {
  padding: [50, 50],           // Change padding
  maxZoom: 14                  // Change max zoom level
});
```

### Adding New API Routes

**Step 1**: Create new route file
```bash
mkdir -p app/api/your-endpoint
touch app/api/your-endpoint/route.ts
```

**Step 2**: Implement route handler

```typescript
// app/api/your-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Your logic here
    const data = { message: 'Hello from new endpoint' };
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Process request
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}
```

**Step 3**: Call from client

```typescript
// In your component
const response = await fetch('/api/your-endpoint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ /* your data */ }),
});

const data = await response.json();
```

### Adding New Components

**Step 1**: Create component file
```bash
touch components/YourComponent.tsx
```

**Step 2**: Implement component

```typescript
// components/YourComponent.tsx
'use client';  // Add if component uses hooks or browser APIs

import { useState } from 'react';

interface YourComponentProps {
  title: string;
  onAction: () => void;
}

export default function YourComponent({ title, onAction }: YourComponentProps) {
  const [isActive, setIsActive] = useState(false);

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold">{title}</h2>
      <button
        onClick={() => {
          setIsActive(!isActive);
          onAction();
        }}
        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
      >
        {isActive ? 'Active' : 'Inactive'}
      </button>
    </div>
  );
}
```

**Step 3**: Import and use

```typescript
// app/page.tsx
import YourComponent from '@/components/YourComponent';

export default function Home() {
  return (
    <div>
      <YourComponent
        title="My Component"
        onAction={() => console.log('Action triggered')}
      />
    </div>
  );
}
```

### Working with TypeScript

**Adding new types** ([types/index.ts](types/index.ts)):

```typescript
// Add new interface
export interface NewFeature {
  id: string;
  name: string;
  isEnabled: boolean;
}

// Extend existing interface
export interface ItineraryItemExtended extends ItineraryItem {
  rating?: number;  // Add optional field
  reviews?: string[];
}

// Create type union
export type Status = 'pending' | 'loading' | 'success' | 'error';
```

**Using types in components**:

```typescript
import { NewFeature, Status } from '@/types';

interface MyComponentProps {
  feature: NewFeature;
  status: Status;
}

export default function MyComponent({ feature, status }: MyComponentProps) {
  // TypeScript will provide autocomplete and type checking
  const isActive = feature.isEnabled;

  return (
    <div>
      {status === 'loading' ? 'Loading...' : feature.name}
    </div>
  );
}
```

## Styling with Tailwind CSS

### Common Patterns

**Responsive design**:
```typescript
<div className="
  w-full              // full width on mobile
  md:w-1/2            // half width on tablet
  lg:w-1/3            // third width on desktop
  xl:w-1/4            // quarter width on large desktop
">
```

**Color schemes**:
```typescript
// Primary blue
className="bg-blue-600 hover:bg-blue-700 text-white"

// Success green
className="bg-green-600 hover:bg-green-700 text-white"

// Error red
className="bg-red-600 hover:bg-red-700 text-white"

// Neutral gray
className="bg-gray-200 hover:bg-gray-300 text-gray-900"
```

**Common layouts**:
```typescript
// Flexbox center
className="flex items-center justify-center"

// Grid layout
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"

// Card style
className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
```

### Adding Custom Styles

**In [app/globals.css](app/globals.css)**:

```css
/* Add custom utilities */
@layer utilities {
  .custom-gradient {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
}

/* Add component styles */
@layer components {
  .btn-primary {
    @apply px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors;
  }
}
```

**In [tailwind.config.ts](tailwind.config.ts)**:

```typescript
export default {
  theme: {
    extend: {
      colors: {
        'brand': '#1234ff',  // Add custom color
      },
      spacing: {
        '128': '32rem',      // Add custom spacing
      },
      fontSize: {
        '2xs': '0.625rem',   // Add custom font size
      },
    },
  },
}
```

## Testing

### Manual Testing Checklist

**Form functionality**:
- [ ] City autocomplete works
- [ ] Selecting city populates coordinates
- [ ] Radius selection updates
- [ ] Activity checkboxes toggle
- [ ] Budget input accepts numbers
- [ ] Travelers input accepts 1-20
- [ ] Submit button disabled without city/preferences
- [ ] Submit button shows loading state

**Itinerary generation**:
- [ ] Loading modal displays
- [ ] API call succeeds
- [ ] Activities display in order
- [ ] Travel times show between activities
- [ ] Costs display correctly
- [ ] Budget summary calculates correctly
- [ ] Free activities show "Free" label
- [ ] Activity types have correct colors

**Map functionality**:
- [ ] Map renders without errors
- [ ] Markers appear for all activities
- [ ] Markers are numbered correctly
- [ ] Markers have correct colors
- [ ] Clicking marker shows popup
- [ ] Map auto-fits to show all markers
- [ ] Zoom/pan works correctly

**Regeneration**:
- [ ] Regenerate button clears itinerary
- [ ] Form reappears
- [ ] Can generate new itinerary

**Error handling**:
- [ ] Missing API key shows error
- [ ] Network errors show error message
- [ ] Invalid JSON handled gracefully
- [ ] Error banner displays correctly

### Testing Different Cities

Test with various city types:
- Major cities: New York, Los Angeles, Chicago
- International: London, Paris, Tokyo
- Smaller cities: Portland, Austin, Denver
- Different timezones and languages

### Testing Edge Cases

- **Very small radius** (2 miles): Should find activities
- **Very large radius** (20 miles): Should optimize route
- **All activity types selected**: Should vary activities
- **Single activity type**: Should find 6-8 of that type
- **Zero budget**: Should show warning or adjust
- **Large group** (20 travelers): Costs should multiply

## Troubleshooting

### Common Issues

**Issue**: Map container initialization error
```
Error: Map container is already initialized
```
**Solution**:
- React Strict Mode is disabled in [next.config.ts](next.config.ts)
- MapView uses client-side rendering flag
- This is expected and already fixed

**Issue**: Nominatim 403 or rate limiting
```
Error fetching city suggestions
```
**Solution**:
- Add User-Agent header (already implemented)
- Increase debounce time (currently 300ms)
- Use VPN if IP is blocked temporarily

**Issue**: OpenAI API errors
```
Error: 401 Unauthorized
```
**Solution**:
- Check API key in `.env.local`
- Verify key is active on OpenAI dashboard
- Check account has credits

**Issue**: TypeScript errors
```
Property 'X' does not exist on type 'Y'
```
**Solution**:
- Check type definitions in [types/index.ts](types/index.ts)
- Add missing properties to interface
- Use optional chaining (`?.`) for optional fields

**Issue**: Build errors
```
Error: Module not found
```
**Solution**:
- Run `npm install` to ensure all dependencies installed
- Check import paths use `@/` alias
- Verify file exists at import path

**Issue**: Styles not applying
```
Tailwind classes not working
```
**Solution**:
- Restart dev server (`npm run dev`)
- Check class names are valid Tailwind utilities
- Verify `globals.css` imports Tailwind directives

### Debugging Tools

**React Developer Tools**:
- Install browser extension
- Inspect component hierarchy
- View props and state
- Profile performance

**Network Tab**:
- Monitor API calls
- Check request/response bodies
- Verify status codes
- View timing information

**Console Logging**:
```typescript
// In components
console.log('State:', { itinerary, isLoading, error });

// In API routes
console.log('Request body:', body);
console.log('OpenAI response:', responseText);
```

**TypeScript Compiler**:
```bash
# Check types without running
npx tsc --noEmit
```

## Code Style Guide

### Naming Conventions

**Files**:
- Components: `PascalCase.tsx` (e.g., `ItineraryForm.tsx`)
- Routes: `route.ts` (lowercase)
- Types: `index.ts` (lowercase)
- Configs: `kebab-case.ts` (e.g., `tailwind.config.ts`)

**Variables and Functions**:
```typescript
// camelCase for variables and functions
const cityName = 'New York';
const handleSubmit = () => {};

// PascalCase for components and types
interface ItineraryItem {}
function MyComponent() {}

// UPPER_CASE for constants
const API_BASE_URL = 'https://api.example.com';
const MAX_ACTIVITIES = 10;
```

### Component Structure

```typescript
'use client';  // If needed

// 1. Imports
import { useState } from 'react';
import { SomeType } from '@/types';

// 2. Interface definitions
interface ComponentProps {
  title: string;
  onAction: () => void;
}

// 3. Constants (outside component)
const DEFAULT_VALUE = 'default';

// 4. Component definition
export default function Component({ title, onAction }: ComponentProps) {
  // 4a. State hooks
  const [isActive, setIsActive] = useState(false);

  // 4b. Effects
  useEffect(() => {
    // Effect logic
  }, []);

  // 4c. Event handlers
  const handleClick = () => {
    setIsActive(!isActive);
    onAction();
  };

  // 4d. Render logic
  if (!isActive) {
    return null;
  }

  // 4e. JSX return
  return (
    <div className="...">
      <h2>{title}</h2>
      <button onClick={handleClick}>Click me</button>
    </div>
  );
}
```

### Import Organization

```typescript
// 1. External libraries
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// 2. Internal types
import { Itinerary, ItineraryItem } from '@/types';

// 3. Internal components
import MapView from '@/components/MapView';
import ItineraryForm from '@/components/ItineraryForm';

// 4. Styles (if needed)
import styles from './Component.module.css';
```

### Comments

**Good comments** (explain why):
```typescript
// Disable strict mode to prevent Leaflet double initialization
reactStrictMode: false,

// Debounce to reduce API calls to Nominatim
const debounce = setTimeout(fetchCitySuggestions, 300);

// Calculate per-person budget for AI prompt
const budgetPerPerson = budget && travelers ? budget / travelers : 0;
```

**Bad comments** (state the obvious):
```typescript
// Set loading to true
setIsLoading(true);

// Increment counter
counter++;
```

## Git Workflow

### Branch Strategy

```bash
# Create feature branch
git checkout -b feature/add-new-activity-type

# Make changes and commit
git add .
git commit -m "Add hiking activity type with green markers"

# Push to remote
git push origin feature/add-new-activity-type

# Create pull request on GitHub
```

### Commit Messages

**Format**: `type: description`

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples**:
```bash
git commit -m "feat: add budget tracking feature"
git commit -m "fix: resolve map initialization error"
git commit -m "docs: update API documentation"
git commit -m "style: format code with prettier"
git commit -m "refactor: extract map logic to custom hook"
```

## Performance Optimization

### Bundle Size

**Check bundle size**:
```bash
npm run build
# Look for .next/static/chunks
```

**Reduce bundle size**:
- Use dynamic imports for heavy components
- Remove unused dependencies
- Enable tree shaking (automatic in Next.js)

### Lighthouse Scores

**Run Lighthouse**:
1. Open Chrome DevTools
2. Go to Lighthouse tab
3. Run audit
4. Review scores and suggestions

**Target scores**:
- Performance: 90+
- Accessibility: 95+
- Best Practices: 90+
- SEO: 95+

## Deployment

### Deploying to Vercel

**First-time setup**:
1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select GitHub repository
5. Add environment variable: `OPENAI_API_KEY`
6. Click "Deploy"

**Subsequent deployments**:
- Push to `main` branch
- Vercel automatically builds and deploys
- View deployment logs in Vercel dashboard

### Environment Variables

**Production** (Vercel Dashboard):
```
OPENAI_API_KEY=sk-your-production-key-here
```

**Preview** (optional, for testing):
```
OPENAI_API_KEY=sk-your-preview-key-here
```

### Deployment Checklist

- [ ] Environment variables configured
- [ ] Build succeeds locally (`npm run build`)
- [ ] All TypeScript errors resolved
- [ ] ESLint warnings addressed
- [ ] Tested in production mode (`npm run start`)
- [ ] README updated with live URL
- [ ] API costs monitored (OpenAI dashboard)

## Resources

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Leaflet Docs](https://leafletjs.com/reference.html)
- [OpenAI API Docs](https://platform.openai.com/docs)

### Community
- [Next.js GitHub Discussions](https://github.com/vercel/next.js/discussions)
- [Tailwind CSS Discord](https://tailwindcss.com/discord)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/next.js)

### Tools
- [VS Code](https://code.visualstudio.com/)
- [Postman](https://www.postman.com/) - API testing
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Excalidraw](https://excalidraw.com/) - Diagrams

## Support

If you encounter issues:
1. Check this documentation
2. Review [ARCHITECTURE.md](ARCHITECTURE.md)
3. Check existing [GitHub Issues](https://github.com/your-repo/issues)
4. Create new issue with:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details (OS, Node version, browser)
