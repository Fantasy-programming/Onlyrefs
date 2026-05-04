import React, { useMemo } from 'react';
import { useRefStore } from '@/state/refstore';
import { toAssetUrl } from '@/lib/helper';
import { Ref, ImageRef, LinkRef } from '@/lib/types';

interface BoardListProps {
  boards: string[];
}

interface BoardCardProps {
  board: string;
  refs: Ref[];
}

// Get a thumbnail URL for a ref item
const getRefThumbnail = (ref: Ref): string | null => {
  switch (ref.metadata.ref_type) {
    case 'image':
      return toAssetUrl((ref as ImageRef).low_res_imagepath);
    case 'video':
      // Videos don't have thumbnails in this schema, use a placeholder
      return null;
    case 'link':
      return toAssetUrl((ref as LinkRef).snapshoot);
    default:
      return null;
  }
};

// Photo stack card for a board
const BoardCard: React.FC<BoardCardProps> = ({ board, refs }) => {
  // Get up to 4 refs with thumbnails for the stack
  const stackRefs = useMemo(() => {
    return refs.filter((ref) => getRefThumbnail(ref) !== null).slice(0, 4);
  }, [refs]);

  // Stack positions - shuffled photo look
  const stackPositions = [
    { rotate: -6, x: -8, y: 4, z: 4 },
    { rotate: 4, x: 6, y: -3, z: 3 },
    { rotate: -2, x: -3, y: 2, z: 2 },
    { rotate: 0, x: 0, y: 0, z: 1 },
  ];

  return (
    <a
      href={`/boards/${encodeURIComponent(board)}`}
      className="group relative block h-[280px] w-full max-w-[280px]"
    >
      {/* Photo stack container */}
      <div className="relative h-[220px] w-full">
        {stackRefs.length > 0 ? (
          // Render stacked photos
          stackRefs.map((ref, index) => {
            const pos = stackPositions[index] || stackPositions[3];
            const thumbnail = getRefThumbnail(ref);

            return (
              <div
                key={ref.metadata.id}
                className="absolute top-1/2 left-1/2 h-[180px] w-[160px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg border-4 border-white bg-white shadow-lg transition-all duration-300 group-hover:shadow-xl dark:border-neutral-800 dark:bg-neutral-800"
                style={{
                  transform: `translate(-50%, -50%) rotate(${pos.rotate}deg) translateX(${pos.x}px) translateY(${pos.y}px)`,
                  zIndex: pos.z,
                }}
              >
                {thumbnail && (
                  <img
                    src={thumbnail}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                )}
              </div>
            );
          })
        ) : (
          // Empty board placeholder
          <div className="border-muted-foreground/30 bg-muted/20 absolute top-1/2 left-1/2 flex h-[180px] w-[160px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-lg border-4 border-dashed">
            <span className="text-muted-foreground text-sm">Empty</span>
          </div>
        )}
      </div>

      {/* Board name */}
      <div className="mt-4 text-center">
        <h3 className="text-primary-foreground group-hover:text-primary text-lg font-medium uppercase italic transition-colors">
          {board}
        </h3>
        <p className="text-muted-foreground mt-1 text-sm">
          {refs.length} {refs.length === 1 ? 'item' : 'items'}
        </p>
      </div>
    </a>
  );
};

const BoardList: React.FC<BoardListProps> = ({ boards }) => {
  const allRefs = useRefStore((state) => state.refs);

  // Group refs by board
  const refsByBoard = useMemo(() => {
    const grouped: Record<string, Ref[]> = {};
    for (const board of boards) {
      grouped[board] = allRefs.filter((ref) => ref.metadata.board_id === board);
    }
    return grouped;
  }, [allRefs, boards]);

  return (
    <main className="grid grid-cols-2 gap-8 pb-20 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {boards.map((board) => (
        <BoardCard key={board} board={board} refs={refsByBoard[board] || []} />
      ))}
    </main>
  );
};

export default BoardList;
