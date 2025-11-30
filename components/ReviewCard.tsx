/**
 * ReviewCard Component
 *
 * Displays an individual Google Places review with author info,
 * rating, and review text.
 *
 * Features:
 * - Author profile photo
 * - Author name
 * - Star rating
 * - Review text with "Read more" expansion
 * - Relative time (e.g., "2 weeks ago")
 *
 * @example
 * <ReviewCard
 *   review={{
 *     author_name: "Sarah Johnson",
 *     rating: 5,
 *     text: "Amazing experience!",
 *     relative_time_description: "2 weeks ago"
 *   }}
 * />
 */

'use client';

import { useState } from 'react';
import { GoogleReview } from '@/types';
import RatingDisplay from './RatingDisplay';

interface ReviewCardProps {
  /** Google review data */
  review: GoogleReview;

  /** Whether to show full review text initially */
  expanded?: boolean;
}

export default function ReviewCard({ review, expanded = false }: ReviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [imageError, setImageError] = useState(false);

  // Truncate long reviews
  const MAX_LENGTH = 200;
  const shouldTruncate = review.text.length > MAX_LENGTH;
  const displayText = !shouldTruncate || isExpanded
    ? review.text
    : `${review.text.slice(0, MAX_LENGTH)}...`;

  // Show initials fallback if no photo or image fails to load
  const showInitials = !review.profile_photo_url || imageError;

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
      {/* Author info and rating */}
      <div className="flex items-start gap-3 mb-3">
        {/* Profile photo */}
        {showInitials ? (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-white font-bold text-sm">
              {review.author_name.charAt(0).toUpperCase()}
            </span>
          </div>
        ) : (
          <img
            src={review.profile_photo_url}
            alt={review.author_name}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0 shadow-sm"
            onError={() => setImageError(true)}
          />
        )}

        {/* Author name and rating */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            {review.author_url ? (
              <a
                href={review.author_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-gray-900 hover:text-blue-600 transition-colors truncate"
              >
                {review.author_name}
              </a>
            ) : (
              <p className="font-semibold text-gray-900 truncate">{review.author_name}</p>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1">
            <RatingDisplay
              rating={review.rating}
              size="sm"
              showNumeric={false}
              showCount={false}
            />
            {review.relative_time_description && (
              <span className="text-xs text-gray-500">
                {review.relative_time_description}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Review text */}
      <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
        {displayText}
      </p>

      {/* Read more/less toggle */}
      {shouldTruncate && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
        >
          {isExpanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  );
}
