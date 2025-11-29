'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Itinerary, ItineraryItem } from '@/types';

interface MapViewProps {
  itinerary: Itinerary;
}

// Updated color scheme for Wanderlust Theme
const activityTypeColors: Record<string, string> = {
  'Restaurants': '#f97316',  // coral
  'Museums': '#a855f7',      // purple
  'Parks & Outdoors': '#22c55e',  // green
  'Nightlife & Bars': '#ec4899',  // pink
  'Shopping': '#06b6d4',     // primary teal
  'Historical Sites': '#f59e0b',  // amber
  'Entertainment': '#ef4444',  // red
  'Coffee Shops': '#eab308',  // yellow
  'Art Galleries': '#6366f1',  // indigo
  'Sports & Recreation': '#14b8a6',  // teal
};

const getMarkerColor = (type: string): string => {
  return activityTypeColors[type] || '#6b7280';
};

// Enhanced numbered marker with gradient and shadow
const createNumberedIcon = (number: number, color: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        position: relative;
      ">
        <div style="
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%);
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2), 0 0 0 4px ${color}22;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 800;
          font-size: 16px;
          font-family: 'Manrope', 'Inter', system-ui, sans-serif;
          transition: all 0.3s ease;
        ">
          ${number}
        </div>
        <div style="
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 8px solid ${color};
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
        "></div>
      </div>
    `,
    iconSize: [40, 48],
    iconAnchor: [20, 48],
    popupAnchor: [0, -48],
  });
};

function FitBounds({ items }: { items: ItineraryItem[] }) {
  const map = useMap();

  useEffect(() => {
    if (items.length > 0) {
      const bounds = L.latLngBounds(
        items.map((item) => [item.coordinates.lat, item.coordinates.lng])
      );
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
    }
  }, [items, map]);

  return null;
}

export default function MapView({ itinerary }: MapViewProps) {
  const [isClient, setIsClient] = useState(false);

  const center: [number, number] = [
    itinerary.itinerary[0]?.coordinates.lat || 0,
    itinerary.itinerary[0]?.coordinates.lng || 0,
  ];

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="w-full h-[600px] rounded-3xl overflow-hidden shadow-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse-soft mb-3">
            <svg className="w-12 h-12 text-primary-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[600px] rounded-3xl overflow-hidden shadow-2xl border-2 border-white/50 backdrop-blur">
      <MapContainer
        center={center}
        zoom={12}
        className="w-full h-full"
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {itinerary.itinerary.map((item: ItineraryItem, index: number) => (
          <Marker
            key={index}
            position={[item.coordinates.lat, item.coordinates.lng]}
            icon={createNumberedIcon(index + 1, getMarkerColor(item.type))}
          >
            <Popup className="custom-popup">
              <div style={{
                padding: '12px',
                minWidth: '200px',
                fontFamily: "'Inter', system-ui, sans-serif",
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px',
                }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '8px',
                    background: `linear-gradient(135deg, ${getMarkerColor(item.type)} 0%, ${getMarkerColor(item.type)}dd 100%)`,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '800',
                    fontSize: '12px',
                    flexShrink: 0,
                  }}>
                    {index + 1}
                  </div>
                  <h3 style={{
                    fontWeight: '700',
                    fontSize: '16px',
                    color: '#1f2937',
                    margin: 0,
                    lineHeight: '1.4',
                  }}>
                    {item.name}
                  </h3>
                </div>

                <div style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: '700',
                  marginBottom: '8px',
                  backgroundColor: `${getMarkerColor(item.type)}22`,
                  color: getMarkerColor(item.type),
                  border: `1.5px solid ${getMarkerColor(item.type)}44`,
                }}>
                  {item.type}
                </div>

                <p style={{
                  fontSize: '13px',
                  color: '#6b7280',
                  margin: '6px 0',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}>
                  <svg style={{ width: '14px', height: '14px', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {item.time}
                </p>

                {item.estimatedCost !== undefined && (
                  <p style={{
                    fontSize: '13px',
                    fontWeight: '700',
                    color: item.estimatedCost === 0 ? '#22c55e' : '#1f2937',
                    margin: '6px 0 0 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}>
                    <svg style={{ width: '14px', height: '14px', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {item.estimatedCost === 0 ? 'Free' : `$${item.estimatedCost.toFixed(2)}/person`}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        <FitBounds items={itinerary.itinerary} />
      </MapContainer>
    </div>
  );
}
