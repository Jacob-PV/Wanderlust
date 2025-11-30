'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  DollarSign,
  Globe,
  Phone,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { DayItinerary, ItineraryItem, GooglePlaceData, EnrichPlaceRequest } from '@/types';
import RatingDisplay from './RatingDisplay';
import ReviewCard from './ReviewCard';
import ReplaceActivity from './ReplaceActivity';

interface DayNavigationProps {
  days: DayItinerary[];
  city: string;
  onReplaceActivity?: (dayIndex: number, activityIndex: number, newActivity: ItineraryItem, changesSummary: string) => void;
  preferences?: {
    city: string;
    radius: number;
    activities: string[];
    budget?: number;
    travelers?: number;
  };
}

/**
 * Helper to get price level display
 */
const getPriceLevel = (level?: number): string => {
  if (level === undefined) return '';
  const symbols = ['Free', '$', '$$', '$$$', '$$$$'];
  return symbols[level] || '';
};

/**
 * Get activity color for type badge
 */
const getActivityColor = (type: string): string => {
  const activityTypeColors: Record<string, string> = {
    'Restaurants': 'bg-coral-100 text-coral-800 border-coral-300',
    'Museums': 'bg-purple-100 text-purple-800 border-purple-300',
    'Parks & Outdoors': 'bg-green-100 text-green-800 border-green-300',
    'Nightlife & Bars': 'bg-pink-100 text-pink-800 border-pink-300',
    'Shopping': 'bg-primary-100 text-primary-800 border-primary-300',
    'Historical Sites': 'bg-amber-100 text-amber-800 border-amber-300',
    'Entertainment': 'bg-red-100 text-red-800 border-red-300',
    'Coffee Shops': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'Art Galleries': 'bg-indigo-100 text-indigo-800 border-indigo-300',
    'Sports & Recreation': 'bg-teal-100 text-teal-800 border-teal-300',
  };
  return activityTypeColors[type] || 'bg-gray-100 text-gray-800 border-gray-300';
};

/**
 * Enhanced Activity Card with Google Places integration
 */
interface EnhancedActivityCardProps {
  activity: ItineraryItem;
  index: number;
  dayIndex: number;
  city: string;
  allActivities: ItineraryItem[];
  onReplaceActivity?: (dayIndex: number, activityIndex: number, newActivity: ItineraryItem, changesSummary: string) => void;
  preferences?: {
    city: string;
    radius: number;
    activities: string[];
    budget?: number;
    travelers?: number;
  };
}

function EnhancedActivityCard({
  activity,
  index,
  dayIndex,
  city,
  allActivities,
  onReplaceActivity,
  preferences,
}: EnhancedActivityCardProps) {
  const [enrichedData, setEnrichedData] = useState<GooglePlaceData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  // Fetch Google Places data
  useEffect(() => {
    const enrichPlace = async () => {
      setIsLoading(true);

      try {
        const requestBody: EnrichPlaceRequest = {
          name: activity.name,
          address: activity.address,
          city: city,
          coordinates: activity.coordinates,
        };

        const response = await fetch('/api/enrich-place', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (response.ok) {
          const data: GooglePlaceData = await response.json();
          setEnrichedData(data);
        }
      } catch (err) {
        console.error('Error enriching place:', err);
      } finally {
        setIsLoading(false);
      }
    };

    enrichPlace();
  }, [activity.name, activity.address, activity.coordinates, city]);

  const hasReviews = enrichedData?.reviews && enrichedData.reviews.length > 0;

  const handleReplace = (newItinerary: ItineraryItem[], changesSummary: string) => {
    // Find the new activity that replaced this one
    const newActivity = newItinerary[index];
    if (onReplaceActivity && newActivity) {
      onReplaceActivity(dayIndex, index, newActivity, changesSummary);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100 hover:shadow-xl transition-all duration-200">
      {/* Activity Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold flex items-center justify-center shadow-lg flex-shrink-0">
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-xl text-gray-900 mb-1">{activity.name}</h3>

            {/* Google Rating */}
            {enrichedData?.rating && (
              <div className="mb-2">
                <RatingDisplay
                  rating={enrichedData.rating}
                  reviewCount={enrichedData.user_ratings_total}
                  size="sm"
                />
              </div>
            )}
          </div>
        </div>

        {/* Activity Type Badge */}
        <span className={`px-3 py-1 rounded-full text-xs font-semibold border-2 whitespace-nowrap ${getActivityColor(activity.type)}`}>
          {activity.type}
        </span>
      </div>

      {/* Photo */}
      {enrichedData?.photos?.[0] && (
        <div className="mb-4">
          <img
            src={`https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${enrichedData.photos[0].photo_reference}&key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY}`}
            alt={activity.name}
            className="w-full h-48 object-cover rounded-xl shadow-md"
            loading="lazy"
          />
        </div>
      )}

      {/* Description */}
      <p className="text-gray-600 mb-4">{activity.description}</p>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-4">
        {/* Time */}
        <div className="flex items-center gap-2 text-gray-700">
          <Clock className="w-4 h-4 text-primary-600 flex-shrink-0" />
          <span className="font-medium">{activity.time}</span>
        </div>

        {/* Cost */}
        {activity.estimatedCost !== undefined && (
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span className={`font-bold ${activity.estimatedCost === 0 ? 'text-green-600' : 'text-gray-900'}`}>
              {activity.estimatedCost === 0 ? 'Free' : `$${activity.estimatedCost.toFixed(2)}/person`}
            </span>
          </div>
        )}

        {/* Address */}
        <div className="flex items-start gap-2 text-gray-700 md:col-span-2">
          <MapPin className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" />
          <span className="font-medium">{enrichedData?.formatted_address || activity.address}</span>
        </div>
      </div>

      {/* Price Level & Open Status */}
      {(enrichedData?.price_level !== undefined || enrichedData?.opening_hours) && (
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {enrichedData.price_level !== undefined && (
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-lg text-sm font-semibold">
              {getPriceLevel(enrichedData.price_level)}
            </span>
          )}
          {enrichedData.opening_hours && (
            <span
              className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                enrichedData.opening_hours.open_now
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {enrichedData.opening_hours.open_now ? '✓ Open now' : '✗ Closed'}
            </span>
          )}
        </div>
      )}

      {/* Contact Info */}
      {(enrichedData?.website || enrichedData?.formatted_phone_number) && (
        <div className="flex flex-wrap items-center gap-4 text-sm mb-4">
          {enrichedData.website && (
            <a
              href={enrichedData.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Globe className="w-4 h-4" />
              <span>Website</span>
            </a>
          )}
          {enrichedData.formatted_phone_number && (
            <a
              href={`tel:${enrichedData.formatted_phone_number}`}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span>{enrichedData.formatted_phone_number}</span>
            </a>
          )}
        </div>
      )}

      {/* Reviews Section */}
      {hasReviews && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
          <button
            onClick={() => setShowAllReviews(!showAllReviews)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-semibold transition-colors"
          >
            {showAllReviews ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Hide reviews
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show {enrichedData.reviews?.length} {enrichedData.reviews?.length === 1 ? 'review' : 'reviews'}
              </>
            )}
          </button>

          {showAllReviews && (
            <div className="space-y-3">
              {enrichedData.reviews?.map((review, idx) => (
                <ReviewCard key={idx} review={review} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="mt-4 text-sm text-gray-500 flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          Loading details...
        </div>
      )}

      {/* Replace Activity Button */}
      {onReplaceActivity && preferences && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <ReplaceActivity
            activity={activity}
            index={index}
            allActivities={allActivities}
            city={city}
            preferences={preferences}
            onReplace={handleReplace}
          />
        </div>
      )}
    </div>
  );
}

export default function DayNavigation({ days, city, onReplaceActivity, preferences }: DayNavigationProps) {
  const [currentDayIndex, setCurrentDayIndex] = useState(0);

  if (!days || days.length === 0) {
    return null;
  }

  const currentDay = days[currentDayIndex];

  const goToPreviousDay = () => {
    setCurrentDayIndex((prev) => Math.max(0, prev - 1));
  };

  const goToNextDay = () => {
    setCurrentDayIndex((prev) => Math.min(days.length - 1, prev + 1));
  };

  return (
    <div className="w-full">
      {/* Day tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 custom-scrollbar">
        {days.map((day, index) => (
          <button
            key={index}
            onClick={() => setCurrentDayIndex(index)}
            className={`px-4 py-3 rounded-xl whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
              currentDayIndex === index
                ? 'bg-gradient-to-r from-coral-500 to-coral-400 text-white shadow-lg shadow-coral-500/30'
                : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-coral-300 hover:bg-coral-50'
            }`}
          >
            <div className="font-semibold">Day {day.dayNumber}</div>
            <div className="text-xs mt-0.5 opacity-90">
              {format(new Date(day.date), 'EEE, MMM d')}
            </div>
          </button>
        ))}
      </div>

      {/* Day header */}
      <div className="mb-6 bg-gradient-to-r from-primary-50 to-coral-50 rounded-2xl p-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Day {currentDay.dayNumber} - {format(new Date(currentDay.date), 'EEEE, MMMM d, yyyy')}
        </h2>
        {currentDay.summary && (
          <p className="text-gray-600 text-lg">{currentDay.summary}</p>
        )}
        <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <span className="font-semibold text-primary-600">{currentDay.activities.length}</span> activities
          </span>
          {currentDay.dayType && (
            <span className="px-3 py-1 bg-white rounded-full text-xs font-medium capitalize">
              {currentDay.dayType === 'arrival' && '✈️ Arrival Day'}
              {currentDay.dayType === 'full' && '🌟 Full Day'}
              {currentDay.dayType === 'departure' && '👋 Departure Day'}
            </span>
          )}
        </div>
      </div>

      {/* Activities for current day */}
      <div className="space-y-4 mb-8">
        {currentDay.activities.map((activity: ItineraryItem, index: number) => (
          <EnhancedActivityCard
            key={index}
            activity={activity}
            index={index}
            dayIndex={currentDayIndex}
            city={city}
            allActivities={currentDay.activities}
            onReplaceActivity={onReplaceActivity}
            preferences={preferences}
          />
        ))}
      </div>

      {/* Navigation arrows */}
      {days.length > 1 && (
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={goToPreviousDay}
            disabled={currentDayIndex === 0}
            className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-gray-200 rounded-xl
                       hover:border-primary-300 hover:bg-primary-50 transition-all duration-200
                       disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200
                       font-medium text-gray-700"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous Day
          </button>

          <div className="text-sm text-gray-500 font-medium">
            {currentDayIndex + 1} of {days.length}
          </div>

          <button
            onClick={goToNextDay}
            disabled={currentDayIndex === days.length - 1}
            className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-gray-200 rounded-xl
                       hover:border-primary-300 hover:bg-primary-50 transition-all duration-200
                       disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200
                       font-medium text-gray-700"
          >
            Next Day
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
