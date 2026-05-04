import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingStarsProps {
  rating: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  onChange,
  readonly = false,
  size = 'sm',
  className,
}) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const sizeClasses = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const handleClick = (index: number) => {
    if (readonly || !onChange) return;
    // Clicking on the same star toggles it off (sets rating to index)
    // If already at this rating, clear it
    const newRating = rating === index + 1 ? 0 : index + 1;
    onChange(newRating);
  };

  const displayRating = hoverRating !== null ? hoverRating : rating;

  return (
    <div
      className={cn('flex items-center gap-0.5', className)}
      onMouseLeave={() => !readonly && setHoverRating(null)}
    >
      {[0, 1, 2, 3, 4].map((index) => {
        const isFilled = index < displayRating;
        return (
          <button
            key={index}
            type="button"
            disabled={readonly}
            onClick={() => handleClick(index)}
            onMouseEnter={() => !readonly && setHoverRating(index + 1)}
            className={cn(
              'transition-colors focus:outline-none',
              !readonly && 'cursor-pointer hover:scale-110',
              readonly && 'cursor-default',
            )}
          >
            <Star
              className={cn(
                sizeClasses[size],
                'transition-colors',
                isFilled
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-muted-foreground/40 fill-transparent',
              )}
            />
          </button>
        );
      })}
    </div>
  );
};

export default RatingStars;
