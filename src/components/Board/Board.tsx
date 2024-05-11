import { onMount, Show, createSignal, createMemo, Suspense } from 'solid-js';
import { Portal } from 'solid-js/web';

import { useFileSelector } from './Board.hook';
import { gridSizeHook } from '~/state/hook';
import { getBreakpoints, searchExtended } from '~/lib/helper';
import { BoardProps } from './Board.types';

import { Input } from '../ui/input';
import { Mason } from '../Mason';
import { Progress, ProgressValueLabel } from '../ui/progress';
import { BoardItem, BoardItemSkeleton } from '../BoardItem/BoardItem';
import { NewNote } from '../BoardItem/BoardNoteItem';

import Logo from '~/assets/logo-bw.svg';

const Board = (props: BoardProps) => {
  const [boardRefs, setBoardRefs] = createSignal(props.refs);
  const [searching, setSearching] = createSignal(false);

  const [, dropFiles, progress] = useFileSelector;
  const [gridSize] = gridSizeHook;

  const breakPoints = createMemo(() => getBreakpoints(gridSize()));

  onMount(() => {
    dropFiles(props.collection);
  });

  return (
    <main class="h-full py-10 pe-10 ps-4 md:p-10">
      <div class="mb-12 flex justify-between">
        <Show when={props.home}>
          <h1 class="text-4xl uppercase italic text-primary-foreground">
            {props.collection}
          </h1>
        </Show>
        <Input
          placeholder="Search your refs..."
          class="border-none font-serif text-3xl italic outline-none focus-visible:ring-0 focus-visible:ring-offset-0 md:text-4xl"
          oninput={(e) => {
            const value = e.target.value;
            if (!Boolean(value)) {
              setBoardRefs(props.refs);
              setSearching(false);
              return;
            }
            setBoardRefs(searchExtended(props.refs, value));
            if (!searching()) setSearching(true);
          }}
        />
      </div>
      <Show
        when={props.refs.length !== 0}
        fallback={
          <div class="relative h-full w-full">
            <div class="absolute left-1/2 top-1/3 flex -translate-x-1/2  -translate-y-1/2 flex-col items-center justify-center gap-5 text-center font-serif text-2xl text-muted/80 md:text-3xl">
              <Logo class="h-36 w-36 stroke-transparent stroke-0 opacity-40 outline-0 dark:opacity-20 md:h-64 md:w-64" />
              <span class="opacity-80 dark:opacity-30">
                Drop or Save Reference file here to start
              </span>
            </div>
          </div>
        }
      >
        <Mason
          classList={{
            'h-full': true,
            'p-6': breakPoints()() === 3,
            'p-8': breakPoints()() === 4,
            'p-10': breakPoints()() === 5,
            'p-12': breakPoints()() === 6,
          }}
          pre={!searching() ? [NewNote] : []}
          items={boardRefs()}
          gap={20}
          columns={breakPoints()()}
        >
          {(item) => (
            <Suspense fallback={<BoardItemSkeleton />}>
              {typeof item === 'object' && item !== null ? (
                <BoardItem refItem={item} />
              ) : (
                item()
              )}
            </Suspense>
          )}
        </Mason>
      </Show>
      <Show when={progress().total !== progress().completed}>
        <Portal>
          <div class="fixed bottom-5 right-5 h-20 w-[300px] rounded-md bg-white text-black shadow-md">
            <Progress
              class="space-y-1 p-4"
              minValue={0}
              getValueLabel={() => 'Processing...'}
              value={progress().completed}
              maxValue={progress().total}
            >
              <ProgressValueLabel class="text-black" />
            </Progress>
          </div>
        </Portal>
      </Show>
    </main>
  );
};

export default Board;
