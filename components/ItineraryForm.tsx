'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Circle,
  Users,
  DollarSign,
  Sparkles,
  Search,
  UtensilsCrossed,
  Landmark,
  Trees,
  Music,
  ShoppingBag,
  Castle,
  Popcorn,
  Coffee,
  Palette,
  Dumbbell,
  Calendar,
  Clock,
} from 'lucide-react';
import {
  GenerateItineraryRequest,
  ACTIVITY_TYPES,
  NominatimResult,
  Coordinates,
  ActivityType,
  TripPace,
} from '@/types';
import DateRangePicker from './DateRangePicker';

interface ItineraryFormProps {
  onSubmit: (data: GenerateItineraryRequest) => void;
  isLoading: boolean;
}

// Icon mapping for activity types
const activityIcons: Record<ActivityType, React.ReactNode> = {
  'Restaurants': <UtensilsCrossed className="w-4 h-4" />,
  'Museums': <Landmark className="w-4 h-4" />,
  'Parks & Outdoors': <Trees className="w-4 h-4" />,
  'Nightlife & Bars': <Music className="w-4 h-4" />,
  'Shopping': <ShoppingBag className="w-4 h-4" />,
  'Historical Sites': <Castle className="w-4 h-4" />,
  'Entertainment': <Popcorn className="w-4 h-4" />,
  'Coffee Shops': <Coffee className="w-4 h-4" />,
  'Art Galleries': <Palette className="w-4 h-4" />,
  'Sports & Recreation': <Dumbbell className="w-4 h-4" />,
};

export default function ItineraryForm({ onSubmit, isLoading }: ItineraryFormProps) {
  const [city, setCity] = useState('');
  const [cityCoordinates, setCityCoordinates] = useState<Coordinates | undefined>();
  const [radius, setRadius] = useState('5');
  const [preferences, setPreferences] = useState<string[]>([]);
  const [budget, setBudget] = useState<string>('');
  const [travelers, setTravelers] = useState<string>('1');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | null>(null);
  const [pace, setPace] = useState<TripPace>('moderate');
  const [dailyHours, setDailyHours] = useState(10);
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchCitySuggestions = async () => {
      if (city.length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            city
          )}&format=json&limit=20&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'TravelItineraryApp/1.0'
            }
          }
        );
        const data: NominatimResult[] = await response.json();

        // Filter to only show actual cities (not neighborhoods, counties, etc.)
        const cityResults = data.filter((result) => {
          const addressType = result.addresstype?.toLowerCase();
          const type = result.type?.toLowerCase();
          const osmClass = result.class?.toLowerCase();

          // Accept: city, town, village, municipality
          return (
            addressType === 'city' ||
            addressType === 'town' ||
            addressType === 'village' ||
            addressType === 'municipality' ||
            type === 'city' ||
            type === 'town' ||
            type === 'village' ||
            type === 'municipality' ||
            (osmClass === 'place' && (type === 'city' || type === 'town' || type === 'village'))
          );
        });

        // Limit to 5 results
        setSuggestions(cityResults.slice(0, 5));
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error fetching city suggestions:', error);
      }
    };

    const debounce = setTimeout(fetchCitySuggestions, 300);
    return () => clearTimeout(debounce);
  }, [city]);

  const handleCitySelect = (result: NominatimResult) => {
    setCity(result.display_name);
    setCityCoordinates({
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
    });
    setShowSuggestions(false);
  };

  const handlePreferenceToggle = (preference: string) => {
    setPreferences((prev) =>
      prev.includes(preference)
        ? prev.filter((p) => p !== preference)
        : [...prev, preference]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (city && preferences.length > 0) {
      onSubmit({
        city,
        radius,
        preferences,
        coordinates: cityCoordinates,
        budget: budget ? parseFloat(budget) : undefined,
        travelers: travelers ? parseInt(travelers) : undefined,
        dateRange: dateRange ? { startDate: dateRange.from, endDate: dateRange.to } : undefined,
        pace,
        dailyHours,
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-3xl mx-auto"
    >
      <form onSubmit={handleSubmit} className="glass rounded-3xl p-8 md:p-10 shadow-2xl space-y-8">
        {/* City Input */}
        <div className="space-y-3">
          <label htmlFor="city" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <MapPin className="w-4 h-4 text-primary-600" />
            Where to?
          </label>
          <div className="relative" ref={suggestionsRef}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Search for a city..."
                className="input-primary pl-12 text-lg"
                required
              />
            </div>
            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden custom-scrollbar max-h-64 overflow-y-auto"
                >
                  {suggestions.map((result, index) => (
                    <motion.button
                      key={result.place_id}
                      type="button"
                      onClick={() => handleCitySelect(result)}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="w-full px-5 py-4 text-left hover:bg-primary-50 transition-all duration-200 border-b border-gray-50 last:border-b-0 flex items-center gap-3 group"
                    >
                      <MapPin className="w-4 h-4 text-gray-400 group-hover:text-primary-600 transition-colors" />
                      <p className="text-gray-900 font-medium group-hover:text-primary-600 transition-colors">
                        {result.display_name}
                      </p>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Date Range Picker */}
        <div className="space-y-3">
          <label htmlFor="dateRange" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Calendar className="w-4 h-4 text-primary-600" />
            When are you traveling?
            <span className="text-gray-400 font-normal text-xs">(optional - defaults to single day)</span>
          </label>
          <DateRangePicker
            onDateRangeChange={setDateRange}
            value={dateRange}
          />
        </div>

        {/* Trip Preferences (only shown if multi-day) */}
        {dateRange && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-6 border-t border-gray-200 pt-6"
          >
            {/* Trip Pace */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Sparkles className="w-4 h-4 text-primary-600" />
                Trip Pace
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['relaxed', 'moderate', 'packed'] as TripPace[]).map((paceOption) => {
                  const isSelected = pace === paceOption;
                  return (
                    <button
                      key={paceOption}
                      type="button"
                      onClick={() => setPace(paceOption)}
                      className={`px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                        isSelected
                          ? 'bg-gradient-to-r from-coral-500 to-coral-400 text-white shadow-lg shadow-coral-500/30'
                          : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-coral-300 hover:bg-coral-50'
                      }`}
                    >
                      <div className="text-sm capitalize">{paceOption}</div>
                      <div className="text-xs mt-1 opacity-80">
                        {paceOption === 'relaxed' && '3-4 activities'}
                        {paceOption === 'moderate' && '5-6 activities'}
                        {paceOption === 'packed' && '7-8 activities'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Daily Hours */}
            <div className="space-y-3">
              <label htmlFor="dailyHours" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Clock className="w-4 h-4 text-primary-600" />
                Daily Activity Hours
              </label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-primary-600">{dailyHours} hours per day</span>
                  <span className="text-sm text-gray-500">6 - 12 hours</span>
                </div>
                <input
                  type="range"
                  id="dailyHours"
                  min="6"
                  max="12"
                  value={dailyHours}
                  onChange={(e) => setDailyHours(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Radius Slider */}
        <div className="space-y-3">
          <label htmlFor="radius" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Circle className="w-4 h-4 text-primary-600" />
            Search Radius
          </label>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-primary-600">{radius} miles</span>
              <span className="text-sm text-gray-500">1 - 100 miles</span>
            </div>
            <input
              type="range"
              id="radius"
              min="1"
              max="100"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
            />
          </div>
        </div>

        {/* Budget and Travelers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <label htmlFor="budget" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <DollarSign className="w-4 h-4 text-primary-600" />
              Budget <span className="text-gray-400 font-normal text-xs">(optional)</span>
            </label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                id="budget"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="500"
                min="0"
                step="1"
                className="input-primary pl-12"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label htmlFor="travelers" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Users className="w-4 h-4 text-primary-600" />
              Travelers
            </label>
            <div className="relative">
              <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                id="travelers"
                value={travelers}
                onChange={(e) => setTravelers(e.target.value)}
                placeholder="2"
                min="1"
                max="20"
                step="1"
                className="input-primary pl-12"
              />
            </div>
          </div>
        </div>

        {/* Activity Preferences */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Sparkles className="w-4 h-4 text-primary-600" />
            What interests you?
            <span className="text-gray-400 font-normal text-xs">(select at least one)</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {ACTIVITY_TYPES.map((activity, index) => {
              const isSelected = preferences.includes(activity);
              return (
                <motion.button
                  key={activity}
                  type="button"
                  onClick={() => handlePreferenceToggle(activity)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                    isSelected
                      ? 'bg-gradient-to-r from-coral-500 to-coral-400 text-white shadow-lg shadow-coral-500/30'
                      : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-coral-300 hover:bg-coral-50'
                  }`}
                >
                  <span className={isSelected ? 'text-white' : 'text-gray-500'}>
                    {activityIcons[activity]}
                  </span>
                  <span className="text-sm">{activity}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={isLoading || !city || preferences.length === 0}
          whileHover={{ scale: isLoading ? 1 : 1.02 }}
          whileTap={{ scale: isLoading ? 1 : 0.98 }}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none text-lg py-4"
        >
          <span className="flex items-center justify-center gap-3">
            <Sparkles className="w-5 h-5" />
            {isLoading ? 'Creating Your Adventure...' : 'Generate My Itinerary'}
          </span>
        </motion.button>
      </form>
    </motion.div>
  );
}
