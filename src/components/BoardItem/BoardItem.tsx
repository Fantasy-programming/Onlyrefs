import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { BoardItemProps } from './BoardItem.types';
import {
  ImageRef,
  LinkRef,
  NoteRef,
  VideoRef,
  AudioRef,
  Ref,
  StackRef,
  DesignRef,
  ModelRef,
} from '@/lib/types';
import { toAssetUrl, saveMediaToDisk } from '@/lib/helper';
import { cn } from '@/lib/utils';
import { invoke } from '@tauri-apps/api/core';

import { Skeleton } from '../ui/skeleton';
import { NoteContent } from './BoardNoteItem';
import { StackItem } from './StackItem';
import { getSettings } from '@/resources/settings.resource';
import { useViewer } from '../Viewer/ViewerContext';
import { useDetailsPanel } from '../Layout/DetailsPanelContext';
import { useRefStore } from '@/state/refstore';
import { useSelectionStore } from '@/state/selectionStore';
import { deleteRef } from '@/lib/commands';
import { useViewerNavigation } from '@/hooks/use-viewer-navigation';

// Global cache of loaded images to persist across virtualization
const loadedImagesCache = new Set<string>();
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from '../ui/context-menu';
import {
  FiDownload,
  FiExternalLink,
  FiTrash2,
  FiCopy,
  FiEye,
  FiMaximize2,
  FiCheck,
  FiPlay,
  FiPlus,
} from 'react-icons/fi';
import { useCanvasListStore } from '@/state/canvasliststore';

// Memoized BoardItem to prevent unnecessary re-renders
export const BoardItem = memo<BoardItemProps>(
  (props) => {
    const type = props.refItem.metadata.ref_type;
    if (type === 'image')
      return <ImageItem mediaInfo={props.refItem as ImageRef} />;
    if (type === 'video')
      return <VideoItem mediaInfo={props.refItem as VideoRef} />;
    if (type === 'note')
      return <NoteItem noteInfo={props.refItem as NoteRef} />;
    if (type === 'audio')
      return <AudioItem audioInfo={props.refItem as AudioRef} />;
    if (type === 'stack')
      return <StackItem stackInfo={props.refItem as StackRef} />;
    if (type === 'design')
      return <DesignItem designInfo={props.refItem as DesignRef} />;
    if (type === 'model')
      return <ModelItem modelInfo={props.refItem as ModelRef} />;
    return <LinkItem linkInfo={props.refItem as LinkRef} />;
  },
  (prev, next) => {
    return prev.refItem.metadata.id === next.refItem.metadata.id;
  },
);

// Context Menu Wrapper Component
interface RefContextMenuProps {
  children: React.ReactNode;
  refItem: Ref;
  onExport?: () => void;
  onOpenLink?: () => void;
  onOpenExternal?: () => void;
}

const RefContextMenu = memo<RefContextMenuProps>(
  ({ children, refItem, onExport, onOpenLink, onOpenExternal }) => {
    const navigateToViewer = useViewerNavigation();
    const deleteRefFromStore = useRefStore((state) => state.deleteRef);
    const { openViewer } = useViewer();

    // Canvas-related state
    const canvases = useCanvasListStore((state) => state.canvases);

    const handleDelete = useCallback(async () => {
      try {
        await deleteRef(refItem.metadata.id);
        deleteRefFromStore(refItem.metadata.id);
      } catch (error) {
        console.error('Failed to delete ref:', error);
      }
    }, [refItem.metadata.id, deleteRefFromStore]);

    const handleCopyId = useCallback(() => {
      navigator.clipboard.writeText(refItem.metadata.id);
    }, [refItem.metadata.id]);

    const handleQuickPreview = useCallback(() => {
      openViewer(refItem);
    }, [openViewer, refItem]);

    const handleOpenViewer = useCallback(() => {
      navigateToViewer(refItem.metadata.id);
    }, [navigateToViewer, refItem.metadata.id]);

    const isMedia =
      refItem.metadata.ref_type === 'image' ||
      refItem.metadata.ref_type === 'video' ||
      refItem.metadata.ref_type === 'audio';
    const isLink = refItem.metadata.ref_type === 'link';
    const isDesign = refItem.metadata.ref_type === 'design';
    const isModel = refItem.metadata.ref_type === 'model';

    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={handleQuickPreview}>
            <FiEye className="mr-2 h-4 w-4" />
            Quick Preview
            <span className="text-muted-foreground ml-auto text-xs">Space</span>
          </ContextMenuItem>

          <ContextMenuItem onClick={handleOpenViewer}>
            <FiMaximize2 className="mr-2 h-4 w-4" />
            Open Viewer
          </ContextMenuItem>

          <ContextMenuSeparator />

          {/* Add to Canvas submenu */}
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <FiPlus className="mr-2 h-4 w-4" />
              Add to Canvas
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-48">
              {canvases.length === 0 ? (
                <ContextMenuItem disabled>
                  No canvases available
                </ContextMenuItem>
              ) : (
                <>
                  {canvases.slice(0, 10).map((canvas) => (
                    <ContextMenuItem key={canvas.id} disabled>
                      {canvas.name}
                    </ContextMenuItem>
                  ))}
                  {canvases.length > 10 && (
                    <ContextMenuItem disabled>
                      +{canvases.length - 10} more...
                    </ContextMenuItem>
                  )}
                  <ContextMenuSeparator />
                  <ContextMenuItem disabled>
                    <span className="text-muted-foreground text-xs">
                      Open canvas to add refs
                    </span>
                  </ContextMenuItem>
                </>
              )}
            </ContextMenuSubContent>
          </ContextMenuSub>

          <ContextMenuSeparator />

          {(isMedia || isDesign || isModel) && onExport && (
            <ContextMenuItem onClick={onExport}>
              <FiDownload className="mr-2 h-4 w-4" />
              Export
            </ContextMenuItem>
          )}

          {isDesign && onOpenExternal && (
            <ContextMenuItem onClick={onOpenExternal}>
              <FiExternalLink className="mr-2 h-4 w-4" />
              Open in External App
            </ContextMenuItem>
          )}

          {isLink && onOpenLink && (
            <ContextMenuItem onClick={onOpenLink}>
              <FiExternalLink className="mr-2 h-4 w-4" />
              Open Link
            </ContextMenuItem>
          )}

          <ContextMenuItem onClick={handleCopyId}>
            <FiCopy className="mr-2 h-4 w-4" />
            Copy ID
          </ContextMenuItem>

          <ContextMenuSeparator />

          <ContextMenuItem variant="destructive" onClick={handleDelete}>
            <FiTrash2 className="mr-2 h-4 w-4" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  },
);

// Helper to safely get aspect ratio
const getAspectRatio = (
  dimensions: [number, number] | null | undefined,
): string => {
  if (!dimensions || !Array.isArray(dimensions) || dimensions.length < 2) {
    return '1/1'; // Default square aspect ratio
  }
  const [width, height] = dimensions;
  if (!width || !height || width <= 0 || height <= 0) {
    return '1/1';
  }
  return `${width}/${height}`;
};

// Lazy loading image component with IntersectionObserver and global cache
const LazyImage = memo<{ src: string; aspectRatio: string; className: string }>(
  ({ src, aspectRatio, className }) => {
    const [isLoaded, setIsLoaded] = useState(() => loadedImagesCache.has(src));
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      // Already loaded from cache
      if (loadedImagesCache.has(src)) {
        setIsLoaded(true);
        return;
      }

      const container = containerRef.current;
      if (!container) return;

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            // Preload the image
            const img = new Image();
            img.onload = () => {
              loadedImagesCache.add(src);
              setIsLoaded(true);
            };
            img.onerror = () => {
              // Still mark as "loaded" to show placeholder
              setIsLoaded(true);
            };
            img.src = src;
            observer.disconnect();
          }
        },
        { rootMargin: '200px' },
      );

      observer.observe(container);

      return () => observer.disconnect();
    }, [src]);

    return (
      <div
        ref={containerRef}
        className={className}
        style={{
          aspectRatio,
          backgroundImage: isLoaded ? `url(${src})` : undefined,
          backgroundColor: isLoaded ? undefined : 'hsl(var(--muted))',
        }}
      />
    );
  },
);

LazyImage.displayName = 'LazyImage';

// Render an image into the board
const ImageItem = memo<{ mediaInfo: ImageRef }>(
  (props) => {
    const navigateToViewer = useViewerNavigation();
    const { openViewer } = useViewer();
    const { selectItem } = useDetailsPanel();
    const isSelected = useSelectionStore((state) =>
      state.selectedIds.includes(props.mediaInfo.metadata.id),
    );
    const isFocused = useSelectionStore(
      (state) => state.focusedId === props.mediaInfo.metadata.id,
    );
    const toggleSelect = useSelectionStore((state) => state.toggleSelect);
    const setFocused = useSelectionStore((state) => state.setFocused);

    const handleClick = useCallback(
      (e: React.MouseEvent) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          toggleSelect(props.mediaInfo.metadata.id);
        } else {
          selectItem(props.mediaInfo);
          setFocused(props.mediaInfo.metadata.id);
        }
      },
      [selectItem, props.mediaInfo, toggleSelect, setFocused],
    );

    const handleDoubleClick = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        navigateToViewer(props.mediaInfo.metadata.id);
      },
      [navigateToViewer, props.mediaInfo.metadata.id],
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.code === 'Space') {
          e.preventDefault();
          openViewer(props.mediaInfo);
        } else if (e.code === 'Enter') {
          e.preventDefault();
          navigateToViewer(props.mediaInfo.metadata.id);
        }
      },
      [openViewer, props.mediaInfo, navigateToViewer],
    );

    const handleExport = useCallback(async () => {
      try {
        await saveMediaToDisk(
          props.mediaInfo.metadata.id,
          props.mediaInfo.metadata.file_name,
        );
      } catch (error) {
        console.error('Failed to export image:', error);
      }
    }, [props.mediaInfo.metadata.id, props.mediaInfo.metadata.file_name]);

    const aspectRatio = getAspectRatio(props.mediaInfo.metadata.dimensions);
    // For GIFs, always use the full image path to preserve animation
    const isGif =
      props.mediaInfo.metadata.file_name?.toLowerCase().endsWith('.gif') ||
      props.mediaInfo.metadata.media_type?.includes('gif');
    const imagePath = isGif
      ? props.mediaInfo.image_path
      : props.mediaInfo.low_res_imagepath || props.mediaInfo.image_path;
    const imageUrl = toAssetUrl(imagePath);

    return (
      <RefContextMenu refItem={props.mediaInfo} onExport={handleExport}>
        <div className="relative">
          {isSelected && (
            <div className="bg-primary text-primary-foreground absolute -top-1 -right-1 z-10 flex h-5 w-5 items-center justify-center rounded-full shadow-md">
              <FiCheck className="h-3 w-3" />
            </div>
          )}
          <LazyImage
            src={imageUrl}
            aspectRatio={aspectRatio}
            className={cn(
              'hover:shadow-foreground/20 focus-visible:ring-primary/50 cursor-pointer rounded-xl bg-cover bg-center bg-no-repeat shadow-sm transition-all duration-300 hover:shadow-md focus-visible:ring-2 focus-visible:outline-none',
              isSelected
                ? 'ring-offset-background ring-4 ring-blue-500 ring-offset-2'
                : isFocused
                  ? 'ring-primary ring-offset-background ring-2 ring-offset-1'
                  : 'hover:ring-2 hover:ring-blue-500/50',
            )}
          />
          <div
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            onKeyDown={handleKeyDown}
            className="absolute inset-0"
            tabIndex={0}
            role="button"
            aria-label={props.mediaInfo.metadata.name || 'Image item'}
          />
          {props.mediaInfo.metadata.name && (
            <p className="text-foreground/70 mt-[10px] h-5 overflow-hidden text-center text-sm font-medium text-ellipsis whitespace-nowrap">
              {props.mediaInfo.metadata.name}
            </p>
          )}
        </div>
      </RefContextMenu>
    );
  },
  (prev, next) => prev.mediaInfo.metadata.id === next.mediaInfo.metadata.id,
);

ImageItem.displayName = 'ImageItem';

// Render a video into the board with lazy loading for performance
const VideoItem = memo<{ mediaInfo: VideoRef }>(
  (props) => {
    const navigateToViewer = useViewerNavigation();
    const settings = getSettings();
    const { openViewer } = useViewer();
    const { selectItem } = useDetailsPanel();
    const isSelected = useSelectionStore((state) =>
      state.selectedIds.includes(props.mediaInfo.metadata.id),
    );
    const isFocused = useSelectionStore(
      (state) => state.focusedId === props.mediaInfo.metadata.id,
    );
    const toggleSelect = useSelectionStore((state) => state.toggleSelect);
    const setFocused = useSelectionStore((state) => state.setFocused);

    // State for lazy loading and hover
    const [isNearViewport, setIsNearViewport] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Intersection Observer for lazy loading - only load video when near viewport
    useEffect(() => {
      const element = containerRef.current;
      if (!element) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            // Load when within 200px of viewport
            setIsNearViewport(entry.isIntersecting);
          });
        },
        {
          rootMargin: '200px', // Start loading 200px before entering viewport
          threshold: 0,
        },
      );

      observer.observe(element);
      return () => observer.disconnect();
    }, []);

    // Handle hover state for autoplay
    const handleMouseEnter = useCallback(() => {
      setIsHovered(true);
      // If autoplay is enabled, play video on hover
      if (settings?.appearance.video_ref_autoplay && videoRef.current) {
        videoRef.current.play().catch(() => {
          // Ignore autoplay errors (browser restrictions)
        });
      }
    }, [settings?.appearance.video_ref_autoplay]);

    const handleMouseLeave = useCallback(() => {
      setIsHovered(false);
      // Pause and reset video when leaving
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }, []);

    const handleClick = useCallback(
      (e: React.MouseEvent) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          toggleSelect(props.mediaInfo.metadata.id);
        } else {
          selectItem(props.mediaInfo);
          setFocused(props.mediaInfo.metadata.id);
        }
      },
      [selectItem, props.mediaInfo, toggleSelect, setFocused],
    );

    const handleDoubleClick = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        navigateToViewer(props.mediaInfo.metadata.id);
      },
      [navigateToViewer, props.mediaInfo.metadata.id],
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.code === 'Space') {
          e.preventDefault();
          openViewer(props.mediaInfo);
        } else if (e.code === 'Enter') {
          e.preventDefault();
          navigateToViewer(props.mediaInfo.metadata.id);
        }
      },
      [openViewer, props.mediaInfo, navigateToViewer],
    );

    const handleExport = useCallback(async () => {
      try {
        await saveMediaToDisk(
          props.mediaInfo.metadata.id,
          props.mediaInfo.metadata.file_name,
        );
      } catch (error) {
        console.error('Failed to export video:', error);
      }
    }, [props.mediaInfo.metadata.id, props.mediaInfo.metadata.file_name]);

    // Determine if we should show the video or placeholder
    const showVideo = isNearViewport;
    const autoPlayEnabled = settings?.appearance.video_ref_autoplay ?? false;

    return (
      <RefContextMenu refItem={props.mediaInfo} onExport={handleExport}>
        <div className="relative" ref={containerRef}>
          {isSelected && (
            <div className="bg-primary text-primary-foreground absolute -top-1 -right-1 z-10 flex h-5 w-5 items-center justify-center rounded-full shadow-md">
              <FiCheck className="h-3 w-3" />
            </div>
          )}
          <div
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            onKeyDown={handleKeyDown}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={cn(
              'hover:shadow-foreground/20 focus-visible:ring-primary/50 relative h-[400px] cursor-pointer overflow-hidden rounded-xl shadow-sm transition-all duration-300 hover:shadow-md focus-visible:ring-2 focus-visible:outline-none',
              isSelected
                ? 'ring-offset-background ring-4 ring-blue-500 ring-offset-2'
                : isFocused
                  ? 'ring-primary ring-offset-background ring-2 ring-offset-1'
                  : 'hover:ring-2 hover:ring-blue-500/50',
            )}
            tabIndex={0}
            role="button"
            aria-label={props.mediaInfo.metadata.name || 'Video item'}
          >
            {showVideo ? (
              <video
                ref={videoRef}
                className="absolute h-full w-full rounded-xl object-cover"
                src={toAssetUrl(props.mediaInfo.video_path)}
                preload="metadata"
                loop
                muted
                playsInline
              />
            ) : (
              // Placeholder when not near viewport
              <div className="bg-muted absolute flex h-full w-full items-center justify-center rounded-xl">
                <div className="bg-background/80 flex h-16 w-16 items-center justify-center rounded-full">
                  <FiPlay className="text-muted-foreground h-8 w-8" />
                </div>
              </div>
            )}

            {/* Play icon overlay - show when not playing */}
            {showVideo && !isHovered && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="bg-background/60 flex h-12 w-12 items-center justify-center rounded-full backdrop-blur-sm">
                  <FiPlay className="text-foreground ml-1 h-6 w-6" />
                </div>
              </div>
            )}

            {/* Hint text for non-autoplay mode */}
            {showVideo && !autoPlayEnabled && isHovered && (
              <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center">
                <span className="bg-background/80 rounded-full px-2 py-1 text-xs backdrop-blur-sm">
                  Double-click to play
                </span>
              </div>
            )}
          </div>
          {props.mediaInfo.metadata.name && (
            <p className="text-foreground/70 mt-[10px] h-5 overflow-hidden text-center text-sm font-medium text-ellipsis whitespace-nowrap">
              {props.mediaInfo.metadata.name}
            </p>
          )}
        </div>
      </RefContextMenu>
    );
  },
  (prev, next) => prev.mediaInfo.metadata.id === next.mediaInfo.metadata.id,
);

VideoItem.displayName = 'VideoItem';

// Other items remain similar with memo wrapper...
const NoteItem = memo<{ noteInfo: NoteRef }>(
  (props) => {
    const navigateToViewer = useViewerNavigation();
    const { openViewer } = useViewer();
    const { selectItem } = useDetailsPanel();
    const isSelected = useSelectionStore((state) =>
      state.selectedIds.includes(props.noteInfo.metadata.id),
    );
    const isFocused = useSelectionStore(
      (state) => state.focusedId === props.noteInfo.metadata.id,
    );
    const toggleSelect = useSelectionStore((state) => state.toggleSelect);
    const setFocused = useSelectionStore((state) => state.setFocused);

    const handleClick = useCallback(
      (e: React.MouseEvent) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          toggleSelect(props.noteInfo.metadata.id);
        } else {
          selectItem(props.noteInfo);
          setFocused(props.noteInfo.metadata.id);
        }
      },
      [selectItem, props.noteInfo, toggleSelect, setFocused],
    );

    const handleDoubleClick = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        navigateToViewer(props.noteInfo.metadata.id);
      },
      [navigateToViewer, props.noteInfo.metadata.id],
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.code === 'Space') {
          e.preventDefault();
          openViewer(props.noteInfo);
        } else if (e.code === 'Enter') {
          e.preventDefault();
          navigateToViewer(props.noteInfo.metadata.id);
        }
      },
      [openViewer, props.noteInfo, navigateToViewer],
    );

    return (
      <RefContextMenu refItem={props.noteInfo}>
        <div className="relative">
          {isSelected && (
            <div className="bg-primary text-primary-foreground absolute -top-1 -right-1 z-10 flex h-5 w-5 items-center justify-center rounded-full shadow-md">
              <FiCheck className="h-3 w-3" />
            </div>
          )}
          <div
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            onKeyDown={handleKeyDown}
            className={cn(
              'bg-foreground/5 hover:bg-foreground/10 focus-visible:ring-primary/50 max-h-[500px] min-h-[50px] w-full cursor-pointer overflow-hidden rounded-xl p-6 text-start shadow-sm transition-all duration-300 hover:shadow-md focus-visible:ring-2 focus-visible:outline-none',
              isSelected
                ? 'ring-offset-background ring-4 ring-blue-500 ring-offset-2'
                : isFocused
                  ? 'ring-primary ring-offset-background ring-2 ring-offset-1'
                  : 'hover:ring-2 hover:ring-blue-500/50',
            )}
            tabIndex={0}
            role="button"
            aria-label={props.noteInfo.metadata.name || 'Note item'}
          >
            <NoteContent data={props.noteInfo} />
          </div>
          {props.noteInfo.metadata.name && (
            <p className="text-foreground/70 mt-[10px] h-5 overflow-hidden text-center text-sm font-medium text-ellipsis whitespace-nowrap">
              {props.noteInfo.metadata.name}
            </p>
          )}
        </div>
      </RefContextMenu>
    );
  },
  (prev, next) => prev.noteInfo.metadata.id === next.noteInfo.metadata.id,
);

NoteItem.displayName = 'NoteItem';

const AudioItem = memo<{ audioInfo: AudioRef }>(
  (props) => {
    const navigateToViewer = useViewerNavigation();
    const { openViewer } = useViewer();
    const { selectItem } = useDetailsPanel();
    const isSelected = useSelectionStore((state) =>
      state.selectedIds.includes(props.audioInfo.metadata.id),
    );
    const isFocused = useSelectionStore(
      (state) => state.focusedId === props.audioInfo.metadata.id,
    );
    const toggleSelect = useSelectionStore((state) => state.toggleSelect);
    const setFocused = useSelectionStore((state) => state.setFocused);

    const handleClick = useCallback(
      (e: React.MouseEvent) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          toggleSelect(props.audioInfo.metadata.id);
        } else {
          selectItem(props.audioInfo);
          setFocused(props.audioInfo.metadata.id);
        }
      },
      [selectItem, props.audioInfo, toggleSelect, setFocused],
    );

    const handleDoubleClick = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        navigateToViewer(props.audioInfo.metadata.id);
      },
      [navigateToViewer, props.audioInfo.metadata.id],
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.code === 'Space') {
          e.preventDefault();
          openViewer(props.audioInfo);
        } else if (e.code === 'Enter') {
          e.preventDefault();
          navigateToViewer(props.audioInfo.metadata.id);
        }
      },
      [openViewer, props.audioInfo, navigateToViewer],
    );

    const handleExport = useCallback(async () => {
      try {
        await saveMediaToDisk(
          props.audioInfo.metadata.id,
          props.audioInfo.metadata.file_name,
        );
      } catch (error) {
        console.error('Failed to export audio:', error);
      }
    }, [props.audioInfo.metadata.id, props.audioInfo.metadata.file_name]);

    return (
      <RefContextMenu refItem={props.audioInfo} onExport={handleExport}>
        <div className="relative">
          {isSelected && (
            <div className="bg-primary text-primary-foreground absolute -top-1 -right-1 z-10 flex h-5 w-5 items-center justify-center rounded-full shadow-md">
              <FiCheck className="h-3 w-3" />
            </div>
          )}
          <div
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            onKeyDown={handleKeyDown}
            className={cn(
              'bg-foreground/5 hover:bg-foreground/10 focus-visible:ring-primary/50 flex h-[120px] cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl p-6 shadow-sm transition-all duration-300 hover:shadow-md focus-visible:ring-2 focus-visible:outline-none',
              isSelected
                ? 'ring-offset-background ring-4 ring-blue-500 ring-offset-2'
                : isFocused
                  ? 'ring-primary ring-offset-background ring-2 ring-offset-1'
                  : 'hover:ring-2 hover:ring-blue-500/50',
            )}
            tabIndex={0}
            role="button"
            aria-label={props.audioInfo.metadata.name || 'Audio item'}
          >
            <div className="bg-primary/20 flex h-12 w-12 items-center justify-center rounded-full">
              <svg
                className="text-primary h-6 w-6"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
            <span className="text-muted-foreground text-xs">
              {props.audioInfo.metadata.file_size}
            </span>
          </div>
          {props.audioInfo.metadata.name && (
            <p className="text-foreground/70 mt-[10px] h-5 overflow-hidden text-center text-sm font-medium text-ellipsis whitespace-nowrap">
              {props.audioInfo.metadata.name}
            </p>
          )}
        </div>
      </RefContextMenu>
    );
  },
  (prev, next) => prev.audioInfo.metadata.id === next.audioInfo.metadata.id,
);

AudioItem.displayName = 'AudioItem';

const LinkItem = memo<{ linkInfo: LinkRef }>(
  (props) => {
    const navigateToViewer = useViewerNavigation();
    const { openViewer } = useViewer();
    const { selectItem } = useDetailsPanel();
    const isSelected = useSelectionStore((state) =>
      state.selectedIds.includes(props.linkInfo.metadata.id),
    );
    const isFocused = useSelectionStore(
      (state) => state.focusedId === props.linkInfo.metadata.id,
    );
    const toggleSelect = useSelectionStore((state) => state.toggleSelect);
    const setFocused = useSelectionStore((state) => state.setFocused);

    const handleClick = useCallback(
      (e: React.MouseEvent) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          toggleSelect(props.linkInfo.metadata.id);
        } else {
          selectItem(props.linkInfo);
          setFocused(props.linkInfo.metadata.id);
        }
      },
      [selectItem, props.linkInfo, toggleSelect, setFocused],
    );

    const handleDoubleClick = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        navigateToViewer(props.linkInfo.metadata.id);
      },
      [navigateToViewer, props.linkInfo.metadata.id],
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.code === 'Space') {
          e.preventDefault();
          openViewer(props.linkInfo);
        } else if (e.code === 'Enter') {
          e.preventDefault();
          navigateToViewer(props.linkInfo.metadata.id);
        }
      },
      [openViewer, props.linkInfo, navigateToViewer],
    );

    const handleOpenLink = useCallback(() => {
      if (props.linkInfo.metadata.source_uri) {
        window.open(props.linkInfo.metadata.source_uri, '_blank');
      }
    }, [props.linkInfo.metadata.source_uri]);

    const snapshotPath = props.linkInfo.snapshoot;
    const imageUrl = snapshotPath ? toAssetUrl(snapshotPath) : undefined;

    return (
      <RefContextMenu refItem={props.linkInfo} onOpenLink={handleOpenLink}>
        <div className="relative">
          {isSelected && (
            <div className="bg-primary text-primary-foreground absolute -top-1 -right-1 z-10 flex h-5 w-5 items-center justify-center rounded-full shadow-md">
              <FiCheck className="h-3 w-3" />
            </div>
          )}
          {imageUrl && (
            <LazyImage
              src={imageUrl}
              aspectRatio="4/3"
              className={cn(
                'hover:shadow-foreground/20 focus-visible:ring-primary/50 cursor-pointer rounded-xl bg-cover bg-center bg-no-repeat shadow-sm transition-all duration-300 hover:shadow-md focus-visible:ring-2 focus-visible:outline-none',
                isSelected
                  ? 'ring-offset-background ring-4 ring-blue-500 ring-offset-2'
                  : isFocused
                    ? 'ring-primary ring-offset-background ring-2 ring-offset-1'
                    : 'hover:ring-2 hover:ring-blue-500/50',
              )}
            />
          )}
          <div
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            onKeyDown={handleKeyDown}
            className="absolute inset-0"
            tabIndex={0}
            role="button"
            aria-label={props.linkInfo.metadata.name || 'Link item'}
          />
          {props.linkInfo.metadata.name && (
            <p className="text-foreground/70 mt-[10px] h-5 overflow-hidden text-center text-sm font-medium text-ellipsis whitespace-nowrap">
              {props.linkInfo.metadata.name}
            </p>
          )}
        </div>
      </RefContextMenu>
    );
  },
  (prev, next) => prev.linkInfo.metadata.id === next.linkInfo.metadata.id,
);

LinkItem.displayName = 'LinkItem';

// Render a design file (PSD, AI, EPS, PDF) into the board
const DesignItem = memo<{ designInfo: DesignRef }>(
  (props) => {
    const navigateToViewer = useViewerNavigation();
    const { openViewer } = useViewer();
    const { selectItem } = useDetailsPanel();
    const isSelected = useSelectionStore((state) =>
      state.selectedIds.includes(props.designInfo.metadata.id),
    );
    const isFocused = useSelectionStore(
      (state) => state.focusedId === props.designInfo.metadata.id,
    );
    const toggleSelect = useSelectionStore((state) => state.toggleSelect);
    const setFocused = useSelectionStore((state) => state.setFocused);

    const handleClick = useCallback(
      (e: React.MouseEvent) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          toggleSelect(props.designInfo.metadata.id);
        } else {
          selectItem(props.designInfo);
          setFocused(props.designInfo.metadata.id);
        }
      },
      [selectItem, props.designInfo, toggleSelect, setFocused],
    );

    const handleDoubleClick = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        navigateToViewer(props.designInfo.metadata.id);
      },
      [navigateToViewer, props.designInfo.metadata.id],
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.code === 'Space') {
          e.preventDefault();
          openViewer(props.designInfo);
        } else if (e.code === 'Enter') {
          e.preventDefault();
          navigateToViewer(props.designInfo.metadata.id);
        }
      },
      [openViewer, props.designInfo, navigateToViewer],
    );

    const handleExport = useCallback(async () => {
      try {
        await saveMediaToDisk(
          props.designInfo.metadata.id,
          props.designInfo.metadata.file_name,
        );
      } catch (error) {
        console.error('Failed to export design file:', error);
      }
    }, [props.designInfo.metadata.id, props.designInfo.metadata.file_name]);

    const handleOpenExternal = useCallback(async () => {
      try {
        const designPath = props.designInfo.design_path;
        await invoke('open_file_external', { path: designPath });
      } catch (error) {
        console.error('Failed to open in external app:', error);
      }
    }, [props.designInfo.design_path]);

    // Use thumbnail if available, otherwise show placeholder
    const thumbnailUrl = props.designInfo.thumbnail_path
      ? toAssetUrl(props.designInfo.thumbnail_path)
      : undefined;
    const aspectRatio = getAspectRatio(props.designInfo.metadata.dimensions);

    // Get file extension for display
    const fileExt = props.designInfo.metadata.file_name
      ?.split('.')
      .pop()
      ?.toUpperCase();

    return (
      <RefContextMenu
        refItem={props.designInfo}
        onExport={handleExport}
        onOpenExternal={handleOpenExternal}
      >
        <div className="relative">
          {isSelected && (
            <div className="bg-primary text-primary-foreground absolute -top-1 -right-1 z-10 flex h-5 w-5 items-center justify-center rounded-full shadow-md">
              <FiCheck className="h-3 w-3" />
            </div>
          )}
          {thumbnailUrl ? (
            <LazyImage
              src={thumbnailUrl}
              aspectRatio={aspectRatio}
              className={cn(
                'hover:shadow-foreground/20 focus-visible:ring-primary/50 cursor-pointer rounded-xl bg-cover bg-center bg-no-repeat shadow-sm transition-all duration-300 hover:shadow-md focus-visible:ring-2 focus-visible:outline-none',
                isSelected
                  ? 'ring-offset-background ring-4 ring-blue-500 ring-offset-2'
                  : isFocused
                    ? 'ring-primary ring-offset-background ring-2 ring-offset-1'
                    : 'hover:ring-2 hover:ring-blue-500/50',
              )}
            />
          ) : (
            <div
              className={cn(
                'bg-foreground/5 hover:bg-foreground/10 focus-visible:ring-primary/50 flex h-[200px] cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-xl p-6 shadow-sm transition-all duration-300 hover:shadow-md focus-visible:ring-2 focus-visible:outline-none',
                isSelected
                  ? 'ring-offset-background ring-4 ring-blue-500 ring-offset-2'
                  : isFocused
                    ? 'ring-primary ring-offset-background ring-2 ring-offset-1'
                    : 'hover:ring-2 hover:ring-blue-500/50',
              )}
            >
              <div className="bg-primary/20 flex h-16 w-16 items-center justify-center rounded-full">
                <svg
                  className="text-primary h-8 w-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <span className="bg-primary/10 text-primary rounded px-2 py-1 text-xs font-semibold">
                {fileExt}
              </span>
              <span className="text-muted-foreground text-xs">
                {props.designInfo.metadata.file_size}
              </span>
            </div>
          )}
          <div
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            onKeyDown={handleKeyDown}
            className="absolute inset-0"
            tabIndex={0}
            role="button"
            aria-label={props.designInfo.metadata.name || 'Design file'}
          />
          {props.designInfo.metadata.name && (
            <p className="text-foreground/70 mt-[10px] h-5 overflow-hidden text-center text-sm font-medium text-ellipsis whitespace-nowrap">
              {props.designInfo.metadata.name}
            </p>
          )}
        </div>
      </RefContextMenu>
    );
  },
  (prev, next) => prev.designInfo.metadata.id === next.designInfo.metadata.id,
);

DesignItem.displayName = 'DesignItem';

// Render a 3D model (GLB, GLTF, OBJ, FBX, STL) into the board
const ModelItem = memo<{ modelInfo: ModelRef }>(
  (props) => {
    const navigateToViewer = useViewerNavigation();
    const { openViewer } = useViewer();
    const { selectItem } = useDetailsPanel();
    const isSelected = useSelectionStore((state) =>
      state.selectedIds.includes(props.modelInfo.metadata.id),
    );
    const isFocused = useSelectionStore(
      (state) => state.focusedId === props.modelInfo.metadata.id,
    );
    const toggleSelect = useSelectionStore((state) => state.toggleSelect);
    const setFocused = useSelectionStore((state) => state.setFocused);

    const handleClick = useCallback(
      (e: React.MouseEvent) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          toggleSelect(props.modelInfo.metadata.id);
        } else {
          selectItem(props.modelInfo);
          setFocused(props.modelInfo.metadata.id);
        }
      },
      [selectItem, props.modelInfo, toggleSelect, setFocused],
    );

    const handleDoubleClick = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        navigateToViewer(props.modelInfo.metadata.id);
      },
      [navigateToViewer, props.modelInfo.metadata.id],
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.code === 'Space') {
          e.preventDefault();
          openViewer(props.modelInfo);
        } else if (e.code === 'Enter') {
          e.preventDefault();
          navigateToViewer(props.modelInfo.metadata.id);
        }
      },
      [openViewer, props.modelInfo, navigateToViewer],
    );

    const handleExport = useCallback(async () => {
      try {
        await saveMediaToDisk(
          props.modelInfo.metadata.id,
          props.modelInfo.metadata.file_name,
        );
      } catch (error) {
        console.error('Failed to export model file:', error);
      }
    }, [props.modelInfo.metadata.id, props.modelInfo.metadata.file_name]);

    // Get file extension for display
    const fileExt = props.modelInfo.metadata.file_name
      ?.split('.')
      .pop()
      ?.toUpperCase();

    return (
      <RefContextMenu refItem={props.modelInfo} onExport={handleExport}>
        <div className="relative">
          {isSelected && (
            <div className="bg-primary text-primary-foreground absolute -top-1 -right-1 z-10 flex h-5 w-5 items-center justify-center rounded-full shadow-md">
              <FiCheck className="h-3 w-3" />
            </div>
          )}
          <div
            className={cn(
              'bg-foreground/5 hover:bg-foreground/10 focus-visible:ring-primary/50 flex h-[200px] cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-xl p-6 shadow-sm transition-all duration-300 hover:shadow-md focus-visible:ring-2 focus-visible:outline-none',
              isSelected
                ? 'ring-offset-background ring-4 ring-blue-500 ring-offset-2'
                : isFocused
                  ? 'ring-primary ring-offset-background ring-2 ring-offset-1'
                  : 'hover:ring-2 hover:ring-blue-500/50',
            )}
          >
            {/* 3D cube icon */}
            <div className="bg-primary/20 flex h-16 w-16 items-center justify-center rounded-full">
              <svg
                className="text-primary h-8 w-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <span className="bg-primary/10 text-primary rounded px-2 py-1 text-xs font-semibold">
              {fileExt}
            </span>
            <span className="text-muted-foreground text-xs">
              {props.modelInfo.metadata.file_size}
            </span>
            {(props.modelInfo.metadata.vertex_count ||
              props.modelInfo.metadata.face_count) && (
              <span className="text-muted-foreground text-xs">
                {props.modelInfo.metadata.vertex_count?.toLocaleString()} verts
                {props.modelInfo.metadata.face_count &&
                  ` / ${props.modelInfo.metadata.face_count.toLocaleString()} faces`}
              </span>
            )}
          </div>
          <div
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            onKeyDown={handleKeyDown}
            className="absolute inset-0"
            tabIndex={0}
            role="button"
            aria-label={props.modelInfo.metadata.name || '3D Model'}
          />
          {props.modelInfo.metadata.name && (
            <p className="text-foreground/70 mt-[10px] h-5 overflow-hidden text-center text-sm font-medium text-ellipsis whitespace-nowrap">
              {props.modelInfo.metadata.name}
            </p>
          )}
        </div>
      </RefContextMenu>
    );
  },
  (prev, next) => prev.modelInfo.metadata.id === next.modelInfo.metadata.id,
);

ModelItem.displayName = 'ModelItem';

export const BoardItemSkeleton = () => {
  return (
    <Skeleton className="m-3 h-[300px] w-[200px] cursor-pointer rounded-xl shadow-md md:h-[400px] md:w-[300px]" />
  );
};
