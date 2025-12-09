'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { decodeItinerary } from '@/lib/share';
import { MultiDayItinerary } from '@/types';
import Link from 'next/link';
import { format } from 'date-fns';
import { Compass, MapPin, Clock, DollarSign } from 'lucide-react';
import dynamic from 'next/dynamic';

const MultiDayMapView = dynamic(() => import('@/components/MultiDayMapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] rounded-3xl bg-gray-100 flex items-center justify-center">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
});

function SharedItineraryContent() {
  const searchParams = useSearchParams();
  const [itinerary, setItinerary] = useState<MultiDayItinerary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data = searchParams.get('data');

    if (!data) {
      setError('No itinerary data found in URL');
      setLoading(false);
      return;
    }

    try {
      const decoded = decodeItinerary(data);
      setItinerary(decoded);
    } catch (err) {
      console.error('Decode error:', err);
      setError('Invalid or corrupted share link. The itinerary could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-coral-50">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary-600
                          border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading shared itinerary...</p>
        </div>
      </div>
    );
  }

  if (error || !itinerary) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-coral-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="text-red-500 mb-4">
            <svg className="h-16 w-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h1>
          <p className="text-gray-600 mb-6">{error || 'Something went wrong'}</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg
                       hover:bg-primary-700 transition-colors font-semibold"
          >
            Create Your Own Itinerary
          </Link>
        </div>
      </div>
    );
  }

  const startDate = new Date(itinerary.dateRange.startDate);
  const endDate = new Date(itinerary.dateRange.endDate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-coral-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-coral-500 rounded-xl flex items-center justify-center">
                <Compass className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text">
                  {itinerary.city} Adventure
                </h1>
                <p className="text-sm text-gray-600">
                  {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
                  {' • '}
                  {itinerary.days.length} {itinerary.days.length === 1 ? 'day' : 'days'}
                </p>
              </div>
            </div>
            <Link
              href="/"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg
                         hover:bg-primary-700 transition-colors font-semibold text-sm"
            >
              Create Your Own
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Activities</p>
                <p className="text-xl font-bold text-gray-900">{itinerary.totalActivities}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-coral-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-coral-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Trip Duration</p>
                <p className="text-xl font-bold text-gray-900">
                  {itinerary.days.length} {itinerary.days.length === 1 ? 'Day' : 'Days'}
                </p>
              </div>
            </div>
          </div>

          {itinerary.totalCost !== undefined && (
            <div className="bg-white rounded-xl p-4 shadow-soft">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Cost</p>
                  <p className="text-xl font-bold text-gray-900">${itinerary.totalCost.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Map */}
        <div className="bg-white rounded-3xl shadow-soft p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Route Overview</h2>
          <MultiDayMapView days={itinerary.days} />
        </div>

        {/* Day-by-Day Itinerary */}
        <div className="space-y-6">
          {itinerary.days.map((day, dayIndex) => (
            <div key={dayIndex} className="bg-white rounded-3xl shadow-soft p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Day {day.dayNumber}
                  </h2>
                  <span className="text-sm text-gray-500">
                    {format(new Date(day.date), 'EEEE, MMMM d')}
                  </span>
                </div>
                {day.summary && (
                  <p className="text-gray-600">{day.summary}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  {day.activities.length} activities
                </p>
              </div>

              {/* Activities */}
              <div className="space-y-4">
                {day.activities.map((activity, actIndex) => (
                  <div
                    key={actIndex}
                    className="border-l-4 border-primary-400 pl-4 py-2"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-lg mb-1">
                          {activity.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <Clock className="w-4 h-4" />
                          <span>{activity.time}</span>
                          <span className="mx-2">•</span>
                          <span>{activity.duration}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <MapPin className="w-4 h-4" />
                          <span>{activity.address}</span>
                        </div>
                        <p className="text-gray-700 mb-2">{activity.description}</p>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded font-medium">
                            {activity.type}
                          </span>
                          {activity.estimatedCost !== undefined && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-medium">
                              ${activity.estimatedCost} per person
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer CTA */}
      <div className="bg-gradient-to-r from-primary-600 to-coral-500 py-12 mt-12">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold text-white mb-4">
            Plan Your Perfect Trip
          </h2>
          <p className="text-white/90 mb-6 text-lg">
            Create your own AI-powered itinerary in minutes
          </p>
          <Link
            href="/"
            className="inline-block px-8 py-3 bg-white text-primary-600 rounded-lg
                       hover:bg-gray-100 transition-colors font-bold text-lg shadow-lg"
          >
            Get Started Free
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SharedItinerary() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-coral-50">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary-600
                          border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    }>
      <SharedItineraryContent />
    </Suspense>
  );
}
