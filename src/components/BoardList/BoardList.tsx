import { Motion } from 'solid-motionone';
import { For, Accessor } from 'solid-js';

// TODO: Ability to delete a board (deep delete, soft delete)
// Deep delete remove all of the refs
// Soft delete just remove the board and send the ref to all

const BoardList = (props: { boards: Accessor<string[]> }) => {
  return (
    <main class="mx-2 grid grid-cols-fluid gap-10 pb-20">
      <For each={props.boards()}>
        {(board) => (
          <>
            <Motion.a
              animate={{ y: [50, 0] }}
              class="onlyrefNoise relative h-[300px] max-w-xs rounded-md bg-primary-foreground/10 bg-opacity-70 bg-clip-padding shadow-subtleBtn backdrop-blur-3xl backdrop-filter  transition-all duration-300 hover:shadow-sm hover:shadow-accent dark:hover:shadow-primary-foreground/20"
              href={`/boards/${board}`}
            >
              <span class="absolute bottom-4 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl uppercase  italic text-primary-foreground">
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
