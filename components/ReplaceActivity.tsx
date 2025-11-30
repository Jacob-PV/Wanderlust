'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, MapPin, Star, Clock, RefreshCw } from 'lucide-react';
import { ItineraryItem, AlternativeActivity } from '@/types';

interface ReplaceActivityProps {
  /** The activity to replace */
  activity: ItineraryItem;

  /** Index of the activity in the itinerary */
  index: number;

  /** Complete current itinerary */
  allActivities: ItineraryItem[];

  /** City name for context */
  city: string;

  /** Original preferences used to generate itinerary */
  preferences: {
    city: string;
    radius: number;
    activities: string[];
    budget?: number;
    travelers?: number;
  };

  /** Callback when replacement is successful */
  onReplace: (newItinerary: ItineraryItem[], changesSummary: string) => void;
}

export default function ReplaceActivity({
  activity,
  index,
  allActivities,
  city,
  preferences,
  onReplace,
}: ReplaceActivityProps) {
  const [showModal, setShowModal] = useState(false);
  const [alternatives, setAlternatives] = useState<AlternativeActivity[]>([]);
  const [loadingAlternatives, setLoadingAlternatives] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch alternative activities from Google Places
   */
  const findAlternatives = async () => {
    setLoadingAlternatives(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/find-alternatives?` +
          `type=${encodeURIComponent(activity.type)}&` +
          `lat=${activity.coordinates.lat}&` +
          `lng=${activity.coordinates.lng}&` +
          `radius=8000` // 8km (~5 miles)
      );

      if (!response.ok) {
        throw new Error('Failed to find alternatives');
      }

      const data = await response.json();
      setAlternatives(data.alternatives || []);
      setShowModal(true);
    } catch (err) {
      console.error('Error finding alternatives:', err);
      setError('Unable to find alternative activities. Please try again.');
    } finally {
      setLoadingAlternatives(false);
    }
  };

  /**
   * Select a replacement and optimize the itinerary
   */
  const selectReplacement = async (replacement: AlternativeActivity) => {
    setOptimizing(true);
    setError(null);

    try {
      const response = await fetch('/api/replace-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentItinerary: allActivities,
          replaceIndex: index,
          replacement: {
            name: replacement.name,
            type: replacement.type,
            coordinates: replacement.coordinates,
            address: replacement.vicinity,
            placeId: replacement.placeId,
          },
          preferences,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to optimize itinerary');
      }

      const data = await response.json();

      // Close modal
      setShowModal(false);

      // Notify parent with new itinerary
      onReplace(data.newItinerary, data.changes.summary);
    } catch (err) {
      console.error('Error optimizing itinerary:', err);
      setError('Failed to update itinerary. Please try again.');
    } finally {
      setOptimizing(false);
    }
  };

  return (
    <>
      {/* Replace Button */}
      <button
        onClick={findAlternatives}
        disabled={loadingAlternatives}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors disabled:opacity-50"
      >
        {loadingAlternatives ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Finding alternatives...
          </>
        ) : (
          <>
            <RefreshCw className="w-4 h-4" />
            Not interested? Replace this
          </>
        )}
      </button>

      {/* Error Message */}
      {error && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      {/* Alternatives Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => !optimizing && setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="glass rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl border border-white/30"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-primary-600 to-primary-500 p-6 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Find a Replacement</h2>
                    <p className="text-primary-100 text-sm">
                      Replacing: <span className="font-semibold">{activity.name}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    disabled={optimizing}
                    className="p-2 hover:bg-white/20 rounded-xl transition-colors disabled:opacity-50"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Alternatives List */}
              <div className="overflow-y-auto max-h-[calc(85vh-200px)] p-6">
                {alternatives.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 mb-2">No alternatives found nearby</p>
                    <p className="text-sm text-gray-400">
                      Try searching in a different area or with different activity types
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 mb-4">
                      Found {alternatives.length} alternative{alternatives.length !== 1 ? 's' : ''} of type:{' '}
                      <span className="font-semibold">{activity.type}</span>
                    </p>

                    {alternatives.map((alt, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => !optimizing && selectReplacement(alt)}
                        className={`card-hover p-5 cursor-pointer transition-all ${
                          optimizing ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-lg text-gray-900 mb-2">
                              {alt.name}
                            </h3>

                            {/* Rating */}
                            {alt.rating && (
                              <div className="flex items-center gap-2 mb-2">
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                  <span className="font-semibold text-gray-900">
                                    {alt.rating.toFixed(1)}
                                  </span>
                                </div>
                                {alt.userRatingsTotal && (
                                  <span className="text-sm text-gray-500">
                                    ({alt.userRatingsTotal.toLocaleString()} reviews)
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Address */}
                            <div className="flex items-start gap-2 text-sm text-gray-600 mb-2">
                              <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                              <p className="line-clamp-2">{alt.vicinity}</p>
                            </div>

                            {/* Distance & Status */}
                            <div className="flex flex-wrap items-center gap-3 text-sm">
                              <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-lg font-medium">
                                {alt.distance.toFixed(1)} mi away
                              </span>
                              {alt.openNow !== undefined && (
                                <span
                                  className={`px-2 py-1 rounded-lg font-medium ${
                                    alt.openNow
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-red-100 text-red-700'
                                  }`}
                                >
                                  {alt.openNow ? '✓ Open now' : '✗ Closed'}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Select Arrow */}
                          <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-primary-600 font-bold">→</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <button
                  onClick={() => setShowModal(false)}
                  disabled={optimizing}
                  className="btn-outline w-full"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Optimizing Overlay */}
      <AnimatePresence>
        {optimizing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60]"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="glass rounded-3xl p-8 md:p-12 max-w-md w-full shadow-2xl border border-white/30"
            >
              <div className="flex flex-col items-center text-center">
                {/* Animated Icon */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                  className="mb-6 relative"
                >
                  <div className="w-20 h-20 bg-gradient-to-br from-primary-600 to-coral-500 rounded-3xl flex items-center justify-center shadow-2xl">
                    <RefreshCw className="w-10 h-10 text-white" />
                  </div>
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 0.8, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="absolute inset-0 bg-gradient-to-br from-primary-400 to-coral-400 rounded-3xl blur-xl"
                  />
                </motion.div>

                {/* Text */}
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Optimizing Your Itinerary
                </h3>
                <div className="space-y-2 text-gray-600 mb-6">
                  <p className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Finding best route
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Adjusting times
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Checking for conflicts
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    animate={{
                      x: ['-100%', '100%'],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="h-full w-1/2 bg-gradient-to-r from-primary-600 to-coral-500 rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
