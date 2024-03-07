import { BoardItem, BoardItemSkeleton } from "../BoardItem/BoardItem";
import { Progress, ProgressValueLabel } from "../ui/progress";
import {
  onMount,
  Show,
  createEffect,
  createSignal,
  createMemo,
  on,
  Suspense,
} from "solid-js";
import { Portal } from "solid-js/web";
import { Mason } from "solid-mason";
import { useFileSelector } from "./Board.hook";
import { BoardProps } from "./Board.types";
import { Button } from "../ui/button";
import { gridSizeHook } from "../../state/hook";
import { getBreakpoints } from "../../lib/helper";
import { useRefSelector } from "../../state/store";

const Board = ({ collection, home, refs }: BoardProps) => {
  // TODO: Make this dude rerender
  const [selectFiles, dropFiles, progress] = useFileSelector();
  const [gridSize] = gridSizeHook();
  const [localGridSize, setLocalGridSize] = createSignal(gridSize());
  const breakPoints = createMemo(() => getBreakpoints(localGridSize()));
  const {
    refService: { refetchRefs },
  } = useRefSelector();

  createEffect(() => {
    setLocalGridSize(gridSize());
  });

  createEffect(
    on(progress, () => {
      refetchRefs();
    }),
  );

  onMount(() => {
    dropFiles(collection);
  });

  return (
    <main class="w-full pt-16 h-screen">
      <div class="mb-8 flex justify-between">
        <Show when={home}>
          <h1 class="text-4xl text-primary-foreground uppercase italic">
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
      </div>
      <Mason
        as="section"
        class="w-full h-full relative"
        items={refs}
        columns={breakPoints()()}
      >
        {(item, index) => (
          <Suspense fallback={<BoardItemSkeleton index={index()} />}>
            <BoardItem image={item} refresh={() => {}} />
          </Suspense>
        )}
      </Mason>
      <Show when={progress().total !== progress().completed}>
        <Portal>
          <div class="fixed h-20 bg-white text-black shadow-md w-[300px] rounded-md right-5 bottom-5">
            <Progress
              class="p-4 space-y-1"
              minValue={0}
              getValueLabel={() => "Copying..."}
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
