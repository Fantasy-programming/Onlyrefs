import React, { useEffect, useMemo, useState, Suspense, useRef } from 'react';
import ReactDOM from 'react-dom';

import { useFileSelector } from './Board.hook';
import { useGridSize } from '@/state/hook';
import { searchExtended } from '@/lib/helper';
import { BoardProps } from './Board.types';

import { Input } from '../ui/input';
import { MasonryGrid } from '../MasonryGrid/MasonryGrid';
import { Progress } from '../ui/progress';
import { BoardItem, BoardItemSkeleton } from '../BoardItem/BoardItem';
import { Ref } from '@/lib/types';

import Logo from '@/assets/logo-bw.svg?react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { createLinkRef } from '@/lib/commands';

const Board: React.FC<BoardProps> = (props) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [link, setLink] = useState<string>('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [, dropFiles, progress] = useFileSelector();
  const [gridSize] = useGridSize();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const getRefs = () => {
    // props.refs might be a function (accessor) or an object with .latest (Solid resource), or an array
    if (typeof props.refs === 'function') return (props.refs as any)() ?? [];
    if (props.refs && typeof (props.refs as any).latest !== 'undefined')
      return (props.refs as any).latest ?? [];
    return (props.refs as any) ?? [];
  };

  const refs = useMemo(() => {
    const list = getRefs();
    return searchTerm !== '' ? searchExtended(list, searchTerm) : (list ?? []);
  }, [props.refs, searchTerm]);

  useEffect(() => {
    // on mount - set up drag and drop
    if (dropFiles) dropFiles(props.collection);
  }, [dropFiles, props.collection]);

  const handleCreation = async () => {
    if (link) {
      await createLinkRef(link, props.collection);
    }
    setDialogOpen(false);
  };

  // Use grid size as column count
  const columnCount = gridSize;

  return (
    <main className="flex h-full flex-col">
      <div className="py-10 ps-4 pe-10 md:px-10 md:pt-10 md:pb-0">
        <div className="mb-6 flex justify-between">
          {props.home && (
            <h1 className="text-primary-foreground text-4xl uppercase italic">
              {props.collection}
            </h1>
          )}
          <Input
            value={searchTerm}
            placeholder="Search your refs..."
            className="border-none font-serif text-3xl italic outline-none focus-visible:ring-0 focus-visible:ring-offset-0 md:text-4xl"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchTerm(e.target.value)
            }
          />
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 pt-4 pb-10 md:px-10"
      >
        {getRefs()?.length !== 0 ? (
          <MasonryGrid
            items={refs}
            columnCount={columnCount}
            gap={16}
            gridKey={`${props.collection}-${searchTerm}`}
            className={columnCount === 3 ? 'p-6' : ''}
            scrollContainerRef={scrollContainerRef}
            renderItem={(item: Ref, index: number) => (
              <Suspense
                key={item.metadata.id || index}
                fallback={<BoardItemSkeleton />}
              >
                <BoardItem refItem={item} />
              </Suspense>
            )}
          />
        ) : (
          <div className="relative h-full w-full">
            <div className="text-muted/80 absolute top-1/3 left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-5 text-center font-serif text-2xl md:text-3xl">
              <Logo className="h-36 w-36 stroke-transparent stroke-0 opacity-40 outline-0 md:h-64 md:w-64 dark:opacity-20" />
              <span className="opacity-80 dark:opacity-30">
                Drop or Save Reference file here to start
              </span>
            </div>
          </div>
        )}
      </div>

      {progress.total !== progress.completed &&
        ReactDOM.createPortal(
          <div className="fixed right-5 bottom-5 z-50 h-20 w-[300px] rounded-md bg-white text-black shadow-md">
            <Progress
              className="space-y-1 p-4"
              getValueLabel={() => 'Processing...'}
              value={progress.completed}
              max={progress.total}
            />
          </div>,
          document.body,
        )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add link</DialogTitle>
            <DialogDescription>
              Save this link to your collection
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-4 items-center gap-4 py-4">
            <Label htmlFor="link" className="text-right">
              Link
            </Label>
            <Input
              id="link"
              className="col-span-3"
              value={link}
              onChange={(e) => setLink((e.target as HTMLInputElement).value)}
            />
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleCreation}>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default Board;
