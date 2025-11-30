'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  MapPin,
  DollarSign,
  ArrowLeft,
  Navigation,
  Sparkles,
  Phone,
  Globe,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Itinerary, ItineraryItem, EnrichedItineraryItem, GooglePlaceData, EnrichPlaceRequest } from '@/types';
import RatingDisplay from './RatingDisplay';
import ReviewCard from './ReviewCard';
import ReplaceActivity from './ReplaceActivity';

interface ItineraryDisplayProps {
  itinerary: Itinerary;
  onRegenerate: () => void;
  onReplaceActivity?: (newItinerary: ItineraryItem[], changesSummary: string) => void;
  preferences?: {
    city: string;
    radius: number;
    activities: string[];
    budget?: number;
    travelers?: number;
  };
}

// Updated color scheme for Wanderlust Theme
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

const getActivityColor = (type: string): string => {
  return activityTypeColors[type] || 'bg-gray-100 text-gray-800 border-gray-300';
};

/**
 * Helper to get price level display
 */
const getPriceLevel = (level?: number): string => {
  if (level === undefined) return '';
  const symbols = ['Free', '$', '$$', '$$$', '$$$$'];
  return symbols[level] || '';
};

/**
 * Individual Activity Card Component
 */
interface ActivityCardProps {
  item: ItineraryItem;
  index: number;
  city: string;
  allActivities: ItineraryItem[];
  onReplaceActivity?: (newItinerary: ItineraryItem[], changesSummary: string) => void;
  preferences?: {
    city: string;
    radius: number;
    activities: string[];
    budget?: number;
    travelers?: number;
  };
}

function ActivityCard({ item, index, city, allActivities, onReplaceActivity, preferences }: ActivityCardProps) {
  const [enrichedData, setEnrichedData] = useState<GooglePlaceData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAllReviews, setShowAllReviews] = useState(false);

  // Fetch Google Places data on mount
  useEffect(() => {
    const enrichPlace = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const requestBody: EnrichPlaceRequest = {
          name: item.name,
          address: item.address,
          city: city,
          coordinates: item.coordinates,
        };

        const response = await fetch('/api/enrich-place', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (response.ok) {
          const data: GooglePlaceData = await response.json();
          setEnrichedData(data);
        } else {
          // Silently fail - not critical
          console.log(`Could not enrich: ${item.name}`);
        }
      } catch (err) {
        console.error('Error enriching place:', err);
        setError('Unable to load reviews');
      } finally {
        setIsLoading(false);
      }
    };

    enrichPlace();
  }, [item.name, item.address, item.coordinates, city]);

  const hasReviews = enrichedData?.reviews && enrichedData.reviews.length > 0;
  const displayedReviews = showAllReviews ? enrichedData?.reviews : enrichedData?.reviews?.slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 + index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      className="card-hover p-6 md:p-8"
    >
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-4 flex-1">
          {/* Number Badge */}
          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-500 text-white rounded-2xl flex items-center justify-center font-bold text-lg shadow-lg">
            {index + 1}
          </div>

          {/* Activity Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
              {item.name}
            </h3>

            {/* Google Rating */}
            {enrichedData?.rating && (
              <div className="mb-3">
                <RatingDisplay
                  rating={enrichedData.rating}
                  reviewCount={enrichedData.user_ratings_total}
                  size="md"
                />
              </div>
            )}

            <div className="flex items-center gap-2 text-gray-600 mb-3">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm">
                {enrichedData?.formatted_address || item.address}
              </p>
            </div>

            {/* Price Level & Open Status */}
            {(enrichedData?.price_level !== undefined || enrichedData?.opening_hours) && (
              <div className="flex flex-wrap items-center gap-3 mb-3">
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
              <div className="flex flex-wrap items-center gap-4 text-sm mb-3">
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
          </div>
        </div>

        {/* Activity Type Badge */}
        <span
          className={`px-4 py-2 rounded-xl text-xs font-bold border-2 whitespace-nowrap ${getActivityColor(
            item.type
          )}`}
        >
          {item.type}
        </span>
      </div>

      {/* Photo from Google Places */}
      {enrichedData?.photos?.[0] && (
        <div className="mb-4">
          <img
            src={`https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${enrichedData.photos[0].photo_reference}&key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY}`}
            alt={item.name}
            className="w-full h-56 md:h-64 lg:h-80 object-cover rounded-xl shadow-md"
            loading="lazy"
          />
        </div>
      )}

      {/* Time and Cost Info */}
      <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm mb-4">
        <div className="flex items-center gap-2 text-gray-700">
          <Clock className="w-4 h-4 text-primary-600" />
          <span className="font-semibold">{item.time}</span>
        </div>
        <div className="text-gray-400">•</div>
        <div className="text-gray-600 font-medium">{item.duration}</div>
        {item.estimatedCost !== undefined && (
          <>
            <div className="text-gray-400">•</div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span
                className={`font-bold ${
                  item.estimatedCost === 0 ? 'text-green-600' : 'text-gray-700'
                }`}
              >
                {item.estimatedCost === 0
                  ? 'Free'
                  : `$${item.estimatedCost.toFixed(2)}/person`}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Description */}
      <p className="text-gray-700 leading-relaxed mb-4">{item.description}</p>

      {/* Reviews Section */}
      {hasReviews && (
        <div className="mt-6 space-y-4">
          <button
            onClick={() => setShowAllReviews(!showAllReviews)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-semibold transition-colors"
          >
            {showAllReviews ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Hide {enrichedData.reviews?.length} {enrichedData.reviews?.length === 1 ? 'review' : 'reviews'}
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
          Loading reviews and details...
        </div>
      )}

      {/* Replace Activity Button */}
      {onReplaceActivity && preferences && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <ReplaceActivity
            activity={item}
            index={index}
            allActivities={allActivities}
            city={city}
            preferences={preferences}
            onReplace={onReplaceActivity}
          />
        </div>
      )}
    </motion.div>
  );
}

export default function ItineraryDisplay({ itinerary, onRegenerate, onReplaceActivity, preferences }: ItineraryDisplayProps) {
  const totalCostPerPerson = itinerary.itinerary.reduce(
    (sum, item) => sum + (item.estimatedCost || 0),
    0
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold font-display gradient-text">
            Your Perfect Day in
          </h2>
          <p className="text-2xl md:text-3xl font-bold text-gray-800 mt-1">
            {itinerary.city.split(',')[0]}
          </p>
        </motion.div>
        <motion.button
          onClick={onRegenerate}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="btn-outline flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Plan Another Trip
        </motion.button>
      </div>

      {/* Budget Summary Card */}
      {totalCostPerPerson > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-3xl p-6 md:p-8 shadow-soft border border-white/30"
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-bold text-gray-900">Cost Summary</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <p className="text-sm text-gray-600 font-medium">Per Person</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
                ${totalCostPerPerson.toFixed(2)}
              </p>
            </div>
            {itinerary.totalCost && (
              <div className="space-y-1">
                <p className="text-sm text-gray-600 font-medium">Total Cost</p>
                <p className="text-3xl font-bold text-gray-900">
                  ${itinerary.totalCost.toFixed(2)}
                </p>
              </div>
            )}
            {itinerary.budgetRemaining !== undefined && (
              <div className="space-y-1">
                <p className="text-sm text-gray-600 font-medium">
                  {itinerary.budgetRemaining >= 0 ? 'Under Budget' : 'Over Budget'}
                </p>
                <p
                  className={`text-3xl font-bold ${
                    itinerary.budgetRemaining >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  ${Math.abs(itinerary.budgetRemaining).toFixed(2)}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Timeline */}
      <div className="space-y-6">
        {itinerary.itinerary.map((item: ItineraryItem, index: number) => (
          <div key={index}>
            {/* Travel Time Indicator */}
            {index > 0 && item.travelTime && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="flex items-center justify-center py-4"
              >
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-50 to-coral-50 border border-primary-200 rounded-full text-sm font-medium text-primary-700">
                  <Navigation className="w-4 h-4" />
                  {item.travelTime}
                </div>
              </motion.div>
            )}

            {/* Activity Card with Google Places enrichment */}
            <ActivityCard
              item={item}
              index={index}
              city={itinerary.city}
              allActivities={itinerary.itinerary}
              onReplaceActivity={onReplaceActivity}
              preferences={preferences}
            />
          </div>
        ))}
      </div>

      {/* Day End Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 + itinerary.itinerary.length * 0.1 }}
        className="text-center py-8"
      >
        <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-50 to-coral-50 rounded-full">
          <Sparkles className="w-5 h-5 text-primary-600" />
          <span className="text-gray-700 font-medium">
            End of your perfect day
          </span>
          <Sparkles className="w-5 h-5 text-coral-600" />
        </div>
      </motion.div>
    </motion.div>
  );
}
