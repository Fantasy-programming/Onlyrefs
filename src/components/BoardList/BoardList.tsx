import { Motion } from "solid-motionone";
import { For, Accessor } from "solid-js";

// TODO: Ability to delete a board (deep delete, soft delete)
// Deep delete remove all of the refs
// Soft delete just remove the board and send the ref to all

const BoardList = (props: { boards: Accessor<string[]> }) => {
  return (
    <main class="grid grid-cols-fluid gap-10 mx-2 pb-20">
      <For each={props.boards()}>
        {(board) => (
          <>
            <Motion.a
              animate={{ y: [50, 0] }}
              class="h-[300px] max-w-xs onlyrefNoise rounded-md relative bg-primary-foreground/10 bg-clip-padding backdrop-filter backdrop-blur-3xl bg-opacity-70 shadow-subtleBtn  hover:shadow-sm hover:shadow-accent dark:hover:shadow-primary-foreground/20 transition-all duration-300"
              href={`/boards/${board}`}
            >
              <span class="text-2xl text-primary-foreground uppercase italic absolute bottom-4 left-1/2  -translate-x-1/2 -translate-y-1/2">
                {board}
              </span>
            </Motion.a>
          </>
        )}
      </For>
    </main>
  );
};

export default BoardList;
