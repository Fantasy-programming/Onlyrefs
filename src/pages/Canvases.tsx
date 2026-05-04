import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCanvases, useCanvasListStore } from '@/state/canvasliststore';

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
import { Button } from '@/components/ui/button';
import { useState, FormEvent } from 'react';
import { Canvas } from '@/lib/types';
import { Layers, Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const CanvasesPage = () => {
  const canvases = useCanvases();
  const createCanvas = useCanvasListStore((state) => state.createCanvas);

  return (
    <motion.div animate={{ opacity: [0, 1] }} className="px-4 pt-8 md:px-6">
      <header className="flex items-center justify-between">
        <h1 className="text-primary-foreground text-3xl">Canvases</h1>
        <NewCanvasDialog onCreateCanvas={createCanvas} />
      </header>
      <main className="mt-10">
        {canvases.length === 0 ? (
          <EmptyState onCreateCanvas={createCanvas} />
        ) : (
          <CanvasList canvases={canvases} />
        )}
      </main>
    </motion.div>
  );
};

interface CanvasListProps {
  canvases: Canvas[];
}

const CanvasList: React.FC<CanvasListProps> = ({ canvases }) => {
  // Sort by updated_at (most recent first)
  const sortedCanvases = [...canvases].sort(
    (a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  );

  return (
    <div className="grid grid-cols-2 gap-6 pb-20 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {sortedCanvases.map((canvas) => (
        <CanvasCard key={canvas.id} canvas={canvas} />
      ))}
    </div>
  );
};

interface CanvasCardProps {
  canvas: Canvas;
}

const CanvasCard: React.FC<CanvasCardProps> = ({ canvas }) => {
  const navigate = useNavigate();
  const renameCanvas = useCanvasListStore((state) => state.renameCanvas);
  const deleteCanvas = useCanvasListStore((state) => state.deleteCanvas);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleClick = () => {
    navigate(`/canvas/${canvas.id}`);
  };

  const handleRename = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newName = formData.get('name')?.toString();
    if (newName && newName !== canvas.name) {
      try {
        await renameCanvas(canvas.id, newName);
      } catch (err) {
        console.error('Failed to rename canvas:', err);
      }
    }
    setShowRenameDialog(false);
  };

  const handleDelete = async () => {
    try {
      await deleteCanvas(canvas.id);
    } catch (err) {
      console.error('Failed to delete canvas:', err);
    }
    setShowDeleteDialog(false);
  };

  // Format the date nicely
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <>
      <div className="group relative">
        {/* Card body - clickable */}
        <button
          onClick={handleClick}
          className="bg-card hover:bg-accent/50 border-border relative block h-[180px] w-full rounded-lg border transition-all hover:shadow-md"
        >
          {/* Canvas preview placeholder */}
          <div className="text-muted-foreground flex h-full w-full flex-col items-center justify-center gap-2">
            <Layers className="h-12 w-12 opacity-30" />
          </div>
        </button>

        {/* Canvas info below card */}
        <div className="mt-3 flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="text-primary-foreground truncate text-sm font-medium">
              {canvas.name}
            </h3>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Updated {formatDate(canvas.updated_at)}
            </p>
          </div>

          {/* Actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground -mr-2 h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowRenameDialog(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Rename canvas</DialogTitle>
            <DialogDescription>
              Enter a new name for this canvas
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRename}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={canvas.name}
                  className="col-span-3"
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowRenameDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete canvas</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{canvas.name}"? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

interface EmptyStateProps {
  onCreateCanvas: (name: string) => Promise<Canvas | null>;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onCreateCanvas }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="bg-muted/30 mb-6 rounded-full p-6">
        <Layers className="text-muted-foreground h-12 w-12" />
      </div>
      <h2 className="text-primary-foreground mb-2 text-xl font-medium">
        No canvases yet
      </h2>
      <p className="text-muted-foreground mb-6 max-w-md text-center">
        Create your first canvas to start arranging your references in a
        freeform layout.
      </p>
      <NewCanvasDialog onCreateCanvas={onCreateCanvas} />
    </div>
  );
};

interface NewCanvasDialogProps {
  onCreateCanvas: (name: string) => Promise<Canvas | null>;
}

const NewCanvasDialog: React.FC<NewCanvasDialogProps> = ({
  onCreateCanvas,
}) => {
  const [showDialog, setShowDialog] = useState(false);
  const navigate = useNavigate();

  const handleCreation = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name');
    if (name) {
      try {
        const newCanvas = await onCreateCanvas(name.toString());
        setShowDialog(false);
        // Navigate to the new canvas
        if (newCanvas) {
          navigate(`/canvas/${newCanvas.id}`);
        }
      } catch (err) {
        console.error('Failed to create canvas:', err);
      }
    }
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button className="border-input hover:bg-accent hover:text-accent-foreground h-11 gap-2 rounded-md border bg-transparent px-6">
          <Plus className="h-4 w-4" />
          Create Canvas
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create canvas</DialogTitle>
          <DialogDescription>
            Create a new canvas to arrange your references
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreation}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="My Canvas"
                className="col-span-3"
                autoFocus
              />
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

export default CanvasesPage;
