import { BoardItem, BoardItemSkeleton } from "../BoardItem/BoardItem";
import { Progress, ProgressValueLabel } from "../ui/progress";
import {
  onMount,
  createSignal,
  Show,
  createEffect,
  on,
  Suspense,
} from "solid-js";
import { Portal } from "solid-js/web";
import { Mason, createMasonryBreakpoints } from "solid-mason";
import { getAllRefs, parseRefs } from "../../lib/helper";
import { useFileSelector } from "./Board.hook";
import { BoardProps } from "./Board.types";
import { Button } from "../ui/button";
import { MediaRef } from "../../lib/types";

const Board = ({ collection, home }: BoardProps) => {
  const [images, setImages] = createSignal<MediaRef[]>([]);
  const [selectFiles, dropFiles, progress] = useFileSelector();

  // Change - Get the number from the global state
  const breakpoints = createMasonryBreakpoints(() => [
    { query: "(min-width: 1536px)", columns: 4 },
    { query: "(min-width: 1280px) and (max-width: 1536px)", columns: 4 },
    { query: "(min-width: 1024px) and (max-width: 1280px)", columns: 3 },
    { query: "(min-width: 768px) and (max-width: 1024px)", columns: 2 },
    { query: "(max-width: 768px)", columns: 2 },
  ]);

  // TODO: Cache the 2 first operations
  const getImages = async () => {
    const data = await getAllRefs();

    const refs = await Promise.all(
      data.map(async (ref) => {
        return await parseRefs(ref);
      }),
    );

    const filteredRefs = refs.filter(
      (ref) => ref.metadata?.collection === collection,
    );

    setImages(filteredRefs);
  };

  createEffect(
    on(progress, () => {
      getImages();
    }),
  );

  onMount(() => {
    getImages();
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
        items={images()}
        columns={breakpoints()}
      >
        {(item, index) => (
          <Suspense fallback={<BoardItemSkeleton index={index()} />}>
            <BoardItem image={item} refresh={getImages} />
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
