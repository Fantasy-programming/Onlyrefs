import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useHotkeys } from 'react-hotkeys-hook';
import { toAssetUrl, saveMediaToDisk } from '@/lib/helper';
import {
  ImageRef,
  VideoRef,
  NoteRef,
  LinkRef,
  AudioRef,
  StackRef,
  Ref,
} from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import {
  FiChevronLeft,
  FiChevronRight,
  FiArrowLeft,
  FiMaximize,
  FiMinimize,
  FiRotateCw,
  FiDownload,
  FiExternalLink,
  FiTrash2,
  FiImage,
} from 'react-icons/fi';
import {
  LuFlipHorizontal,
  LuFlipVertical,
  LuSquare,
  LuZoomIn,
  LuZoomOut,
} from 'react-icons/lu';

// Note Editor imports
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import { Markdown } from 'tiptap-markdown';
import { debounce } from 'lodash-es';
import { mutateNote, setStackCover, removeFromStack } from '@/lib/commands';
import { useRefStore } from '@/state/refstore';
import { toast } from 'react-toastify';

interface TransformState {
  flipH: boolean;
  flipV: boolean;
  rotation: number; // 0, 90, 180, 270
  zoom: number; // 0.1 to 3
  actualSize: boolean;
}

// Stack state interface for lifting state to parent
interface StackState {
  currentItem: Ref | null;
  currentItemIndex: number;
  totalItems: number;
  isCurrentCover: boolean;
  canRemove: boolean;
  onSetCover: () => void;
  onRemoveItem: () => void;
  // Zoom controls for image items
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomChange: (value: number) => void;
}

const Viewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const refs = useRefStore((state) => state.refs);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get the origin route from location state, default to home
  // This ensures "Back" goes to where the user came from, not previous ref
  const originRoute = useRef(
    (location.state as { from?: string })?.from || '/',
  );

  // Find current ref and its index
  const currentIndex = useMemo(() => {
    return refs.findIndex((r) => r.metadata?.id === id);
  }, [refs, id]);

  const currentRef = useMemo(() => {
    return currentIndex >= 0 ? refs[currentIndex] : null;
  }, [refs, currentIndex]);

  // Transform state
  const [transform, setTransform] = useState<TransformState>({
    flipH: false,
    flipV: false,
    rotation: 0,
    zoom: 1,
    actualSize: false,
  });

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Stack-specific state (lifted from StackViewer)
  const [stackState, setStackState] = useState<StackState | null>(null);

  // Navigation
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < refs.length - 1;

  const goToPrev = useCallback(() => {
    if (hasPrev) {
      // Replace history entry to avoid building up back stack
      navigate(`/viewer/${refs[currentIndex - 1].metadata.id}`, {
        replace: true,
        state: { from: originRoute.current },
      });
    }
  }, [hasPrev, refs, currentIndex, navigate]);

  const goToNext = useCallback(() => {
    if (hasNext) {
      // Replace history entry to avoid building up back stack
      navigate(`/viewer/${refs[currentIndex + 1].metadata.id}`, {
        replace: true,
        state: { from: originRoute.current },
      });
    }
  }, [hasNext, refs, currentIndex, navigate]);

  const goBack = useCallback(() => {
    navigate(originRoute.current);
  }, [navigate]);

  // Transform controls
  const toggleFlipH = () => setTransform((t) => ({ ...t, flipH: !t.flipH }));
  const toggleFlipV = () => setTransform((t) => ({ ...t, flipV: !t.flipV }));
  const rotate90 = () =>
    setTransform((t) => ({ ...t, rotation: (t.rotation + 90) % 360 }));
  const toggleActualSize = () =>
    setTransform((t) => ({ ...t, actualSize: !t.actualSize, zoom: 1 }));
  const setZoom = (value: number) =>
    setTransform((t) => ({ ...t, zoom: value, actualSize: false }));
  const zoomIn = () =>
    setTransform((t) => ({
      ...t,
      zoom: Math.min(t.zoom + 0.25, 3),
      actualSize: false,
    }));
  const zoomOut = () =>
    setTransform((t) => ({
      ...t,
      zoom: Math.max(t.zoom - 0.25, 0.1),
      actualSize: false,
    }));

  // Reset transforms when changing refs
  useEffect(() => {
    setTransform({
      flipH: false,
      flipV: false,
      rotation: 0,
      zoom: 1,
      actualSize: false,
    });
  }, [id]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () =>
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard shortcuts using react-hotkeys-hook
  useHotkeys(
    'f',
    (e) => {
      e.preventDefault();
      toggleFullscreen();
    },
    { enableOnFormTags: false },
  );

  useHotkeys(
    'escape',
    () => {
      if (isFullscreen) {
        document.exitFullscreen();
      } else {
        goBack();
      }
    },
    { enableOnFormTags: false },
    [isFullscreen, goBack],
  );

  useHotkeys(
    'left',
    (e) => {
      e.preventDefault();
      goToPrev();
    },
    { enableOnFormTags: false },
  );

  useHotkeys(
    'right',
    (e) => {
      e.preventDefault();
      goToNext();
    },
    { enableOnFormTags: false },
  );

  useHotkeys(
    'r',
    (e) => {
      e.preventDefault();
      rotate90();
    },
    { enableOnFormTags: false },
  );

  useHotkeys(
    'h',
    (e) => {
      e.preventDefault();
      toggleFlipH();
    },
    { enableOnFormTags: false },
  );

  useHotkeys(
    'v',
    (e) => {
      e.preventDefault();
      toggleFlipV();
    },
    { enableOnFormTags: false },
  );

  useHotkeys(
    '1',
    (e) => {
      e.preventDefault();
      toggleActualSize();
    },
    { enableOnFormTags: false },
  );

  useHotkeys(
    '=, plus',
    (e) => {
      e.preventDefault();
      zoomIn();
    },
    { enableOnFormTags: false },
  );

  useHotkeys(
    '-',
    (e) => {
      e.preventDefault();
      zoomOut();
    },
    { enableOnFormTags: false },
  );

  // Export handler
  const handleExport = useCallback(async () => {
    if (!currentRef) return;
    const metadata = currentRef.metadata;
    if (
      metadata.ref_type === 'image' ||
      metadata.ref_type === 'video' ||
      metadata.ref_type === 'audio'
    ) {
      await saveMediaToDisk(metadata.id, metadata.file_name);
    }
  }, [currentRef]);

  if (!currentRef) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Reference not found</p>
      </div>
    );
  }

  const refType = currentRef.metadata.ref_type;

  return (
    <div
      ref={containerRef}
      className={cn(
        'bg-background flex h-full flex-col',
        isFullscreen && 'fixed inset-0 z-50',
      )}
    >
      {/* Top Toolbar */}
      <div
        className={cn(
          'border-border/40 flex items-center justify-between border-b px-4 py-2',
          isFullscreen && 'bg-background/95 backdrop-blur-sm',
        )}
      >
        {/* Left - Back button */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={goBack}>
            <FiArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <span className="text-muted-foreground text-sm">
            {currentIndex + 1} / {refs.length}
          </span>
        </div>

        {/* Center - Tools (for images/videos) */}
        {(refType === 'image' || refType === 'video') && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFlipH}
              className={cn('h-8 w-8', transform.flipH && 'bg-primary/20')}
              title="Flip Horizontal (H)"
            >
              <LuFlipHorizontal className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFlipV}
              className={cn('h-8 w-8', transform.flipV && 'bg-primary/20')}
              title="Flip Vertical (V)"
            >
              <LuFlipVertical className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={rotate90}
              className="h-8 w-8"
              title="Rotate 90° (R)"
            >
              <FiRotateCw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleActualSize}
              className={cn('h-8 w-8', transform.actualSize && 'bg-primary/20')}
              title="Actual Size (1)"
            >
              <LuSquare className="h-4 w-4" />
            </Button>

            <div className="bg-border mx-2 h-4 w-px" />

            <Button
              variant="ghost"
              size="icon"
              onClick={zoomOut}
              className="h-8 w-8"
              title="Zoom Out (-)"
            >
              <LuZoomOut className="h-4 w-4" />
            </Button>
            <div className="w-24">
              <Slider
                value={[transform.zoom]}
                min={0.1}
                max={3}
                step={0.1}
                onValueChange={(v) => setZoom(v[0])}
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={zoomIn}
              className="h-8 w-8"
              title="Zoom In (+)"
            >
              <LuZoomIn className="h-4 w-4" />
            </Button>
            <span className="text-muted-foreground ml-1 w-12 text-xs">
              {Math.round(transform.zoom * 100)}%
            </span>

            <div className="bg-border mx-2 h-4 w-px" />

            <Button
              variant="ghost"
              size="icon"
              onClick={handleExport}
              className="h-8 w-8"
              title="Export"
            >
              <FiDownload className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Center - Stack controls */}
        {refType === 'stack' && stackState && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">
              {stackState.currentItemIndex + 1} of {stackState.totalItems} items
            </span>
            <div className="bg-border mx-2 h-4 w-px" />
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-8 gap-1',
                stackState.isCurrentCover && 'opacity-50',
              )}
              onClick={stackState.onSetCover}
              disabled={stackState.isCurrentCover}
              title="Set as Cover (C)"
            >
              <FiImage className="h-4 w-4" />
              {stackState.isCurrentCover ? 'Cover' : 'Set Cover'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:bg-destructive/10 h-8 gap-1"
              onClick={stackState.onRemoveItem}
              disabled={!stackState.canRemove}
              title="Remove from Stack (Delete)"
            >
              <FiTrash2 className="h-4 w-4" />
              Remove
            </Button>

            {/* Zoom controls for image items in stack */}
            {stackState.currentItem?.metadata.ref_type === 'image' && (
              <>
                <div className="bg-border mx-2 h-4 w-px" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={stackState.onZoomOut}
                  className="h-8 w-8"
                  title="Zoom Out"
                >
                  <LuZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-muted-foreground w-12 text-center text-xs">
                  {Math.round(stackState.zoom * 100)}%
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={stackState.onZoomIn}
                  className="h-8 w-8"
                  title="Zoom In"
                >
                  <LuZoomIn className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        )}

        {/* Right - Fullscreen toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="h-8 w-8"
            title="Fullscreen (F)"
          >
            {isFullscreen ? (
              <FiMinimize className="h-4 w-4" />
            ) : (
              <FiMaximize className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative min-h-0 flex-1">
        {/* Previous Button */}
        {hasPrev && (
          <button
            onClick={goToPrev}
            className="bg-background/80 hover:bg-background absolute top-1/2 left-4 z-10 -translate-y-1/2 rounded-full p-2 shadow-md transition-all hover:shadow-lg"
          >
            <FiChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* Content */}
        <div className="flex h-full items-center justify-center p-4">
          {refType === 'image' && (
            <ImageViewer
              imageRef={currentRef as ImageRef}
              transform={transform}
            />
          )}
          {refType === 'video' && (
            <VideoViewer
              videoRef={currentRef as VideoRef}
              transform={transform}
            />
          )}
          {refType === 'note' && <NoteViewer noteRef={currentRef as NoteRef} />}
          {refType === 'link' && <LinkViewer linkRef={currentRef as LinkRef} />}
          {refType === 'audio' && (
            <AudioViewer audioRef={currentRef as AudioRef} />
          )}
          {refType === 'stack' && (
            <StackViewer
              stackRef={currentRef as StackRef}
              onStackStateChange={setStackState}
            />
          )}
        </div>

        {/* Next Button */}
        {hasNext && (
          <button
            onClick={goToNext}
            className="bg-background/80 hover:bg-background absolute top-1/2 right-4 z-10 -translate-y-1/2 rounded-full p-2 shadow-md transition-all hover:shadow-lg"
          >
            <FiChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Bottom info bar */}
      <div className="border-border/40 text-muted-foreground flex items-center justify-between border-t px-4 py-2 text-xs">
        <span>
          {refType === 'stack' && stackState?.currentItem
            ? stackState.currentItem.metadata.name || 'Untitled'
            : currentRef.metadata.name || 'Untitled'}
        </span>
        <div className="flex items-center gap-4">
          {refType === 'stack' && stackState?.currentItem ? (
            <>
              <span className="capitalize">
                {stackState.currentItem.metadata.ref_type}
              </span>
              {(stackState.currentItem.metadata.ref_type === 'image' ||
                stackState.currentItem.metadata.ref_type === 'video') &&
                'dimensions' in stackState.currentItem.metadata && (
                  <span>
                    {(stackState.currentItem.metadata as any).dimensions[0]} x{' '}
                    {(stackState.currentItem.metadata as any).dimensions[1]}
                  </span>
                )}
              {'file_size' in stackState.currentItem.metadata && (
                <span>
                  {(stackState.currentItem.metadata as any).file_size}
                </span>
              )}
            </>
          ) : (
            <>
              {(refType === 'image' || refType === 'video') &&
                'dimensions' in currentRef.metadata && (
                  <span>
                    {currentRef.metadata.dimensions[0]} x{' '}
                    {currentRef.metadata.dimensions[1]}
                  </span>
                )}
              {'file_size' in currentRef.metadata && (
                <span>{(currentRef.metadata as any).file_size}</span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Image Viewer Component
interface ImageViewerProps {
  imageRef: ImageRef;
  transform: TransformState;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ imageRef, transform }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset position when zoom resets to 1 or when transform changes
  useEffect(() => {
    if (transform.zoom <= 1) {
      setPosition({ x: 0, y: 0 });
    }
  }, [transform.zoom]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (transform.zoom > 1) {
        e.preventDefault();
        setIsDragging(true);
        dragStart.current = {
          x: e.clientX - position.x,
          y: e.clientY - position.y,
        };
      }
    },
    [transform.zoom, position],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging && transform.zoom > 1) {
        setPosition({
          x: e.clientX - dragStart.current.x,
          y: e.clientY - dragStart.current.y,
        });
      }
    },
    [isDragging, transform.zoom],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      // Optional: scroll wheel to pan when zoomed
      if (transform.zoom > 1) {
        e.preventDefault();
        setPosition((prev) => ({
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY,
        }));
      }
    },
    [transform.zoom],
  );

  const handleDoubleClick = useCallback(() => {
    // Reset position on double click
    setPosition({ x: 0, y: 0 });
  }, []);

  const transformStyle = useMemo(() => {
    const transforms: string[] = [];
    if (transform.flipH) transforms.push('scaleX(-1)');
    if (transform.flipV) transforms.push('scaleY(-1)');
    if (transform.rotation) transforms.push(`rotate(${transform.rotation}deg)`);
    if (!transform.actualSize) transforms.push(`scale(${transform.zoom})`);
    // Add translation for panning
    if (transform.zoom > 1 || position.x !== 0 || position.y !== 0) {
      transforms.push(
        `translate(${position.x / transform.zoom}px, ${position.y / transform.zoom}px)`,
      );
    }
    return transforms.join(' ');
  }, [transform, position]);

  const canPan = transform.zoom > 1;

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative flex h-full w-full items-center justify-center overflow-hidden',
        canPan
          ? isDragging
            ? 'cursor-grabbing'
            : 'cursor-grab'
          : 'cursor-default',
      )}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onDoubleClick={handleDoubleClick}
    >
      <img
        src={toAssetUrl(imageRef.image_path)}
        alt={imageRef.metadata.name || 'Image'}
        className={cn(
          'max-h-full max-w-full object-contain transition-transform duration-200',
          transform.actualSize && 'max-h-none max-w-none',
          isDragging && 'transition-none',
        )}
        style={{ transform: transformStyle }}
        draggable={false}
      />
    </div>
  );
};

// Video Viewer Component
interface VideoViewerProps {
  videoRef: VideoRef;
  transform: TransformState;
}

const VideoViewer: React.FC<VideoViewerProps> = ({ videoRef, transform }) => {
  const transformStyle = useMemo(() => {
    const transforms: string[] = [];
    if (transform.flipH) transforms.push('scaleX(-1)');
    if (transform.flipV) transforms.push('scaleY(-1)');
    if (transform.rotation) transforms.push(`rotate(${transform.rotation}deg)`);
    if (!transform.actualSize) transforms.push(`scale(${transform.zoom})`);
    return transforms.join(' ');
  }, [transform]);

  return (
    <video
      src={toAssetUrl(videoRef.video_path)}
      className={cn(
        'max-h-full max-w-full transition-transform duration-200',
        transform.actualSize && 'max-h-none max-w-none',
      )}
      style={{ transform: transformStyle }}
      controls
      autoPlay
    />
  );
};

// Note Viewer Component with TipTap editor
const NoteViewer: React.FC<{ noteRef: NoteRef }> = ({ noteRef }) => {
  const mutateNoteInStore = useRefStore((state) => state.mutateNote);

  // Debounced save
  const debouncedSave = useMemo(
    () =>
      debounce(async (content: string) => {
        await mutateNote(noteRef.metadata.id, noteRef.metapath, content);
        mutateNoteInStore(noteRef.metadata.id, content);
      }, 1000),
    [noteRef.metadata.id, noteRef.metapath, mutateNoteInStore],
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: 'Start writing...' }),
      (Markdown as any).configure({
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    editorProps: {
      attributes: {
        class:
          'focus:outline-none prose dark:prose-invert prose-lg max-w-full min-h-[400px] p-4',
      },
    },
    content: noteRef.content,
    onUpdate: ({ editor }) => {
      const markdown = (editor.storage as any).markdown.getMarkdown();
      debouncedSave(markdown);
    },
  });

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  return (
    <div className="border-border/40 bg-card h-full w-full max-w-3xl overflow-auto rounded-lg border">
      {editor && <EditorContent editor={editor} />}
    </div>
  );
};

// Link Viewer Component
const LinkViewer: React.FC<{ linkRef: LinkRef }> = ({ linkRef }) => {
  const handleOpenLink = () => {
    window.open(linkRef.metadata.source_uri, '_blank');
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="border-border/40 overflow-hidden rounded-lg border shadow-lg">
        <img
          src={toAssetUrl(linkRef.snapshoot)}
          alt={linkRef.metadata.name || 'Link screenshot'}
          className="max-h-[60vh] object-contain"
        />
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={handleOpenLink}>
          <FiExternalLink className="mr-2 h-4 w-4" />
          Open Link
        </Button>
        <span className="text-muted-foreground max-w-md truncate text-sm">
          {linkRef.metadata.source_uri}
        </span>
      </div>
    </div>
  );
};

// Audio Viewer Component
const AudioViewer: React.FC<{ audioRef: AudioRef }> = ({ audioRef }) => {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="bg-primary/20 flex h-32 w-32 items-center justify-center rounded-full">
        <svg
          className="text-primary h-16 w-16"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
        </svg>
      </div>
      <audio
        src={toAssetUrl(audioRef.audio_path)}
        controls
        autoPlay
        className="w-full max-w-md"
      />
      <span className="text-muted-foreground text-sm">
        {audioRef.metadata.name || 'Audio file'} - {audioRef.metadata.file_size}
      </span>
    </div>
  );
};

// Stack Image Viewer with zoom/pan - used inside StackViewer
interface StackImageViewerProps {
  imageRef: ImageRef;
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

const StackImageViewer: React.FC<StackImageViewerProps> = ({
  imageRef,
  zoom,
  onZoomChange,
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Reset position when zoom resets to 1
  useEffect(() => {
    if (zoom <= 1) {
      setPosition({ x: 0, y: 0 });
    }
  }, [zoom]);

  // Reset zoom when image changes
  useEffect(() => {
    onZoomChange(1);
    setPosition({ x: 0, y: 0 });
  }, [imageRef.metadata.id]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (zoom > 1) {
        e.preventDefault();
        setIsDragging(true);
        dragStart.current = {
          x: e.clientX - position.x,
          y: e.clientY - position.y,
        };
      }
    },
    [zoom, position],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging && zoom > 1) {
        setPosition({
          x: e.clientX - dragStart.current.x,
          y: e.clientY - dragStart.current.y,
        });
      }
    },
    [isDragging, zoom],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      // Ctrl+wheel to zoom
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        onZoomChange(Math.min(Math.max(zoom + delta, 0.5), 4));
      } else if (zoom > 1) {
        // Scroll to pan when zoomed
        e.preventDefault();
        setPosition((prev) => ({
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY,
        }));
      }
    },
    [zoom, onZoomChange],
  );

  const handleDoubleClick = useCallback(() => {
    // Toggle between 1x and 2x zoom on double click
    if (zoom > 1) {
      onZoomChange(1);
      setPosition({ x: 0, y: 0 });
    } else {
      onZoomChange(2);
    }
  }, [zoom, onZoomChange]);

  const canPan = zoom > 1;

  const transformStyle = useMemo(() => {
    const transforms: string[] = [];
    transforms.push(`scale(${zoom})`);
    if (zoom > 1 || position.x !== 0 || position.y !== 0) {
      transforms.push(
        `translate(${position.x / zoom}px, ${position.y / zoom}px)`,
      );
    }
    return transforms.join(' ');
  }, [zoom, position]);

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center">
      {/* Image container */}
      <div
        className={cn(
          'flex h-full w-full items-center justify-center overflow-hidden',
          canPan
            ? isDragging
              ? 'cursor-grabbing'
              : 'cursor-grab'
            : 'cursor-default',
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
      >
        <img
          src={toAssetUrl(imageRef.image_path)}
          alt={imageRef.metadata.name || 'Image'}
          className={cn(
            'max-h-full max-w-full object-contain transition-transform',
            isDragging && 'transition-none',
          )}
          style={{ transform: transformStyle }}
          draggable={false}
        />
      </div>

      {/* Hint text */}
      {zoom === 1 && (
        <div className="text-muted-foreground/60 absolute bottom-2 text-xs">
          Double-click or Ctrl+scroll to zoom
        </div>
      )}
    </div>
  );
};

// Stack Viewer Component - shows items in a carousel with thumbnail strip
interface StackViewerProps {
  stackRef: StackRef;
  onStackStateChange: (state: StackState | null) => void;
}

const StackViewer: React.FC<StackViewerProps> = ({
  stackRef,
  onStackStateChange,
}) => {
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [localItems, setLocalItems] = useState(stackRef.items || []);
  const [localCoverId, setLocalCoverId] = useState(stackRef.metadata.cover_id);
  const [zoom, setZoom] = useState(1);
  const navigate = useNavigate();
  const updateStackInStore = useRefStore((state) => state.updateStack);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(z + 0.25, 4));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(z - 0.25, 0.5));
  }, []);

  const handleZoomChange = useCallback((value: number) => {
    setZoom(value);
  }, []);

  // Sync local state when stackRef changes
  useEffect(() => {
    setLocalItems(stackRef.items || []);
    setLocalCoverId(stackRef.metadata.cover_id);
  }, [stackRef]);

  // Find initial index based on cover_id
  useEffect(() => {
    const coverIndex = localItems.findIndex(
      (item) => item.metadata.id === localCoverId,
    );
    if (coverIndex >= 0) {
      setCurrentItemIndex(coverIndex);
    }
  }, [localCoverId, localItems]);

  const currentItem = localItems[currentItemIndex];
  const hasPrevItem = currentItemIndex > 0;
  const hasNextItem = currentItemIndex < localItems.length - 1;
  const isCurrentCover = currentItem?.metadata.id === localCoverId;

  const goToPrevItem = useCallback(() => {
    if (hasPrevItem) {
      setCurrentItemIndex((i) => i - 1);
    }
  }, [hasPrevItem]);

  const goToNextItem = useCallback(() => {
    if (hasNextItem) {
      setCurrentItemIndex((i) => i + 1);
    }
  }, [hasNextItem]);

  // Set current item as cover
  const handleSetCover = useCallback(async () => {
    if (!currentItem || isCurrentCover) return;

    try {
      await setStackCover(stackRef.metadata.id, currentItem.metadata.id);
      setLocalCoverId(currentItem.metadata.id);
      // Update store
      updateStackInStore(stackRef.metadata.id, {
        cover_id: currentItem.metadata.id,
      });
      toast.success('Cover updated');
    } catch (error) {
      console.error('Failed to set cover:', error);
      toast.error('Failed to set cover');
    }
  }, [currentItem, isCurrentCover, stackRef.metadata.id, updateStackInStore]);

  // Remove current item from stack
  const handleRemoveItem = useCallback(async () => {
    if (!currentItem || localItems.length <= 1) return;

    const itemName = currentItem.metadata.name || 'Item';

    try {
      await removeFromStack(stackRef.metadata.id, [currentItem.metadata.id]);

      // Update local state
      const newItems = localItems.filter(
        (item) => item.metadata.id !== currentItem.metadata.id,
      );
      setLocalItems(newItems);

      // Adjust current index if needed
      if (currentItemIndex >= newItems.length) {
        setCurrentItemIndex(Math.max(0, newItems.length - 1));
      }

      // If we removed the cover, set first item as new cover
      if (currentItem.metadata.id === localCoverId && newItems.length > 0) {
        const newCoverId = newItems[0].metadata.id;
        setLocalCoverId(newCoverId);
        await setStackCover(stackRef.metadata.id, newCoverId);
      }

      // Update store - pass items as third parameter, also update item_ids in metadata
      const newItemIds = newItems.map((item) => item.metadata.id);
      updateStackInStore(
        stackRef.metadata.id,
        {
          item_ids: newItemIds,
          cover_id:
            currentItem.metadata.id === localCoverId
              ? newItems[0]?.metadata.id
              : localCoverId,
        },
        newItems,
      );

      toast.success(`Removed "${itemName}" from stack`);
    } catch (error) {
      console.error('Failed to remove item from stack:', error);
      toast.error('Failed to remove item');
    }
  }, [
    currentItem,
    localItems,
    currentItemIndex,
    localCoverId,
    stackRef.metadata.id,
    updateStackInStore,
  ]);

  // Keyboard navigation within stack
  useHotkeys(
    'up',
    (e) => {
      e.preventDefault();
      goToPrevItem();
    },
    { enableOnFormTags: false },
    [goToPrevItem],
  );

  useHotkeys(
    'down',
    (e) => {
      e.preventDefault();
      goToNextItem();
    },
    { enableOnFormTags: false },
    [goToNextItem],
  );

  // Keyboard shortcut for set cover
  useHotkeys(
    'c',
    (e) => {
      e.preventDefault();
      handleSetCover();
    },
    { enableOnFormTags: false },
    [handleSetCover],
  );

  // Keyboard shortcut for delete item
  useHotkeys(
    'delete, backspace',
    (e) => {
      e.preventDefault();
      handleRemoveItem();
    },
    { enableOnFormTags: false },
    [handleRemoveItem],
  );

  // Report stack state to parent component
  useEffect(() => {
    onStackStateChange({
      currentItem: currentItem || null,
      currentItemIndex,
      totalItems: localItems.length,
      isCurrentCover,
      canRemove: localItems.length > 1,
      onSetCover: handleSetCover,
      onRemoveItem: handleRemoveItem,
      zoom,
      onZoomIn: handleZoomIn,
      onZoomOut: handleZoomOut,
      onZoomChange: handleZoomChange,
    });

    // Cleanup on unmount
    return () => {
      onStackStateChange(null);
    };
  }, [
    currentItem,
    currentItemIndex,
    localItems.length,
    isCurrentCover,
    handleSetCover,
    handleRemoveItem,
    onStackStateChange,
    zoom,
    handleZoomIn,
    handleZoomOut,
    handleZoomChange,
  ]);

  // Get thumbnail for an item
  const getItemThumbnail = (item: Ref): string | null => {
    switch (item.metadata.ref_type) {
      case 'image': {
        const imageRef = item as ImageRef;
        // For GIFs, always use the full image path to preserve animation
        const isGif =
          imageRef.metadata.file_name?.toLowerCase().endsWith('.gif') ||
          imageRef.metadata.media_type?.includes('gif');
        return toAssetUrl(
          isGif
            ? imageRef.image_path
            : imageRef.low_res_imagepath || imageRef.image_path,
        );
      }
      case 'link':
        return toAssetUrl((item as LinkRef).snapshoot);
      default:
        return null;
    }
  };

  // Render the current item content
  const renderItemContent = (item: Ref) => {
    const type = item.metadata.ref_type;

    if (type === 'image') {
      return (
        <StackImageViewer
          imageRef={item as ImageRef}
          zoom={zoom}
          onZoomChange={handleZoomChange}
        />
      );
    }

    if (type === 'video') {
      return (
        <video
          src={toAssetUrl((item as VideoRef).video_path)}
          className="max-h-full max-w-full"
          controls
          autoPlay
        />
      );
    }

    if (type === 'audio') {
      return (
        <div className="flex flex-col items-center gap-4">
          <div className="bg-primary/20 flex h-24 w-24 items-center justify-center rounded-full">
            <svg
              className="text-primary h-12 w-12"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
          <audio
            src={toAssetUrl((item as AudioRef).audio_path)}
            controls
            autoPlay
            className="w-full max-w-md"
          />
        </div>
      );
    }

    if (type === 'note') {
      return (
        <div className="bg-card border-border/40 max-h-[60vh] w-full max-w-2xl overflow-auto rounded-lg border p-6">
          <div className="prose dark:prose-invert">
            <pre className="font-sans whitespace-pre-wrap">
              {(item as NoteRef).content}
            </pre>
          </div>
        </div>
      );
    }

    if (type === 'link') {
      return (
        <div className="flex flex-col items-center gap-4">
          <img
            src={toAssetUrl((item as LinkRef).snapshoot)}
            alt={item.metadata.name || 'Link'}
            className="max-h-[50vh] rounded-lg object-contain shadow-lg"
          />
          <a
            href={(item as LinkRef).metadata.source_uri}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {(item as LinkRef).metadata.source_uri}
          </a>
        </div>
      );
    }

    return (
      <div className="text-muted-foreground">Unsupported item type: {type}</div>
    );
  };

  if (localItems.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <div className="text-muted-foreground text-lg">This stack is empty</div>
        <p className="text-muted-foreground/60 text-sm">
          Add items to this stack to view them here
        </p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Main content area */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-4">
        {/* Previous button */}
        {hasPrevItem && (
          <button
            onClick={goToPrevItem}
            className="bg-background/80 hover:bg-background absolute top-1/2 left-4 z-10 -translate-y-1/2 rounded-full p-2 shadow-md transition-all hover:shadow-lg"
          >
            <FiChevronLeft className="h-5 w-5" />
          </button>
        )}

        {/* Current item */}
        {currentItem && renderItemContent(currentItem)}

        {/* Next button */}
        {hasNextItem && (
          <button
            onClick={goToNextItem}
            className="bg-background/80 hover:bg-background absolute top-1/2 right-4 z-10 -translate-y-1/2 rounded-full p-2 shadow-md transition-all hover:shadow-lg"
          >
            <FiChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Thumbnail strip */}
      {localItems.length > 1 && (
        <div className="border-border/40 w-full overflow-hidden border-t bg-black/5 px-4 py-3 dark:bg-white/5">
          <div className="scrollbar-hide flex max-w-full gap-2 overflow-x-auto">
            {localItems.map((item, index) => {
              const thumbnail = getItemThumbnail(item);
              const isActive = index === currentItemIndex;
              const isCover = item.metadata.id === localCoverId;

              return (
                <button
                  key={item.metadata.id}
                  onClick={() => setCurrentItemIndex(index)}
                  className={cn(
                    'relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all',
                    isActive
                      ? 'border-primary ring-primary/30 ring-2'
                      : 'hover:border-primary/50 border-transparent',
                  )}
                >
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="bg-muted text-muted-foreground flex h-full w-full items-center justify-center text-[10px]">
                      {item.metadata.ref_type}
                    </div>
                  )}
                  {isCover && (
                    <div className="bg-primary text-primary-foreground absolute top-0.5 left-0.5 rounded px-1 py-0.5 text-[8px]">
                      Cover
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Viewer;
