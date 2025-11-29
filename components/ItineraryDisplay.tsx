'use client';

import { Itinerary, ItineraryItem } from '@/types';

interface ItineraryDisplayProps {
  itinerary: Itinerary;
  onRegenerate: () => void;
}

const activityTypeColors: Record<string, string> = {
  'Restaurants': 'bg-orange-100 text-orange-800 border-orange-300',
  'Museums': 'bg-purple-100 text-purple-800 border-purple-300',
  'Parks & Outdoors': 'bg-green-100 text-green-800 border-green-300',
  'Nightlife & Bars': 'bg-pink-100 text-pink-800 border-pink-300',
  'Shopping': 'bg-blue-100 text-blue-800 border-blue-300',
  'Historical Sites': 'bg-amber-100 text-amber-800 border-amber-300',
  'Entertainment': 'bg-red-100 text-red-800 border-red-300',
  'Coffee Shops': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'Art Galleries': 'bg-indigo-100 text-indigo-800 border-indigo-300',
  'Sports & Recreation': 'bg-teal-100 text-teal-800 border-teal-300',
};

const getActivityColor = (type: string): string => {
  return activityTypeColors[type] || 'bg-gray-100 text-gray-800 border-gray-300';
};

export default function ItineraryDisplay({ itinerary, onRegenerate }: ItineraryDisplayProps) {
  // Calculate total costs
  const totalCostPerPerson = itinerary.itinerary.reduce(
    (sum, item) => sum + (item.estimatedCost || 0),
    0
  );

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-900">
          Your Itinerary for {itinerary.city}
        </h2>
        <button
          onClick={onRegenerate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Regenerate
        </button>
      </div>

      {/* Budget Summary Card */}
      {totalCostPerPerson > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Cost Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Per Person</p>
              <p className="text-2xl font-bold text-green-600">
                ${totalCostPerPerson.toFixed(2)}
              </p>
            </div>
            {itinerary.totalCost && (
              <div>
                <p className="text-sm text-gray-600">Total Cost</p>
                <p className="text-2xl font-bold text-blue-600">
                  ${itinerary.totalCost.toFixed(2)}
                </p>
              </div>
            )}
            {itinerary.budgetRemaining !== undefined && (
              <div>
                <p className="text-sm text-gray-600">Budget Remaining</p>
                <p
                  className={`text-2xl font-bold ${
                    itinerary.budgetRemaining >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  ${Math.abs(itinerary.budgetRemaining).toFixed(2)}
                  {itinerary.budgetRemaining < 0 && ' over'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {itinerary.itinerary.map((item: ItineraryItem, index: number) => (
          <div key={index}>
            {/* Travel time indicator between activities */}
            {index > 0 && item.travelTime && (
              <div className="flex items-center justify-center py-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-sm text-blue-700">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                  <span className="font-medium">{item.travelTime}</span>
                </div>
              </div>
            )}

            {/* Activity card */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full font-bold text-sm">
                      {index + 1}
                    </span>
                    <h3 className="text-xl font-semibold text-gray-900">{item.name}</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-1">{item.address}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${getActivityColor(
                    item.type
                  )}`}
                >
                  {item.type}
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-700 mb-3">
                <div className="flex items-center gap-1">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="font-medium">{item.time}</span>
                </div>
                <div className="text-gray-400">•</div>
                <div>{item.duration}</div>
                {item.estimatedCost !== undefined && (
                  <>
                    <div className="text-gray-400">•</div>
                    <div className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className={`font-medium ${item.estimatedCost === 0 ? 'text-green-600' : ''}`}>
                        {item.estimatedCost === 0 ? 'Free' : `$${item.estimatedCost.toFixed(2)}/person`}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <p className="text-gray-700 leading-relaxed">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
