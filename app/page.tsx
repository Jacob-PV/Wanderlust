'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Sparkles, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import ItineraryForm from '@/components/ItineraryForm';
import ItineraryDisplay from '@/components/ItineraryDisplay';
import { GenerateItineraryRequest, Itinerary } from '@/types';

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] rounded-3xl bg-gray-100 flex items-center justify-center">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
});

// Delightful loading messages that rotate
const loadingMessages = [
  'Finding hidden gems...',
  'Crafting your perfect day...',
  'Exploring local favorites...',
  'Discovering unique experiences...',
  'Planning your adventure...',
  'Curating magical moments...',
];

export default function Home() {
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestData, setRequestData] = useState<GenerateItineraryRequest | null>(null);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);

  const handleGenerateItinerary = async (data: GenerateItineraryRequest) => {
    setIsLoading(true);
    setError(null);
    setRequestData(data);

    // Rotate loading messages every 2 seconds
    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % loadingMessages.length;
      setLoadingMessage(loadingMessages[messageIndex]);
    }, 2000);

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
      clearInterval(messageInterval);
      setIsLoading(false);
    }
  };

  const handleRegenerate = () => {
    setItinerary(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-coral-50 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-200 rounded-full blur-3xl opacity-20 animate-float"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-coral-200 rounded-full blur-3xl opacity-20 animate-float" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 md:py-12">
        {!itinerary ? (
          <>
            {/* Hero Header */}
            <motion.header
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12 md:mb-16"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="inline-flex items-center justify-center w-20 h-20 mb-6 bg-gradient-to-br from-primary-600 to-coral-500 rounded-3xl shadow-2xl shadow-primary-500/30"
              >
                <Compass className="w-10 h-10 text-white" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-5xl md:text-7xl font-bold font-display mb-4"
              >
                <span className="gradient-text">Wanderlust</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto font-medium"
              >
                AI-powered itineraries for your perfect day trip
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Personalized • Local • Authentic</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </motion.div>
            </motion.header>

            {/* Error Display */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="max-w-3xl mx-auto mb-6"
                >
                  <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5 shadow-soft">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-red-600"
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
                      </div>
                      <div>
                        <p className="text-red-800 font-semibold">{error}</p>
                        <p className="text-red-600 text-sm mt-1">
                          Please try again or adjust your preferences
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <ItineraryForm onSubmit={handleGenerateItinerary} isLoading={isLoading} />
          </>
        ) : (
          <>
            {/* Results View - Split Screen Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
              {/* Left: Itinerary */}
              <div className="lg:max-h-[85vh] lg:overflow-y-auto lg:pr-4 custom-scrollbar">
                <ItineraryDisplay itinerary={itinerary} onRegenerate={handleRegenerate} />
              </div>

              {/* Right: Map (Sticky on desktop) */}
              <div className="lg:sticky lg:top-8 lg:h-[85vh]">
                <MapView
                  key={`${itinerary.city}-${itinerary.itinerary.length}`}
                  itinerary={itinerary}
                />
              </div>
            </div>
          </>
        )}

        {/* Loading Modal */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', duration: 0.5 }}
                className="glass rounded-3xl p-8 md:p-12 max-w-md w-full shadow-2xl border-2 border-white/30"
              >
                <div className="flex flex-col items-center text-center">
                  {/* Animated Icon */}
                  <motion.div
                    animate={{
                      rotate: 360,
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                    className="mb-6 relative"
                  >
                    <div className="w-20 h-20 bg-gradient-to-br from-primary-600 to-coral-500 rounded-3xl flex items-center justify-center shadow-2xl">
                      <Compass className="w-10 h-10 text-white" />
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
                    ></motion.div>
                  </motion.div>

                  {/* Loading Text */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    Creating Your Adventure
                  </h3>

                  {/* Rotating Messages */}
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={loadingMessage}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="text-gray-600 font-medium mb-6"
                    >
                      {loadingMessage}
                    </motion.p>
                  </AnimatePresence>

                  {/* Animated Progress Bar */}
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
                    ></motion.div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <footer className="relative z-10 mt-20 py-8 border-t border-gray-200">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600 text-sm">
            Powered by{' '}
            <span className="font-semibold text-gray-800">OpenAI</span> and{' '}
            <span className="font-semibold text-gray-800">OpenStreetMap</span>
          </p>
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-500">
            <Sparkles className="w-3 h-3" />
            <span>Made with care for travelers</span>
            <Sparkles className="w-3 h-3" />
          </div>
        </div>
      </footer>
    </div>
  );
}
