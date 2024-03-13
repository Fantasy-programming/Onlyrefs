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

const Board = ({ collection, home, refs }: BoardProps) => {
  // TODO: Make this dude rerender
  const [selectFiles, dropFiles, progress] = useFileSelector();
  const [boardRefs, setBoardRefs] = createSignal(refs);
  const [gridSize] = gridSizeHook();
  const breakPoints = createMemo(() => getBreakpoints(gridSize()));
  const {
    refService: { refetchRefs },
  } = useRefSelector();

  createEffect(
    on(progress, async () => {
      await refetchRefs();
    }),
  );

  onMount(() => {
    dropFiles(collection);
  });

  return (
    <main class="h-screen w-full pt-16">
      <div class="mb-8 flex justify-between">
        <Show when={home}>
          <h1 class="text-4xl uppercase italic text-primary-foreground">
            {collection}
          </h1>
        </Show>
        <Button
          variant="default"
          size="lg"
          onclick={() => selectFiles(collection)}
        >
          Save
        </Button>
        <Input
          placeholder="Search your refs..."
          class="border-none font-serif text-4xl italic outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
          oninput={(e) => {
            console.log(e);
            const value = e.target.value;
            if (value === '') {
              setBoardRefs(refs);
              return;
            }
            setBoardRefs(searchByText(refs, value));
          }}
        />
      </div>
      <Show
        when={refs.length !== 0}
        fallback={
          <div class="flex h-full w-full items-center justify-center font-serif text-4xl text-muted/50">
            <span>Drop or Save Reference file here to start</span>
          </div>
        }
      >
        <Mason
          as="section"
          class="relative h-full w-full"
          items={boardRefs()}
          gap={20}
          columns={breakPoints()()}
        >
          {(item, index) => (
            <Suspense fallback={<BoardItemSkeleton index={index()} />}>
              <BoardItem image={item} />
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
              getValueLabel={() => 'Copying...'}
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
