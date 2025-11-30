'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { DayItinerary, ItineraryItem } from '@/types';
import { format } from 'date-fns';

interface MultiDayMapViewProps {
  days: DayItinerary[];
}

// Color scheme for different days
const dayColors = [
  '#3B82F6', // Blue - Day 1
  '#10B981', // Green - Day 2
  '#F59E0B', // Amber - Day 3
  '#EF4444', // Red - Day 4
  '#8B5CF6', // Purple - Day 5
  '#EC4899', // Pink - Day 6
  '#14B8A6', // Teal - Day 7
  '#F97316', // Orange - Day 8
  '#6366F1', // Indigo - Day 9
  '#22C55E', // Lime - Day 10
  '#A855F7', // Violet - Day 11
  '#06B6D4', // Cyan - Day 12
  '#EAB308', // Yellow - Day 13
  '#DC2626', // Rose - Day 14
];

const getDayColor = (dayIndex: number): string => {
  return dayColors[dayIndex % dayColors.length];
};

// Enhanced numbered marker with day color
const createNumberedIcon = (number: number, color: string, isSmall: boolean = false) => {
  const size = isSmall ? 32 : 40;
  const fontSize = isSmall ? 14 : 16;

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        position: relative;
      ">
        <div style="
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%);
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2), 0 0 0 4px ${color}22;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 800;
          font-size: ${fontSize}px;
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
    iconSize: [size, size + 8],
    iconAnchor: [size / 2, size + 8],
    popupAnchor: [0, -(size + 8)],
  });
};

function FitBounds({ days }: { days: DayItinerary[] }) {
  const map = useMap();

  useEffect(() => {
    const allActivities = days.flatMap(day => day.activities);
    if (allActivities.length > 0) {
      const bounds = L.latLngBounds(
        allActivities.map((item) => [item.coordinates.lat, item.coordinates.lng])
      );
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
    }
  }, [days, map]);

  return null;
}

export default function MultiDayMapView({ days }: MultiDayMapViewProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!days || days.length === 0) {
    return null;
  }

  const firstActivity = days[0]?.activities[0];
  const center: [number, number] = firstActivity
    ? [firstActivity.coordinates.lat, firstActivity.coordinates.lng]
    : [0, 0];

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
    <div className="w-full">
      {/* Day Legend */}
      <div className="mb-4 p-4 bg-white rounded-2xl shadow-lg border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Trip Days</h3>
        <div className="flex flex-wrap gap-3">
          {days.map((day, dayIndex) => (
            <div key={dayIndex} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full border-2 border-white shadow-md"
                style={{ backgroundColor: getDayColor(dayIndex) }}
              />
              <span className="text-sm font-medium text-gray-700">
                Day {day.dayNumber}
              </span>
              <span className="text-xs text-gray-500">
                ({day.activities.length} stops)
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Map */}
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

          {/* Render each day's activities */}
          {days.map((day, dayIndex) => {
            const dayColor = getDayColor(dayIndex);

            return (
              <div key={dayIndex}>
                {/* Markers for each activity */}
                {day.activities.map((activity: ItineraryItem, actIndex: number) => (
                  <Marker
                    key={`${dayIndex}-${actIndex}`}
                    position={[activity.coordinates.lat, activity.coordinates.lng]}
                    icon={createNumberedIcon(actIndex + 1, dayColor, days.length > 3)}
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
                          justifyContent: 'space-between',
                          marginBottom: '8px',
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}>
                            <div style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '8px',
                              background: `linear-gradient(135deg, ${dayColor} 0%, ${dayColor}dd 100%)`,
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: '800',
                              fontSize: '12px',
                              flexShrink: 0,
                            }}>
                              {actIndex + 1}
                            </div>
                            <div style={{
                              fontSize: '11px',
                              fontWeight: '700',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              backgroundColor: `${dayColor}22`,
                              color: dayColor,
                              border: `1.5px solid ${dayColor}44`,
                            }}>
                              Day {day.dayNumber}
                            </div>
                          </div>
                        </div>

                        <h3 style={{
                          fontWeight: '700',
                          fontSize: '16px',
                          color: '#1f2937',
                          margin: '0 0 8px 0',
                          lineHeight: '1.4',
                        }}>
                          {activity.name}
                        </h3>

                        <div style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: '700',
                          marginBottom: '8px',
                          backgroundColor: '#f3f4f6',
                          color: '#6b7280',
                        }}>
                          {activity.type}
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
                          {activity.time}
                        </p>

                        <p style={{
                          fontSize: '12px',
                          color: '#9ca3af',
                          margin: '4px 0 0 0',
                        }}>
                          {format(new Date(day.date), 'EEE, MMM d')}
                        </p>

                        {activity.estimatedCost !== undefined && (
                          <p style={{
                            fontSize: '13px',
                            fontWeight: '700',
                            color: activity.estimatedCost === 0 ? '#22c55e' : '#1f2937',
                            margin: '6px 0 0 0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}>
                            <svg style={{ width: '14px', height: '14px', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {activity.estimatedCost === 0 ? 'Free' : `$${activity.estimatedCost.toFixed(2)}/person`}
                          </p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {/* Draw line connecting activities on same day */}
                {day.activities.length > 1 && (
                  <Polyline
                    positions={day.activities.map(a => [a.coordinates.lat, a.coordinates.lng])}
                    color={dayColor}
                    weight={3}
                    opacity={0.6}
                    dashArray="10, 10"
                  />
                )}
              </div>
            );
          })}

          <FitBounds days={days} />
        </MapContainer>
      </div>
    </div>
  );
}
