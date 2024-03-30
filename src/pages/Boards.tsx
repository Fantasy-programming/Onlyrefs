import { Motion } from 'solid-motionone';
import { useParams } from '@solidjs/router';
import { JSX, Setter, Show, createSignal, onMount } from 'solid-js';
import { useRefSelector } from '~/state/store';

import Board from '~/components/Board/Board';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog';

import { Label } from '~/components/ui/label';
import { Input } from '~/components/ui/input';

import BoardList from '~/components/BoardList/BoardList';
import { Button } from '~/components/ui/button';

const BoardsPage = () => {
  const [boards, setBoards] = createSignal<string[]>([]);
  const root = useRefSelector();

  const { id } = useParams();
  const boardID = decodeURIComponent(id);

  const getBoards = async () => {
    const boards: string[] = [];

    for (const refs of root.ref) {
      if (refs.metadata?.collection) {
        if (!boards.includes(refs.metadata.collection)) {
          boards.push(refs.metadata.collection);
        }
      }
    }
    setBoards(boards);
  };

  onMount(() => {
    getBoards();
  });

  return (
    <>
      <Show
        when={!id}
        fallback={<Board collection={boardID} home={true} refs={root.ref} />}
      >
        <Motion.div animate={{ opacity: [0, 1] }} class="mt-20">
          <header class="flex items-center justify-between">
            <h1 class="text-3xl text-primary-foreground">Boards</h1>
            <NewCollectionDialog setter={setBoards} />
          </header>
          <main class="mt-10">
            <BoardList boards={boards} />
          </main>
        </Motion.div>
      </Show>
    </>
  );
};

const NewCollectionDialog = (props: { setter: Setter<string[]> }) => {
  const [showDialog, setShowDialog] = createSignal(false);

  const handleCreation: JSX.EventHandler<HTMLFormElement, SubmitEvent> = async (
    e,
  ) => {
    e.preventDefault();
    const formData = new FormData(e?.currentTarget);
    const name = formData.get('name');
    if (name) {
      // await createCollection(name.toString());

      props.setter((prev) => {
        return [...prev, name.toString()];
      });
    }
    setShowDialog(false);
  };

  return (
    <Dialog open={showDialog()} onOpenChange={setShowDialog}>
      <DialogTrigger
        as={Button}
        class=" h-11 rounded-md border border-input bg-transparent px-8 hover:bg-accent hover:text-accent-foreground "
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
  );
};

export default BoardsPage;
