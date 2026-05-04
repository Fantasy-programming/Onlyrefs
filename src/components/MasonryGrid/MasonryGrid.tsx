import {
  ReactNode,
  useMemo,
  useCallback,
  memo,
  useState,
  useEffect,
  useRef,
  RefObject,
} from 'react';
import {
  usePositioner,
  useResizeObserver,
  useMasonry,
  useInfiniteLoader,
} from 'masonic';
import { useWindowSize } from '@/lib/helper';

interface MasonryGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  columnCount?: number;
  gap?: number;
  className?: string;
  gridKey?: string;
  scrollContainerRef?: RefObject<HTMLElement | null>;
}

interface MasonryItem<T> {
  id: string;
  data: T;
  index: number;
}

function MasonryGridComponent<T extends { metadata?: { id?: string } }>({
  items,
  renderItem,
  columnCount = 4,
  gap = 16,
  className = '',
  gridKey,
  scrollContainerRef,
}: MasonryGridProps<T>) {
  const [windowWidth, windowHeight] = useWindowSize();
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Track scroll position and container dimensions from scroll container
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [containerHeight, setContainerHeight] = useState(windowHeight);
  const [containerWidth, setContainerWidth] = useState(0);
  const scrollTimeoutRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  // Process and filter items
  const allItems = useMemo((): MasonryItem<T>[] => {
    if (!items || !Array.isArray(items)) return [];

    return items
      .filter((item): item is T => {
        return (
          item != null &&
          typeof item === 'object' &&
          item.metadata != null &&
          typeof item.metadata.id === 'string' &&
          item.metadata.id.length > 0
        );
      })
      .map((item, index) => ({
        id: item.metadata!.id!,
        data: item,
        index,
      }));
  }, [items]);

  // Calculate responsive column count
  const responsiveColumnCount = useMemo(() => {
    if (windowWidth < 640) return 1;
    if (windowWidth < 768) return 2;
    if (windowWidth < 1024) return Math.min(3, columnCount);
    if (windowWidth < 1280) return Math.min(4, columnCount);
    return columnCount;
  }, [windowWidth, columnCount]);

  // Create positioner - use containerWidth from scroll container, recreate when key changes
  const positioner = usePositioner(
    {
      width: containerWidth || windowWidth,
      columnWidth: 200,
      columnGutter: gap,
      rowGutter: gap,
      columnCount: responsiveColumnCount,
      maxColumnCount: columnCount,
    },
    [gridKey, responsiveColumnCount, containerWidth],
  );

  // Create resize observer
  const resizeObserver = useResizeObserver(positioner);

  // Set up scroll tracking on the scroll container
  useEffect(() => {
    const scrollContainer = scrollContainerRef?.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      // RAF throttling to prevent excessive re-renders
      if (rafRef.current) return;

      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        setScrollTop(scrollContainer.scrollTop);
        setIsScrolling(true);

        // Clear existing timeout
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }

        // Set isScrolling to false after scrolling stops
        scrollTimeoutRef.current = window.setTimeout(() => {
          setIsScrolling(false);
        }, 150);
      });
    };

    const handleResize = () => {
      setContainerHeight(scrollContainer.offsetHeight);
      // Account for padding by measuring actual scrollable content width
      const computedStyle = window.getComputedStyle(scrollContainer);
      const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
      const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
      const contentWidth =
        scrollContainer.clientWidth - paddingLeft - paddingRight;
      setContainerWidth(contentWidth);
    };

    // Initial values
    setScrollTop(scrollContainer.scrollTop);
    setContainerHeight(scrollContainer.offsetHeight);
    // Account for padding on initial measurement
    const computedStyle = window.getComputedStyle(scrollContainer);
    const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
    const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
    const contentWidth =
      scrollContainer.clientWidth - paddingLeft - paddingRight;
    setContainerWidth(contentWidth);

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    // Use ResizeObserver for container size changes
    const resizeObs = new ResizeObserver(handleResize);
    resizeObs.observe(scrollContainer);

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      resizeObs.disconnect();
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [scrollContainerRef]);

  // Stable render function for masonry items
  const MasonryCard = useCallback(
    ({ data }: { data: MasonryItem<T>; width: number }) => {
      return <>{renderItem(data.data, data.index)}</>;
    },
    [renderItem],
  );

  // Use masonic's infinite loader
  const maybeLoadMore = useInfiniteLoader(
    async () => {
      // All items are already loaded in memory, masonic handles virtualization
    },
    {
      isItemLoaded: (index) => index < allItems.length,
      totalItems: allItems.length,
    },
  );

  // Use the masonry hook with custom scroll container values
  const masonryElement = useMasonry({
    positioner,
    resizeObserver,
    items: allItems,
    height: containerHeight,
    scrollTop: scrollTop,
    isScrolling,
    overscanBy: 2,
    render: MasonryCard,
    onRender: maybeLoadMore,
    itemKey: (data) => data.id,
    containerRef,
  });

  // Don't render if no valid items
  if (allItems.length === 0) {
    return <div className={className} />;
  }

  return (
    <div className={className} style={{ maxWidth: '100%', width: '100%' }}>
      {masonryElement}
    </div>
  );
}

export const MasonryGrid = memo(MasonryGridComponent, (prev, next) => {
  return (
    prev.items === next.items &&
    prev.columnCount === next.columnCount &&
    prev.gridKey === next.gridKey &&
    prev.gap === next.gap &&
    prev.scrollContainerRef === next.scrollContainerRef
  );
}) as typeof MasonryGridComponent;

export default MasonryGrid;
