'use client';

import { useState, useEffect, useRef } from 'react';
import {
  GenerateItineraryRequest,
  ACTIVITY_TYPES,
  RADIUS_OPTIONS,
  NominatimResult,
  Coordinates,
} from '@/types';

interface ItineraryFormProps {
  onSubmit: (data: GenerateItineraryRequest) => void;
  isLoading: boolean;
}

export default function ItineraryForm({ onSubmit, isLoading }: ItineraryFormProps) {
  const [city, setCity] = useState('');
  const [cityCoordinates, setCityCoordinates] = useState<Coordinates | undefined>();
  const [radius, setRadius] = useState('5');
  const [preferences, setPreferences] = useState<string[]>([]);
  const [budget, setBudget] = useState<string>('');
  const [travelers, setTravelers] = useState<string>('1');
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
          )}&format=json&limit=5&addressdetails=1&featuretype=city`,
          {
            headers: {
              'User-Agent': 'TravelItineraryApp/1.0'
            }
          }
        );
        const data: NominatimResult[] = await response.json();
        setSuggestions(data);
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
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto space-y-6">
      <div>
        <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
          City
        </label>
        <div className="relative" ref={suggestionsRef}>
          <input
            type="text"
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Enter a city name..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            required
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
              {suggestions.map((result) => (
                <button
                  key={result.place_id}
                  type="button"
                  onClick={() => handleCitySelect(result)}
                  className="w-full px-4 py-2 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  {result.display_name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="radius" className="block text-sm font-medium text-gray-700 mb-2">
          Search Radius
        </label>
        <select
          id="radius"
          value={radius}
          onChange={(e) => setRadius(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        >
          {RADIUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-2">
            Total Budget (USD) <span className="text-gray-500 font-normal">(optional)</span>
          </label>
          <input
            type="number"
            id="budget"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="e.g., 500"
            min="0"
            step="1"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label htmlFor="travelers" className="block text-sm font-medium text-gray-700 mb-2">
            Number of Travelers
          </label>
          <input
            type="number"
            id="travelers"
            value={travelers}
            onChange={(e) => setTravelers(e.target.value)}
            placeholder="e.g., 2"
            min="1"
            max="20"
            step="1"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Activity Preferences (select at least one)
        </label>
        <div className="grid grid-cols-2 gap-2">
          {ACTIVITY_TYPES.map((activity) => (
            <label
              key={activity}
              className={`flex items-center px-4 py-2 border rounded-lg cursor-pointer transition-all ${
                preferences.includes(activity)
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
              }`}
            >
              <input
                type="checkbox"
                checked={preferences.includes(activity)}
                onChange={() => handlePreferenceToggle(activity)}
                className="mr-2"
              />
              {activity}
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || !city || preferences.length === 0}
        className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Generating Itinerary...' : 'Generate Itinerary'}
      </button>
    </form>
  );
}
