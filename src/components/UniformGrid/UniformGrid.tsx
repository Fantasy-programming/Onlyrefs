import React, { memo } from 'react';
import { Ref } from '@/lib/types';

interface UniformGridProps {
  items: Ref[];
  cellSize: number;
  gap?: number;
  renderItem: (item: Ref, index: number) => React.ReactNode;
}

export const UniformGrid = memo<UniformGridProps>(
  ({ items, cellSize, gap = 12, renderItem }) => {
    return (
      <div
        className="grid w-full"
        style={{
          gridTemplateColumns: `repeat(auto-fill, minmax(${cellSize}px, 1fr))`,
          gap: `${gap}px`,
        }}
      >
        {items.map((item, index) => (
          <div
            key={item.metadata.id}
            className="overflow-hidden"
            style={{ aspectRatio: '1' }}
          >
            <div className="h-full w-full [&_img]:h-full [&_img]:w-full [&_img]:object-cover [&_video]:h-full [&_video]:w-full [&_video]:object-cover [&>div]:h-full [&>div]:w-full">
              {renderItem(item, index)}
            </div>
          </div>
        ))}
      </div>
    );
  },
);

UniformGrid.displayName = 'UniformGrid';

export default UniformGrid;
