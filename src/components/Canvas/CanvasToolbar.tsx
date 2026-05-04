import React from 'react';
import {
  CanvasTool,
  useCanvasStoreContext,
  useContextCanvasTool,
  useContextHasSelection,
  useContextCanvasViewport,
} from './CanvasStoreContext';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  MousePointer2,
  Hand,
  Type,
  Frame,
  Undo2,
  Redo2,
  Trash2,
  Copy,
  ZoomIn,
  ZoomOut,
  Maximize,
  Lock,
  Unlock,
} from 'lucide-react';

interface ToolButtonProps {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  isActive?: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const ToolButton: React.FC<ToolButtonProps> = ({
  icon,
  label,
  shortcut,
  isActive,
  onClick,
  disabled,
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'h-8 w-8 p-0',
          isActive && 'bg-accent text-accent-foreground',
        )}
        onClick={onClick}
        disabled={disabled}
      >
        {icon}
      </Button>
    </TooltipTrigger>
    <TooltipContent side="bottom" className="flex items-center gap-2">
      <span>{label}</span>
      {shortcut && (
        <kbd className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px] font-medium">
          {shortcut}
        </kbd>
      )}
    </TooltipContent>
  </Tooltip>
);

export const CanvasToolbar: React.FC = () => {
  const store = useCanvasStoreContext();
  const tool = useContextCanvasTool();
  const hasSelection = useContextHasSelection();
  const viewport = useContextCanvasViewport();

  const setTool = store((s) => s.setTool);
  const undo = store((s) => s.undo);
  const redo = store((s) => s.redo);
  const deleteSelection = store((s) => s.deleteSelection);
  const duplicateSelection = store((s) => s.duplicateSelection);
  const lockSelection = store((s) => s.lockSelection);
  const unlockSelection = store((s) => s.unlockSelection);
  const zoomTo = store((s) => s.zoomTo);
  const zoomToFit = store((s) => s.zoomToFit);
  const history = store((s) => s.history);
  const historyIndex = store((s) => s.historyIndex);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const tools: {
    tool: CanvasTool;
    icon: React.ReactNode;
    label: string;
    shortcut: string;
  }[] = [
    {
      tool: 'select',
      icon: <MousePointer2 className="h-4 w-4" />,
      label: 'Select',
      shortcut: 'V',
    },
    {
      tool: 'pan',
      icon: <Hand className="h-4 w-4" />,
      label: 'Pan',
      shortcut: 'H',
    },
    {
      tool: 'text',
      icon: <Type className="h-4 w-4" />,
      label: 'Text',
      shortcut: 'T',
    },
    {
      tool: 'frame',
      icon: <Frame className="h-4 w-4" />,
      label: 'Frame',
      shortcut: 'F',
    },
  ];

  const handleZoomIn = () => {
    zoomTo(Math.min(viewport.zoom * 1.25, 5));
  };

  const handleZoomOut = () => {
    zoomTo(Math.max(viewport.zoom / 1.25, 0.1));
  };

  const handleZoomToFit = () => {
    const container = document.querySelector('[data-canvas-viewport]');
    if (container) {
      const rect = container.getBoundingClientRect();
      zoomToFit(rect.width, rect.height);
    }
  };

  return (
    <div className="bg-background/95 absolute top-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-lg border px-2 py-1.5 shadow-md backdrop-blur-sm">
      {/* Tool selection */}
      {tools.map((t) => (
        <ToolButton
          key={t.tool}
          icon={t.icon}
          label={t.label}
          shortcut={t.shortcut}
          isActive={tool === t.tool}
          onClick={() => setTool(t.tool)}
        />
      ))}

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* History */}
      <ToolButton
        icon={<Undo2 className="h-4 w-4" />}
        label="Undo"
        shortcut="Ctrl+Z"
        onClick={undo}
        disabled={!canUndo}
      />
      <ToolButton
        icon={<Redo2 className="h-4 w-4" />}
        label="Redo"
        shortcut="Ctrl+Y"
        onClick={redo}
        disabled={!canRedo}
      />

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Selection actions */}
      <ToolButton
        icon={<Copy className="h-4 w-4" />}
        label="Duplicate"
        shortcut="Ctrl+D"
        onClick={duplicateSelection}
        disabled={!hasSelection}
      />
      <ToolButton
        icon={<Lock className="h-4 w-4" />}
        label="Lock"
        onClick={lockSelection}
        disabled={!hasSelection}
      />
      <ToolButton
        icon={<Unlock className="h-4 w-4" />}
        label="Unlock"
        onClick={unlockSelection}
        disabled={!hasSelection}
      />
      <ToolButton
        icon={<Trash2 className="h-4 w-4" />}
        label="Delete"
        shortcut="Del"
        onClick={deleteSelection}
        disabled={!hasSelection}
      />

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Zoom controls */}
      <ToolButton
        icon={<ZoomOut className="h-4 w-4" />}
        label="Zoom Out"
        shortcut="Ctrl+-"
        onClick={handleZoomOut}
      />
      <span className="text-muted-foreground min-w-[40px] text-center text-xs">
        {Math.round(viewport.zoom * 100)}%
      </span>
      <ToolButton
        icon={<ZoomIn className="h-4 w-4" />}
        label="Zoom In"
        shortcut="Ctrl++"
        onClick={handleZoomIn}
      />
      <ToolButton
        icon={<Maximize className="h-4 w-4" />}
        label="Fit to Screen"
        shortcut="Ctrl+1"
        onClick={handleZoomToFit}
      />
    </div>
  );
};

export default CanvasToolbar;
