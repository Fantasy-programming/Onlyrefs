import { useParams } from "@solidjs/router";
import { Show } from "solid-js";
import Board from "../components/Board/Board";

import BoardList from "../components/BoardList/BoardList";
import { Button } from "../components/ui/button";

const Boards = () => {
  const { id } = useParams();

  return (
    <>
      <Show
        when={id}
        fallback={
          <div class="mt-20">
            <header class="flex items-center justify-between">
              <h1 class="text-3xl text-primary-foreground">Boards</h1>
              <Button type="button" size="lg" />
            </header>
            <main class="mt-10">
              <BoardList />
            </main>
          </div>
        }
      >
        <Board collection={id} home={true} />
      </Show>
    </>
  );
};

export default Boards;
