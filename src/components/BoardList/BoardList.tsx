import { onMount, createSignal, For } from "solid-js";
import { readDir, BaseDirectory } from "@tauri-apps/api/fs";

// Ability to scan for folders (make it reusable to get all files or folders in a dir)
// Show a card with the name of the collection
// Onclick render a a new page with a board of the given collection

const BoardList = () => {
  const [boards, setBoards] = createSignal<string[]>([]);

  const getBoards = async () => {
    const entries = await readDir("collections", {
      dir: BaseDirectory.AppData,
    });
    const boards: string[] = [];
    for (const entry of entries) {
      if (entry?.name) {
        boards.push(entry?.name);
      }
    }
    setBoards(boards);
  };

  onMount(() => {
    getBoards();
  });

  return (
    <main class="grid grid-cols-fluid gap-10 ">
      <For each={boards()}>
        {(board) => (
          <>
            <a
              class="h-[300px] relative max-w-xs  rounded-lg bg-white"
              href={`/boards/${board}`}
            >
              <span class="text-2xl uppercase italic absolute bottom-4 left-1/2  -translate-x-1/2 -translate-y-1/2">
                {board}
              </span>
            </a>
          </>
        )}
      </For>
    </main>
  );
};

export default BoardList;
