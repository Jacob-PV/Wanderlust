/**
 * MapView Component
 *
 * Interactive Leaflet map displaying all itinerary locations with numbered, color-coded markers.
 *
 * Features:
 * - Displays all activities on an OpenStreetMap-based interactive map
 * - Numbered markers (1, 2, 3...) matching itinerary order
 * - Color-coded markers by activity type
 * - Clickable markers with popups (name, type, time)
 * - Auto-fit bounds to show all markers
 * - Client-side only rendering (prevents SSR issues with Leaflet)
 *
 * Technical Details:
 * - Uses Leaflet library for map rendering
 * - Custom DivIcon markers for numbered circles
 * - OpenStreetMap tiles (free, no API key required)
 * - Client-side rendering flag prevents hydration errors
 *
 * @param props - Component props
 * @param props.itinerary - Complete itinerary with city and activities
 *
 * @example
 * <MapView itinerary={generatedItinerary} />
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Itinerary, ItineraryItem } from '@/types';

interface MapViewProps {
  /** Complete itinerary object containing city and all activities */
  itinerary: Itinerary;
}

/**
 * Color mapping for activity types (hex colors for markers)
 *
 * Each activity type has a distinct color for easy visual differentiation on the map.
 * These colors match the Tailwind colors used in ItineraryDisplay badges.
 *
 * Colors:
 * - Restaurants: Orange (#f97316)
 * - Museums: Purple (#a855f7)
 * - Parks & Outdoors: Green (#22c55e)
 * - Nightlife & Bars: Pink (#ec4899)
 * - Shopping: Blue (#3b82f6)
 * - Historical Sites: Amber (#f59e0b)
 * - Entertainment: Red (#ef4444)
 * - Coffee Shops: Yellow (#eab308)
 * - Art Galleries: Indigo (#6366f1)
 * - Sports & Recreation: Teal (#14b8a6)
 */
const activityTypeColors: Record<string, string> = {
  'Restaurants': '#f97316',
  'Museums': '#a855f7',
  'Parks & Outdoors': '#22c55e',
  'Nightlife & Bars': '#ec4899',
  'Shopping': '#3b82f6',
  'Historical Sites': '#f59e0b',
  'Entertainment': '#ef4444',
  'Coffee Shops': '#eab308',
  'Art Galleries': '#6366f1',
  'Sports & Recreation': '#14b8a6',
};

/**
 * Get marker color for a given activity type
 *
 * @param type - Activity type string
 * @returns Hex color code for the marker
 */
const getMarkerColor = (type: string): string => {
  return activityTypeColors[type] || '#6b7280';  // Default to gray if type not found
};

/**
 * Create a custom numbered marker icon
 *
 * Generates a Leaflet DivIcon with a colored circle and number inside.
 * The marker appearance is created using inline HTML/CSS.
 *
 * @param number - Marker number (1, 2, 3, etc.)
 * @param color - Background color (hex code)
 * @returns Leaflet DivIcon for use in Marker component
 */
const createNumberedIcon = (number: number, color: string) => {
  return L.divIcon({
    className: 'custom-marker',  // CSS class for the marker (defined in globals.css)
    html: `
      <div style="
        width: 32px;
        height: 32px;
        border-radius: 50%;                        /* Circular marker */
        background-color: ${color};                /* Activity type color */
        border: 3px solid white;                   /* White border for contrast */
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);    /* Drop shadow for depth */
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;                              /* White number text */
        font-weight: bold;
        font-size: 14px;
      ">
        ${number}
      </div>
    `,
    iconSize: [32, 32],      // Size of the icon (width, height)
    iconAnchor: [16, 16],    // Point of the icon which will correspond to marker's location (center)
    popupAnchor: [0, -16],   // Point from which the popup should open relative to iconAnchor
  });
};

/**
 * FitBounds Component
 *
 * Automatically adjusts map zoom and center to fit all markers within view.
 * This ensures users can see all activities without manual panning/zooming.
 *
 * Uses Leaflet's fitBounds() method with padding for visual margin.
 *
 * @param props - Component props
 * @param props.items - Array of itinerary items with coordinates
 */
function FitBounds({ items }: { items: ItineraryItem[] }) {
  const map = useMap();  // Get Leaflet map instance from React Leaflet context

  useEffect(() => {
    if (items.length > 0) {
      // Create bounding box from all item coordinates
      const bounds = L.latLngBounds(
        items.map((item) => [item.coordinates.lat, item.coordinates.lng])
      );

      // Fit map to bounds with options:
      // - padding: [50, 50] adds 50px margin on all sides
      // - maxZoom: 14 prevents over-zooming on close activities
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [items, map]);

  return null;  // This component doesn't render anything visible
}

/**
 * MapView Component Implementation
 */
export default function MapView({ itinerary }: MapViewProps) {
  /**
   * Client-side rendering flag
   *
   * Leaflet requires browser DOM APIs (window, document) that don't exist during
   * server-side rendering. This flag ensures the map only renders on the client.
   *
   * Without this, Next.js would throw hydration errors during SSR.
   */
  const [isClient, setIsClient] = useState(false);

  // Calculate map center from first activity's coordinates
  // Falls back to [0, 0] if no activities (shouldn't happen in practice)
  const center: [number, number] = [
    itinerary.itinerary[0]?.coordinates.lat || 0,
    itinerary.itinerary[0]?.coordinates.lng || 0,
  ];

  // Set client flag after component mounts (client-side only)
  // This prevents the map from rendering during SSR
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Show loading placeholder until client-side rendering is ready
  if (!isClient) {
    return (
      <div className="w-full h-[500px] rounded-lg overflow-hidden shadow-lg border border-gray-200 bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[500px] rounded-lg overflow-hidden shadow-lg border border-gray-200">
      <MapContainer
        center={center}           // Initial map center
        zoom={12}                  // Initial zoom level (1-18, higher = more zoomed in)
        className="w-full h-full"
        scrollWheelZoom={true}     // Enable scroll wheel zoom
        whenReady={() => {
          // Map initialization callback (empty for now)
          // Could be used for analytics or custom initialization
        }}
      >
        {/* OpenStreetMap tile layer - provides the map imagery */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          // {s} = subdomain (a, b, or c) for load balancing
          // {z} = zoom level
          // {x}, {y} = tile coordinates
        />

        {/* Render a marker for each activity in the itinerary */}
        {itinerary.itinerary.map((item: ItineraryItem, index: number) => (
          <Marker
            key={index}
            position={[item.coordinates.lat, item.coordinates.lng]}
            icon={createNumberedIcon(index + 1, getMarkerColor(item.type))}
          >
            {/* Popup appears when marker is clicked */}
            <Popup>
              <div style={{ padding: '8px' }}>
                <h3 style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '14px' }}>
                  {item.name}
                </h3>
                <p style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                  {item.type}
                </p>
                <p style={{ fontSize: '12px', color: '#666' }}>{item.time}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Auto-fit bounds component - adjusts zoom to show all markers */}
        <FitBounds items={itinerary.itinerary} />
      </MapContainer>
    </div>
  );
}
