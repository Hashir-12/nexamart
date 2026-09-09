import React from 'react';

interface RatingProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
}

export const Rating: React.FC<RatingProps> = ({ value, max = 5, size = 'md', showNumber = true }) => {
  const fullStars = Math.floor(value);
  const halfStar = value % 1 >= 0.5;
  const emptyStars = max - fullStars - (halfStar ? 1 : 0);

  const starSize = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }[size];

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[...Array(fullStars)].map((_, i) => (
          <span key={`full-${i}`} className={`${starSize} text-yellow-400`}>★</span>
        ))}
        {halfStar && <span className={`${starSize} text-yellow-400`}>★</span>}
        {[...Array(emptyStars)].map((_, i) => (
          <span key={`empty-${i}`} className={`${starSize} text-gray-300`}>★</span>
        ))}
      </div>
      {showNumber && <span className="text-sm text-gray-600 ml-1">{value.toFixed(1)}</span>}
    </div>
  );
};