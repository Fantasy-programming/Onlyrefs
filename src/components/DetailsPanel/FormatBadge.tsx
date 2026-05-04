import React from 'react';
import { cn } from '@/lib/utils';

interface FormatBadgeProps {
  format: string;
  className?: string;
}

// Extract file extension from format/media_type
const getDisplayFormat = (format: string): string => {
  // Handle media types like "image/png" or "video/mp4"
  if (format.includes('/')) {
    const ext = format.split('/')[1];
    return ext.toUpperCase();
  }
  // Handle file extensions like ".png" or "png"
  const ext = format.replace(/^\./, '');
  return ext.toUpperCase();
};

export const FormatBadge: React.FC<FormatBadgeProps> = ({
  format,
  className,
}) => {
  const displayFormat = getDisplayFormat(format);

  return (
    <div
      className={cn(
        'absolute top-2 left-2 z-10 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm',
        className,
      )}
    >
      {displayFormat}
    </div>
  );
};

export default FormatBadge;
