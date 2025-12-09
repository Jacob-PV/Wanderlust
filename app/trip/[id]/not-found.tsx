import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-coral-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
        <div className="text-6xl mb-4">🗺️</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Itinerary Not Found
        </h1>
        <p className="text-gray-600 mb-6">
          This itinerary doesn&apos;t exist or has expired. Shared itineraries are
          stored for 90 days.
        </p>
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
