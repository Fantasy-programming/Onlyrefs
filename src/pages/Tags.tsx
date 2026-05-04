import { useMemo, useState, useRef } from 'react';
import { useRefSelector } from '@/state/refstore';
import { BoardItem } from '@/components/BoardItem/BoardItem';
import { MasonryGrid } from '@/components/MasonryGrid/MasonryGrid';
import { FiTag } from 'react-icons/fi';
import { cn } from '@/lib/utils';
import { Ref } from '@/lib/types';

const Tags = () => {
  const { ref: refs } = useRefSelector();
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Extract all unique tags and count items per tag
  const tagStats = useMemo(() => {
    const stats = new Map<string, number>();
    refs.forEach((item) => {
      if (item?.metadata?.tags) {
        item.metadata.tags.forEach((tag) => {
          stats.set(tag, (stats.get(tag) || 0) + 1);
        });
      }
    });
    return Array.from(stats.entries())
      .sort((a, b) => b[1] - a[1]) // Sort by count descending
      .map(([tag, count]) => ({ tag, count }));
  }, [refs]);

  // Filter refs by selected tag
  const filteredRefs = useMemo(() => {
    if (!selectedTag) return [];
    return refs.filter(
      (item) =>
        item?.metadata?.tags && item.metadata.tags.includes(selectedTag),
    );
  }, [refs, selectedTag]);

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="border-border/40 bg-background/95 sticky top-0 z-10 border-b px-6 py-4 backdrop-blur-sm">
        <h1 className="text-xl font-semibold">Tags</h1>
        <p className="text-muted-foreground text-sm">
          {tagStats.length} tags across {refs.length} items
        </p>
      </div>

      <div className="flex h-[calc(100%-73px)]">
        {/* Tag List */}
        <div className="border-border/40 w-64 flex-shrink-0 overflow-y-auto border-r p-4">
          <div className="space-y-1">
            {tagStats.map(({ tag, count }) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
                  tag === selectedTag
                    ? 'bg-foreground text-background'
                    : 'hover:bg-muted/30',
                )}
              >
                <span className="flex items-center gap-2">
                  <FiTag className="h-4 w-4" />
                  {tag}
                </span>
                <span
                  className={cn(
                    'text-xs',
                    tag === selectedTag
                      ? 'text-background/70'
                      : 'text-muted-foreground',
                  )}
                >
                  {count}
                </span>
              </button>
            ))}

            {tagStats.length === 0 && (
              <div className="text-muted-foreground py-8 text-center text-sm">
                No tags yet. Add tags to your items to organize them.
              </div>
            )}
          </div>
        </div>

        {/* Tag Content */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6">
          {selectedTag ? (
            <>
              <div className="mb-4">
                <h2 className="text-lg font-medium">{selectedTag}</h2>
                <p className="text-muted-foreground text-sm">
                  {filteredRefs.length} items
                </p>
              </div>
              <MasonryGrid
                items={filteredRefs}
                columnCount={4}
                gap={16}
                gridKey={selectedTag || 'none'}
                scrollContainerRef={scrollContainerRef}
                renderItem={(item: Ref) => <BoardItem refItem={item} />}
              />
            </>
          ) : (
            <div className="text-muted-foreground flex h-full items-center justify-center">
              Select a tag to view items
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tags;
