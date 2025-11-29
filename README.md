# Travel Itinerary Generator

A full-stack web application that generates personalized travel itineraries using AI. Built with Next.js, TypeScript, Tailwind CSS, and powered by OpenAI's GPT models.

![Travel Itinerary Generator](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat&logo=tailwindcss)

## Features

- **AI-Powered Itinerary Generation**: Generate customized day itineraries using OpenAI's GPT models
- **Smart Travel Time Calculation**: Accounts for realistic travel time between locations with route optimization
- **Budget Tracking & Cost Estimates**: Set your budget, specify travelers, and get per-activity cost estimates with budget tracking
- **City Autocomplete**: Search for cities with autocomplete powered by OpenStreetMap Nominatim
- **Interactive Map**: View all itinerary locations on an interactive Leaflet map with numbered markers
- **Customizable Preferences**: Select from 10+ activity types including restaurants, museums, parks, and more
- **Radius Selection**: Choose search radius from 2 to 20 miles
- **Responsive Design**: Beautiful, mobile-friendly interface built with Tailwind CSS
- **Real-time Loading States**: Visual feedback during itinerary generation
- **Error Handling**: Comprehensive error handling for API failures

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Map**: Leaflet & React Leaflet
- **Geocoding**: OpenStreetMap Nominatim API
- **AI**: OpenAI API (GPT-4o-mini)
- **Deployment**: Vercel-ready

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

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

   Edit `.env.local` and add your OpenAI API key:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

1. **Enter a City**: Start typing a city name and select from the autocomplete suggestions
2. **Select Radius**: Choose how far from the city center you want to explore (2-20 miles)
3. **Choose Activity Preferences**: Select one or more activity types you're interested in
4. **Generate Itinerary**: Click the "Generate Itinerary" button
5. **View Results**: See your personalized itinerary with timeline and interactive map
6. **Regenerate**: Click "Regenerate" to create a new itinerary with the same parameters

## Project Structure

```
travel_itenerary/
├── app/
│   ├── api/
│   │   └── generate-itinerary/
│   │       └── route.ts          # API route for itinerary generation
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Main page component
│   └── globals.css               # Global styles
├── components/
│   ├── ItineraryForm.tsx         # Form component with city autocomplete
│   ├── ItineraryDisplay.tsx      # Itinerary display component
│   └── MapView.tsx               # Interactive map component
├── types/
│   └── index.ts                  # TypeScript type definitions
├── .env.example                  # Environment variables template
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
| `OPENAI_API_KEY` | Your OpenAI API key | Yes |

Note: No Mapbox token is required as this app uses OpenStreetMap's free Nominatim API for geocoding and Leaflet for mapping.

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
Displays the generated itinerary in a timeline format with color-coded activity types.

#### MapView
Renders an interactive Leaflet map with numbered markers for each location.

## Future Enhancements

- [ ] Save/export itinerary feature
- [ ] Share itinerary via link
- [ ] Multiple day itineraries
- [ ] Budget considerations
- [ ] Weather integration
- [ ] User accounts to save itineraries
- [ ] PDF export
- [ ] Custom activity durations
- [ ] Route optimization

## Technologies Used

- [Next.js](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Leaflet](https://leafletjs.com/) - Interactive maps
- [React Leaflet](https://react-leaflet.js.org/) - React wrapper for Leaflet
- [OpenAI](https://openai.com/) - AI itinerary generation
- [OpenStreetMap](https://www.openstreetmap.org/) - Free geocoding and maps

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you encounter any issues, please open an issue on GitHub.
