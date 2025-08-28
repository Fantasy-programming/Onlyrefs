import { motion } from 'framer-motion';
import { useParams } from '@solidjs/router';
import { useRefSelector } from '@/state/refstore';

import Board from '@/components/Board/Board';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

import BoardList from '@/components/BoardList/BoardList';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

const BoardsPage = () => {
  const [boards, setBoards] = useState<string[]>([]);
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

  useEffect(() => {
    getBoards();
  }, [])


  return (
    <>
      {
        id ? (
          <Board collection={boardID} home={true} refs={root.ref} />
        ) : (

          <motion.div animate={{ opacity: [0, 1] }} className="mt-20">
            <header className="flex items-center justify-between">
              <h1 className="text-3xl text-primary-foreground">Boards</h1>
              <NewCollectionDialog setter={setBoards} />
            </header>
            <main className="mt-10">
              <BoardList boards={boards} />
            </main>
          </motion.div>
        )
      }
    </>
  );
};

const NewCollectionDialog = (props: { setter: Setter<string[]> }) => {
  const [showDialog, setShowDialog] = useState(false);

  const handleCreation = async (
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
        asChild
      >
        <Button className=" h-11 rounded-md border border-input bg-transparent px-8 hover:bg-accent hover:text-accent-foreground ">
          Create Collection
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create collection</DialogTitle>
          <DialogDescription>
            Create a new collection to organize your refs
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreation}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input id="name" name="name" className="col-span-3" />
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
