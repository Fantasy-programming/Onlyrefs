import {
  onMount,
  Show,
  createSignal,
  createEffect,
  createMemo,
  on,
  Suspense,
} from 'solid-js';
import { Portal } from 'solid-js/web';

import { useFileSelector } from './Board.hook';
import { gridSizeHook } from '~/state/hook';
import { useRefSelector } from '~/state/store';
import { getBreakpoints, searchByText } from '~/lib/helper';
import { BoardProps } from './Board.types';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Mason } from '../Mason';
import { Progress, ProgressValueLabel } from '../ui/progress';
import { BoardItem, BoardItemSkeleton } from '../BoardItem/BoardItem';
import { NewNote } from '../BoardItem/BoardNoteItem';
import Logo from '~/assets/logo-bw.svg';

const Board = (props: BoardProps) => {
  const [boardRefs, setBoardRefs] = createSignal(props.refs);
  const [searching, setSearching] = createSignal(false);

  const [selectFiles, dropFiles, progress] = useFileSelector;
  const [gridSize] = gridSizeHook;
  const root = useRefSelector();

  const breakPoints = createMemo(() => getBreakpoints(gridSize()));

  createEffect(
    on(progress, async () => {
      await root.refetchRefs();
    }),
  );

  onMount(() => {
    dropFiles(props.collection);
  });

  return (
    <main class="h-screen w-full pt-10">
      <div class="mb-12 flex justify-between">
        <Show when={props.home}>
          <h1 class="text-4xl uppercase italic text-primary-foreground">
            {props.collection}
          </h1>
        </Show>
        <Button
          variant="default"
          size="lg"
          onclick={() => selectFiles(props.collection)}
          class="hidden md:inline-flex"
        >
          Save
        </Button>
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
            setBoardRefs(searchByText(props.refs, value));
            if (!searching()) setSearching(true);
          }}
        />
      </div>
      <Show
        when={props.refs.length !== 0}
        fallback={
          <div class="flex h-3/4  w-full  flex-col items-center justify-center gap-5 text-center font-serif text-2xl text-muted/50 md:text-4xl">
            <Logo class="h-36 w-36 opacity-40 dark:opacity-10 md:h-64 md:w-64 " />
            <span class="opacity-80 dark:opacity-30">
              Drop or Save Reference file here to start
            </span>
          </div>
        }
      >
        <Mason
          as="section"
          class="relative h-full w-full"
          pre={!searching() ? [NewNote] : []}
          items={boardRefs()}
          gap={20}
          columns={breakPoints()()}
        >
          {(item, index) => (
            <Suspense fallback={<BoardItemSkeleton index={index()} />}>
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
              value={progress().total - progress().completed}
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
