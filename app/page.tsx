'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import ItineraryForm from '@/components/ItineraryForm';
import ItineraryDisplay from '@/components/ItineraryDisplay';
import { GenerateItineraryRequest, Itinerary } from '@/types';

// Dynamically import MapView to avoid SSR issues with Leaflet
const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] rounded-lg bg-gray-100 flex items-center justify-center">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
});

export default function Home() {
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestData, setRequestData] = useState<GenerateItineraryRequest | null>(null);

  const handleGenerateItinerary = async (data: GenerateItineraryRequest) => {
    setIsLoading(true);
    setError(null);
    setRequestData(data);

    try {
      const response = await fetch('/api/generate-itinerary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to generate itinerary');
      }

      const result: Itinerary = await response.json();

      // Calculate total cost and budget remaining
      const totalCostPerPerson = result.itinerary.reduce(
        (sum, item) => sum + (item.estimatedCost || 0),
        0
      );

      if (data.budget && data.travelers) {
        result.totalCost = totalCostPerPerson * data.travelers;
        result.budgetRemaining = data.budget - result.totalCost;
      }

      setItinerary(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error generating itinerary:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = () => {
    setItinerary(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Travel Itinerary Generator
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover your perfect day trip with AI-powered personalized itineraries
          </p>
        </header>

        {error && (
          <div className="max-w-2xl mx-auto mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {!itinerary ? (
          <ItineraryForm onSubmit={handleGenerateItinerary} isLoading={isLoading} />
        ) : (
          <div className="space-y-8">
            <ItineraryDisplay itinerary={itinerary} onRegenerate={handleRegenerate} />
            <MapView
              key={`${itinerary.city}-${itinerary.itinerary.length}`}
              itinerary={itinerary}
            />
          </div>
        )}

        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Generating Your Itinerary
                </h3>
                <p className="text-gray-600 text-center">
                  Our AI is crafting the perfect day for you...
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="mt-16 py-8 border-t border-gray-200">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>Powered by OpenAI and OpenStreetMap</p>
        </div>
      </footer>
    </div>
  );
}
