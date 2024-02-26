import { Motion } from "solid-motionone";
import { useParams } from "@solidjs/router";
import { createCollection } from "../lib/helper";
import { JSX, Show, createSignal } from "solid-js";
import Board from "../components/Board/Board";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";

import BoardList from "../components/BoardList/BoardList";
import { Button } from "../components/ui/button";

const Boards = () => {
  const { id } = useParams();
  const [showDialog, setShowDialog] = createSignal(false);

  const handleCreation: JSX.EventHandler<HTMLFormElement, SubmitEvent> = async (
    e,
  ) => {
    e.preventDefault();
    const formData = new FormData(e?.currentTarget);
    const name = formData.get("name");
    if (name) {
      await createCollection(name.toString());
    }
    setShowDialog(false);
  };

  return (
    <>
      <Show
        when={id}
        fallback={
          <Motion.div animate={{ opacity: [0, 1] }} class="mt-20">
            <header class="flex items-center justify-between">
              <h1 class="text-3xl text-primary-foreground">Boards</h1>
              <Dialog open={showDialog()} onOpenChange={setShowDialog}>
                <DialogTrigger
                  as={Button}
                  class=" bg-transparent border border-input hover:bg-accent hover:text-accent-foreground h-11 rounded-md px-8 "
                >
                  Create Collection
                </DialogTrigger>
                <DialogContent class="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Create collection</DialogTitle>
                    <DialogDescription>
                      Create a new collection to organize your refs
                    </DialogDescription>
                  </DialogHeader>
                  <form onsubmit={handleCreation}>
                    <div class="grid gap-4 py-4">
                      <div class="grid grid-cols-4 items-center gap-4">
                        <Label for="name" class="text-right">
                          Name
                        </Label>
                        <Input id="name" name="name" class="col-span-3" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit">Create Now</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </header>
            <main class="mt-10">
              <BoardList />
            </main>
          </Motion.div>
        }
      >
        <Board collection={id} home={true} />
      </Show>
    </>
  );
};

export default Boards;
