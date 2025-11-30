/**
 * RatingDisplay Component
 *
 * Displays star ratings with visual stars and numeric rating.
 * Used to show Google Places ratings for activities.
 *
 * Features:
 * - Visual star representation (filled, half, empty)
 * - Numeric rating display
 * - Review count
 * - Responsive design
 *
 * @example
 * <RatingDisplay rating={4.6} reviewCount={2431} />
 * // Renders: ⭐⭐⭐⭐☆ 4.6 (2,431 reviews)
 */

'use client';

interface RatingDisplayProps {
  /** Star rating from 0-5 */
  rating: number;

  /** Total number of reviews (optional) */
  reviewCount?: number;

  /** Size variant for different contexts */
  size?: 'sm' | 'md' | 'lg';

  /** Whether to show the numeric rating */
  showNumeric?: boolean;

  /** Whether to show review count */
  showCount?: boolean;
}

export default function RatingDisplay({
  rating,
  reviewCount,
  size = 'md',
  showNumeric = true,
  showCount = true,
}: RatingDisplayProps) {
  // Clamp rating to 0-5 range
  const clampedRating = Math.max(0, Math.min(5, rating));

  // Calculate filled, half, and empty stars
  const fullStars = Math.floor(clampedRating);
  const hasHalfStar = clampedRating % 1 >= 0.25 && clampedRating % 1 < 0.75;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  // Size-based styling
  const sizeClasses = {
    sm: {
      star: 'text-sm',
      rating: 'text-sm',
      count: 'text-xs',
    },
    md: {
      star: 'text-base',
      rating: 'text-base',
      count: 'text-sm',
    },
    lg: {
      star: 'text-xl',
      rating: 'text-lg',
      count: 'text-base',
    },
  };

  const styles = sizeClasses[size];

  // Format review count with commas
  const formatCount = (count: number): string => {
    return count.toLocaleString('en-US');
  };

  return (
    <div className="flex items-center gap-2">
      {/* Star visualization */}
      <div className={`flex items-center ${styles.star}`} aria-label={`${rating} out of 5 stars`}>
        {/* Filled stars */}
        {Array.from({ length: fullStars }).map((_, i) => (
          <span key={`full-${i}`} className="text-yellow-400">
            ★
          </span>
        ))}

        {/* Half star */}
        {hasHalfStar && (
          <span className="relative inline-block">
            <span className="text-gray-300">★</span>
            <span className="absolute left-0 top-0 overflow-hidden text-yellow-400" style={{ width: '50%' }}>
              ★
            </span>
          </span>
        )}

        {/* Empty stars */}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <span key={`empty-${i}`} className="text-gray-300">
            ★
          </span>
        ))}
      </div>

      {/* Numeric rating */}
      {showNumeric && (
        <span className={`font-semibold text-gray-900 ${styles.rating}`}>
          {clampedRating.toFixed(1)}
        </span>
      )}

      {/* Review count */}
      {showCount && reviewCount !== undefined && reviewCount > 0 && (
        <span className={`text-gray-500 ${styles.count}`}>
          ({formatCount(reviewCount)} {reviewCount === 1 ? 'review' : 'reviews'})
        </span>
      )}
    </div>
  );
}
