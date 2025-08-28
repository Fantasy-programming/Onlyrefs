import React, { useEffect, useMemo, useState, Suspense } from 'react';
import ReactDOM from 'react-dom';

import { useFileSelector } from './Board.hook';
import { useGridSize } from '@/state/hook';
import { getBreakpoints, searchExtended } from '@/lib/helper';
import { BoardProps } from './Board.types';

import { Input } from '../ui/input';
import { Masonry } from '../Mason'; // Updated import
import { Progress } from '../ui/progress';
import { BoardItem, BoardItemSkeleton } from '../BoardItem/BoardItem';
import { NewNote } from '../BoardItem/BoardNoteItem';

import Logo from '@/assets/logo-bw.svg';
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
  const [selectF, dropFiles, progress] = useFileSelector as any;
  const [gridSize] = useGridSize();

  const breakPoints = useMemo(() => getBreakpoints(gridSize), [gridSize]);

  const getRefs = () => {
    // props.refs might be a function (accessor) or an object with .latest (Solid resource), or an array
    if (typeof props.refs === 'function') return (props.refs as any)() ?? [];
    if (props.refs && typeof (props.refs as any).latest !== 'undefined') return (props.refs as any).latest ?? [];
    return (props.refs as any) ?? [];
  };

  const refs = useMemo(() => {
    const list = getRefs();
    return searchTerm !== '' ? searchExtended(list, searchTerm) : list ?? [];
  }, [props.refs, searchTerm]);

  useEffect(() => {
    // on mount
    if (dropFiles) dropFiles(props.collection);

    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        if (selectF) selectF(props.collection);
      }
      if (e.ctrlKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setDialogOpen(true);
      }
    };

    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [dropFiles, selectF, props.collection]);

  const handleCreation = async () => {
    if (link) {
      await createLinkRef(link, props.collection);
    }
    setDialogOpen(false);
  };

  const progressValue = () => (typeof progress === 'function' ? progress() : progress) || { total: 0, completed: 0 };

  // Get the column count - handle both function and direct value cases
  const getColumnCount = () => {
    if (typeof breakPoints === 'function') {
      const bp = breakPoints();
      return typeof bp === 'function' ? bp() : bp;
    }
    return breakPoints as number;
  };

  const columnCount = getColumnCount();

  return (
    <main className="h-full py-10 pe-10 ps-4 md:p-10">
      <div className="mb-12 flex justify-between">
        {props.home && (
          <h1 className="text-4xl uppercase italic text-primary-foreground">{props.collection}</h1>
        )}
        <Input
          value={searchTerm}
          placeholder="Search your refs..."
          className="border-none font-serif text-3xl italic outline-none focus-visible:ring-0 focus-visible:ring-offset-0 md:text-4xl"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
        />
      </div>

      {getRefs()?.length !== 0 ? (
        <Masonry
          className={columnCount === 3 ? 'p-6' : ''}
          pre={searchTerm === '' ? [NewNote] : []}
          items={refs}
          gap={20}
          columns={columnCount}
          height={800} // Container height for virtualization
          itemHeight={300} // Estimated item height
        >
          {(item: any, index: number) => (
            <Suspense key={index} fallback={<BoardItemSkeleton />}>
              {typeof item === 'object' && item !== null ? <BoardItem refItem={item} /> : item}
            </Suspense>
          )}
        </Masonry>
      ) : (
        <div className="relative h-full w-full">
          <div className="absolute left-1/2 top-1/3 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-5 text-center font-serif text-2xl text-muted/80 md:text-3xl">
            <Logo className="h-36 w-36 stroke-transparent stroke-0 opacity-40 outline-0 dark:opacity-20 md:h-64 md:w-64" />
            <span className="opacity-80 dark:opacity-30">Drop or Save Reference file here to start</span>
          </div>
        </div>
      )}

      {progressValue().total !== progressValue().completed && ReactDOM.createPortal(
        <div className="fixed bottom-5 right-5 h-20 w-[300px] rounded-md bg-white text-black shadow-md">
          <Progress className="space-y-1 p-4" getValueLabel={() => 'Processing...'} value={progressValue().completed} max={progressValue().total} />
        </div>,
        document.body,
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add link</DialogTitle>
            <DialogDescription>Save this link to your collection</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-4 items-center gap-4 py-4">
            <Label htmlFor="link" className="text-right">
              Link
            </Label>
            <Input id="link" className="col-span-3" value={link} onChange={(e) => setLink((e.target as HTMLInputElement).value)} />
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
