import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  CSSProperties,
  ReactNode,
} from 'react';
import { FixedSizeList as List } from 'react-window';

interface MasonryBreakpoint {
  query: string;
  columns: number;
}

interface MasonryProps<Data, PreData = Data> {
  as?: keyof JSX.IntrinsicElements;
  columns: number;
  items?: Data[] | null | undefined;
  pre?: PreData[] | null | undefined;
  children: (item: Data | PreData, index: number) => ReactNode;
  style?: CSSProperties;
  gap?: number;
  height?: number;
  itemHeight?: number;
  className?: string;
}

// Helper functions
function getShortestColumn(columns: number[]): number {
  let min = 0;
  let record = Number.MAX_SAFE_INTEGER;

  for (let i = 0, len = columns.length; i < len; i += 1) {
    if (columns[i] < record) {
      record = columns[i];
      min = i;
    }
  }

  return min;
}

function getLongestColumn(columns: number[]): number {
  let max = 0;
  let record = 0;

  for (let i = 0, len = columns.length; i < len; i += 1) {
    if (columns[i] > record) {
      record = columns[i];
      max = i;
    }
  }

  return max;
}

function getContentWidth(el: HTMLElement): number {
  const styles = getComputedStyle(el);
  return (
    el.clientWidth -
    parseFloat(styles.paddingLeft) -
    parseFloat(styles.paddingRight)
  );
}

// Custom hook for masonry breakpoints
export function useMasonryBreakpoints(
  breakpoints: MasonryBreakpoint[],
  defaultColumns = 1,
): number {
  const [columns, setColumns] = useState(defaultColumns);

  useEffect(() => {
    const mediaQueries = breakpoints.map(({ query, columns: cols }) => {
      const mediaQuery = window.matchMedia(query);
      
      const handleChange = () => {
        if (mediaQuery.matches) {
          setColumns(cols);
        }
      };

      handleChange(); // Initial check
      mediaQuery.addEventListener('change', handleChange);
      
      return { mediaQuery, handleChange };
    });

    return () => {
      mediaQueries.forEach(({ mediaQuery, handleChange }) => {
        mediaQuery.removeEventListener('change', handleChange);
      });
    };
  }, [breakpoints]);

  return columns;
}

// Masonry item component
interface MasonryItemProps {
  index: number;
  style: CSSProperties;
  data: {
    items: any[];
    children: (item: any, index: number) => ReactNode;
    columns: number;
    gap: number;
    containerWidth: number;
    columnHeights: number[];
  };
}

function MasonryItem({ index, style, data }: MasonryItemProps) {
  const { items, children, columns, gap, containerWidth } = data;
  const item = items[index];
  const widthPerColumn = containerWidth / columns;
  
  // Calculate position based on shortest column
  const targetColumn = getShortestColumn(data.columnHeights);
  const left = targetColumn * widthPerColumn + (targetColumn > 0 ? targetColumn * gap : 0);
  const top = data.columnHeights[targetColumn];

  // Update column height (this is a simplified approach)
  const estimatedHeight = 200; // You might want to make this dynamic
  data.columnHeights[targetColumn] += estimatedHeight + gap;

  const itemStyle: CSSProperties = {
    ...style,
    position: 'absolute',
    left: `${left}px`,
    top: `${top}px`,
    width: `${widthPerColumn}px`,
  };

  return (
    <div style={itemStyle}>
      {children(item, index)}
    </div>
  );
}

// Main Masonry component
export function Masonry<Data, PreData = Data>({
  as: Component = 'div',
  columns,
  items = [],
  pre = [],
  children,
  style,
  gap = 0,
  height = 600,
  itemHeight = 200,
  className,
  ...props
}: MasonryProps<Data, PreData>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [columnHeights, setColumnHeights] = useState<number[]>(new Array(columns).fill(0));

  // Combined items
  const allItems = useMemo(() => [...(pre || []), ...(items || [])], [pre, items]);

  // Update container width on resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const width = getContentWidth(containerRef.current);
        setContainerWidth(width);
      }
    };

    updateWidth();
    
    let timeoutId: number;
    const debouncedResize = () => {
      cancelAnimationFrame(timeoutId);
      timeoutId = requestAnimationFrame(updateWidth);
    };

    window.addEventListener('resize', debouncedResize);
    return () => {
      window.removeEventListener('resize', debouncedResize);
      cancelAnimationFrame(timeoutId);
    };
  }, []);

  // Reset column heights when columns change
  useEffect(() => {
    setColumnHeights(new Array(columns).fill(0));
  }, [columns]);

  // Calculate total height based on longest column
  const totalHeight = useMemo(() => {
    if (columnHeights.length === 0) return height;
    const maxHeight = Math.max(...columnHeights);
    return Math.max(maxHeight, height);
  }, [columnHeights, height]);

  const masonryStyle: CSSProperties = {
    position: 'relative',
    width: '100%',
    maxWidth: '100%',
    height: totalHeight,
    ...style,
  };

  // Render function for react-window
  const renderItem = useCallback(
    (itemProps: any) => (
      <MasonryItem
        {...itemProps}
        data={{
          items: allItems,
          children,
          columns,
          gap,
          containerWidth,
          columnHeights: [...columnHeights],
        }}
      />
    ),
    [allItems, children, columns, gap, containerWidth, columnHeights]
  );

  if (containerWidth === 0) {
    return (
      <Component
        ref={containerRef}
        style={masonryStyle}
        className={className}
        {...props}
      />
    );
  }

  return (
    <Component
      ref={containerRef}
      style={masonryStyle}
      className={className}
      {...props}
    >
      <List
        height={totalHeight}
        itemCount={allItems.length}
        itemSize={itemHeight}
        width="100%"
      >
        {renderItem}
      </List>
    </Component>
  );
}

// Alternative non-virtualized version for smaller lists
export function SimpleMasonry<Data, PreData = Data>({
  as: Component = 'div',
  columns,
  items = [],
  pre = [],
  children,
  style,
  gap = 0,
  className,
  ...props
}: Omit<MasonryProps<Data, PreData>, 'height' | 'itemHeight'>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [itemElements, setItemElements] = useState<HTMLElement[]>([]);

  const allItems = useMemo(() => [...(pre || []), ...(items || [])], [pre, items]);

  // Layout calculation
  const layoutItems = useMemo(() => {
    if (containerWidth === 0 || allItems.length === 0) return [];

    const columnHeights = new Array(columns).fill(0);
    const widthPerColumn = containerWidth / columns;
    
    return allItems.map((item, index) => {
      const targetColumn = getShortestColumn(columnHeights);
      const left = targetColumn * widthPerColumn + (targetColumn > 0 ? targetColumn * gap : 0);
      const top = columnHeights[targetColumn];
      
      // Estimate height (you might want to measure actual height)
      const estimatedHeight = itemElements[index]?.offsetHeight || 200;
      columnHeights[targetColumn] += estimatedHeight + gap;

      return {
        item,
        index,
        style: {
          position: 'absolute' as const,
          left: `${left}px`,
          top: `${top}px`,
          width: `${widthPerColumn}px`,
        },
      };
    });
  }, [allItems, columns, containerWidth, gap, itemElements]);

  const totalHeight = useMemo(() => {
    if (layoutItems.length === 0) return 0;
    const columnHeights = new Array(columns).fill(0);
    layoutItems.forEach(({ style }) => {
      const top = parseFloat(style.top as string);
      const estimatedHeight = 200; // You might want to make this dynamic
      const column = Math.floor(parseFloat(style.left as string) / (containerWidth / columns));
      columnHeights[column] = Math.max(columnHeights[column], top + estimatedHeight);
    });
    return Math.max(...columnHeights);
  }, [layoutItems, columns, containerWidth]);

  // Update container width on resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const width = getContentWidth(containerRef.current);
        setContainerWidth(width);
      }
    };

    updateWidth();
    
    let timeoutId: number;
    const debouncedResize = () => {
      cancelAnimationFrame(timeoutId);
      timeoutId = requestAnimationFrame(updateWidth);
    };

    window.addEventListener('resize', debouncedResize);
    return () => {
      window.removeEventListener('resize', debouncedResize);
      cancelAnimationFrame(timeoutId);
    };
  }, []);

  const masonryStyle: CSSProperties = {
    position: 'relative',
    width: '100%',
    maxWidth: '100%',
    height: `${totalHeight}px`,
    ...style,
  };

  return (
    <Component
      ref={containerRef}
      style={masonryStyle}
      className={className}
      {...props}
    >
      {layoutItems.map(({ item, index, style: itemStyle }) => (
        <div
          key={index}
          style={itemStyle}
          ref={(el) => {
            if (el) {
              const newElements = [...itemElements];
              newElements[index] = el;
              setItemElements(newElements);
            }
          }}
        >
          {children(item, index)}
        </div>
      ))}
    </Component>
  );
}

export default Masonry;
