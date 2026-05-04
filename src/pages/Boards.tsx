import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { useDisplayRefs } from '@/state/refstore';
import { useBoardStore, useBoards } from '@/state/boardstore';

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
import { useState, FormEvent } from 'react';

const BoardsPage = () => {
  const boards = useBoards();
  const displayRefs = useDisplayRefs();
  const createBoard = useBoardStore((state) => state.createBoard);

  const { id } = useParams();
  const boardID = id ? decodeURIComponent(id) : '';

  // Get board names for display
  const boardNames = boards.map((b) => b.name);

  return (
    <>
      {id ? (
        <Board collection={boardID} home={true} refs={displayRefs} />
      ) : (
        <motion.div animate={{ opacity: [0, 1] }} className="px-4 pt-8 md:px-6">
          <header className="flex items-center justify-between">
            <h1 className="text-primary-foreground text-3xl">Boards</h1>
            <NewBoardDialog onCreateBoard={createBoard} />
          </header>
          <main className="mt-10">
            <BoardList boards={boardNames} />
          </main>
        </motion.div>
      )}
    </>
  );
};

interface NewBoardDialogProps {
  onCreateBoard: (name: string, parentId: string | null) => Promise<any>;
}

const NewBoardDialog: React.FC<NewBoardDialogProps> = ({ onCreateBoard }) => {
  const [showDialog, setShowDialog] = useState(false);

  const handleCreation = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name');
    if (name) {
      await onCreateBoard(name.toString(), null);
    }
    setShowDialog(false);
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button className="border-input hover:bg-accent hover:text-accent-foreground h-11 rounded-md border bg-transparent px-8">
          Create Board
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create board</DialogTitle>
          <DialogDescription>
            Create a new board to organize your refs
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
