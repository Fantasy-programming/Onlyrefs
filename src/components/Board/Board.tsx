import { BoardItem, BoardItemSkeleton } from "../BoardItem/BoardItem";
import { Progress, ProgressValueLabel } from "../ui/progress";
import {
  onMount,
  Show,
  createSignal,
  createEffect,
  createMemo,
  on,
  Suspense,
} from "solid-js";
import { Portal } from "solid-js/web";
import { Mason } from "../Mason";
import { useFileSelector } from "./Board.hook";
import { BoardProps } from "./Board.types";
import { Button } from "../ui/button";
import { gridSizeHook } from "../../state/hook";
import { getBreakpoints, searchByText } from "../../lib/helper";
import { useRefSelector } from "../../state/store";
import { Input } from "../ui/input";

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
        <Input
          placeholder="Search your refs..."
          class="border-none outline-none text-4xl italic font-serif focus-visible:ring-0 focus-visible:ring-offset-0"
          oninput={(e) => {
            console.log(e);
            const value = e.target.value;
            if (value === "") {
              setBoardRefs(refs);
              return;
            }
            setBoardRefs(searchByText(refs, value));
          }}
        />
      </div>
      <Mason
        as="section"
        class="w-full h-full relative"
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
