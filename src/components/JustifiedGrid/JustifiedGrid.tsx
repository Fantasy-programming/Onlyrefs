import React, { useMemo, memo } from 'react';
import { Ref, ImageRef } from '@/lib/types';

interface JustifiedGridProps {
  items: Ref[];
  targetRowHeight: number;
  gap?: number;
  renderItem: (item: Ref, index: number) => React.ReactNode;
}

interface RowItem {
  item: Ref;
  index: number;
  width: number;
  height: number;
}

interface Row {
  items: RowItem[];
  height: number;
}

// Get aspect ratio for an item
const getItemAspectRatio = (item: Ref): number => {
  if (item.metadata.ref_type === 'image') {
    const imageRef = item as ImageRef;
    if (imageRef.metadata.dimensions) {
      const [w, h] = imageRef.metadata.dimensions;
      if (w > 0 && h > 0) return w / h;
    }
  }
  // Default aspect ratios for different types
  switch (item.metadata.ref_type) {
    case 'video':
      return 16 / 9;
    case 'note':
      return 1;
    case 'link':
      return 4 / 3;
    case 'audio':
      return 2;
    case 'stack':
      return 1;
    default:
      return 1;
  }
};

// Calculate justified rows
const calculateRows = (
  items: Ref[],
  containerWidth: number,
  targetRowHeight: number,
  gap: number,
): Row[] => {
  const rows: Row[] = [];
  let currentRow: RowItem[] = [];
  let currentRowWidth = 0;

  items.forEach((item, index) => {
    const aspectRatio = getItemAspectRatio(item);
    const itemWidth = targetRowHeight * aspectRatio;

    currentRow.push({
      item,
      index,
      width: itemWidth,
      height: targetRowHeight,
    });
    currentRowWidth += itemWidth + (currentRow.length > 1 ? gap : 0);

    // Check if row is full
    if (currentRowWidth >= containerWidth) {
      // Calculate scale factor to fit exactly
      const totalGaps = (currentRow.length - 1) * gap;
      const availableWidth = containerWidth - totalGaps;
      const naturalWidth = currentRow.reduce((sum, i) => sum + i.width, 0);
      const scale = availableWidth / naturalWidth;

      // Apply scale to all items in row
      const scaledHeight = targetRowHeight * scale;
      const finalItems = currentRow.map((rowItem) => ({
        ...rowItem,
        width: rowItem.width * scale,
        height: scaledHeight,
      }));

      rows.push({ items: finalItems, height: scaledHeight });
      currentRow = [];
      currentRowWidth = 0;
    }
  });

  // Handle last incomplete row - don't scale up, keep natural height
  if (currentRow.length > 0) {
    rows.push({ items: currentRow, height: targetRowHeight });
  }

  return rows;
};

export const JustifiedGrid = memo<JustifiedGridProps>(
  ({ items, targetRowHeight, gap = 12, renderItem }) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = React.useState(0);

    // Observe container width
    React.useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const observer = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry) {
          setContainerWidth(entry.contentRect.width);
        }
      });

      observer.observe(container);
      return () => observer.disconnect();
    }, []);

    // Calculate rows based on container width
    const rows = useMemo(() => {
      if (containerWidth === 0) return [];
      return calculateRows(items, containerWidth, targetRowHeight, gap);
    }, [items, containerWidth, targetRowHeight, gap]);

    return (
      <div ref={containerRef} className="w-full">
        {rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="flex"
            style={{
              gap: `${gap}px`,
              marginBottom: `${gap}px`,
            }}
          >
            {row.items.map((rowItem) => (
              <div
                key={rowItem.item.metadata.id}
                style={{
                  width: `${rowItem.width}px`,
                  height: `${rowItem.height}px`,
                  flexShrink: 0,
                }}
              >
                <div className="h-full w-full overflow-hidden">
                  {renderItem(rowItem.item, rowItem.index)}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  },
);

JustifiedGrid.displayName = 'JustifiedGrid';

export default JustifiedGrid;
