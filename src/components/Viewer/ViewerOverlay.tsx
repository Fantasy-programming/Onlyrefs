import React, {
  useEffect,
  useCallback,
  useRef,
  useState,
  useMemo,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHotkeys } from 'react-hotkeys-hook';
import {
  FiX,
  FiDownload,
  FiExternalLink,
  FiTrash2,
  FiZoomIn,
  FiZoomOut,
} from 'react-icons/fi';
import { emit } from '@tauri-apps/api/event';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import { Markdown } from 'tiptap-markdown';
import { debounce } from 'lodash-es';

import { useViewer } from './ViewerContext';
import {
  ImageRef,
  VideoRef,
  NoteRef,
  LinkRef,
  AudioRef,
  Ref,
} from '@/lib/types';
import { toAssetUrl, saveMediaToDisk, elapsedTime } from '@/lib/helper';
import { deleteRef } from '@/lib/commands';
import { useRefStore } from '@/state/refstore';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

export const ViewerOverlay: React.FC = () => {
  const { isOpen, currentRef, closeViewer } = useViewer();

  // Close on escape key using react-hotkeys-hook
  useHotkeys(
    'escape',
    () => {
      if (isOpen) closeViewer();
    },
    { enabled: isOpen },
    [isOpen, closeViewer],
  );

  // Prevent body scroll when overlay is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && currentRef && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={closeViewer}
        >
          {/* Close button */}
          <button
            onClick={closeViewer}
            className="absolute top-4 right-4 z-50 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
          >
            <FiX className="h-6 w-6" />
          </button>

          {/* Content */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative max-h-[90vh] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <ViewerContent refItem={currentRef} onClose={closeViewer} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface ViewerContentProps {
  refItem: Ref;
  onClose: () => void;
}

const ViewerContent: React.FC<ViewerContentProps> = ({ refItem, onClose }) => {
  const type = refItem.metadata.ref_type;

  switch (type) {
    case 'image':
      return <ImageViewer imageRef={refItem as ImageRef} onClose={onClose} />;
    case 'video':
      return <VideoViewer videoRef={refItem as VideoRef} onClose={onClose} />;
    case 'note':
      return <NoteViewer noteRef={refItem as NoteRef} onClose={onClose} />;
    case 'link':
      return <LinkViewer linkRef={refItem as LinkRef} onClose={onClose} />;
    case 'audio':
      return <AudioViewer audioRef={refItem as AudioRef} onClose={onClose} />;
    default:
      return <div className="text-white">Unsupported type</div>;
  }
};

// Image Viewer
interface ImageViewerProps {
  imageRef: ImageRef;
  onClose: () => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ imageRef, onClose }) => {
  const deleteRefFromStore = useRefStore((state) => state.deleteRef);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const handleResetZoom = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((z) => Math.min(Math.max(z + delta, 0.5), 3));
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      dragStart.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y,
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleExport = async () => {
    await saveMediaToDisk(imageRef.metadata.id, imageRef.metadata.file_name);
  };

  const handleDelete = async () => {
    await deleteRef(imageRef.metadata.id);
    deleteRefFromStore(imageRef.metadata.id);
    onClose();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Image container */}
      <div
        ref={imageContainerRef}
        className={cn(
          'relative flex items-center justify-center overflow-hidden rounded-xl bg-black/40',
          zoom > 1 ? 'cursor-grab' : 'cursor-zoom-in',
          isDragging && 'cursor-grabbing',
        )}
        style={{ maxHeight: '70vh', maxWidth: '80vw' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleResetZoom}
      >
        <img
          src={toAssetUrl(imageRef.image_path)}
          alt={imageRef.metadata.name || 'Image'}
          className="max-h-[70vh] max-w-[80vw] object-contain transition-transform"
          style={{
            transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
          }}
          draggable={false}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-white">
            {imageRef.metadata.name || 'Untitled'}
          </span>
          <span className="text-xs text-white/60">
            {imageRef.metadata.dimensions[0]} x{' '}
            {imageRef.metadata.dimensions[1]}
          </span>
          <span className="text-xs text-white/60">
            {imageRef.metadata.file_size}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 rounded-lg bg-white/10 p-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-white hover:bg-white/20 hover:text-white"
              onClick={handleZoomOut}
            >
              <FiZoomOut className="h-4 w-4" />
            </Button>
            <span className="min-w-[3rem] text-center text-xs text-white">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-white hover:bg-white/20 hover:text-white"
              onClick={handleZoomIn}
            >
              <FiZoomIn className="h-4 w-4" />
            </Button>
          </div>

          <div className="mx-2 h-6 w-px bg-white/20" />

          {/* Action buttons */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-2 text-white hover:bg-white/20 hover:text-white"
            onClick={handleExport}
          >
            <FiDownload className="h-4 w-4" />
            Export
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-2 text-red-400 hover:bg-red-500/20 hover:text-red-300"
            onClick={handleDelete}
          >
            <FiTrash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Color palette */}
      {imageRef.metadata.colors?.length > 0 && (
        <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 backdrop-blur-sm">
          <span className="text-xs text-white/60">Colors:</span>
          {imageRef.metadata.colors.map((color, index) => (
            <button
              key={index}
              className="h-6 w-6 rounded-full border-2 border-white/20 transition-transform hover:scale-110"
              style={{ backgroundColor: color }}
              title={`Copy ${color}`}
              onClick={() => navigator.clipboard.writeText(color)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Video Viewer
interface VideoViewerProps {
  videoRef: VideoRef;
  onClose: () => void;
}

const VideoViewer: React.FC<VideoViewerProps> = ({ videoRef, onClose }) => {
  const deleteRefFromStore = useRefStore((state) => state.deleteRef);
  const videoElementRef = useRef<HTMLVideoElement>(null);

  const handleExport = async () => {
    await saveMediaToDisk(videoRef.metadata.id, videoRef.metadata.file_name);
  };

  const handleDelete = async () => {
    await deleteRef(videoRef.metadata.id);
    deleteRefFromStore(videoRef.metadata.id);
    onClose();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Video container */}
      <div className="relative flex items-center justify-center overflow-hidden rounded-xl bg-black">
        <video
          ref={videoElementRef}
          src={toAssetUrl(videoRef.video_path)}
          className="max-h-[70vh] max-w-[80vw]"
          controls
          autoPlay
          loop
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-white">
            {videoRef.metadata.name || 'Untitled'}
          </span>
          {videoRef.metadata.dimensions && videoRef.metadata.dimensions[0] && (
            <span className="text-xs text-white/60">
              {videoRef.metadata.dimensions[0]} x{' '}
              {videoRef.metadata.dimensions[1]}
            </span>
          )}
          <span className="text-xs text-white/60">
            {videoRef.metadata.file_size}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-2 text-white hover:bg-white/20 hover:text-white"
            onClick={handleExport}
          >
            <FiDownload className="h-4 w-4" />
            Export
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-2 text-red-400 hover:bg-red-500/20 hover:text-red-300"
            onClick={handleDelete}
          >
            <FiTrash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

// Note Viewer/Editor
interface NoteViewerProps {
  noteRef: NoteRef;
  onClose: () => void;
}

const NoteViewer: React.FC<NoteViewerProps> = ({ noteRef, onClose }) => {
  const deleteRefFromStore = useRefStore((state) => state.deleteRef);
  const mutateNote = useRefStore((state) => state.mutateNote);

  const debouncedSave = useMemo(
    () =>
      debounce(async (text: string, path: string, id: string) => {
        await emit('note_changed', { id, path, content: text });
        mutateNote(id, text);
      }, 1000),
    [mutateNote],
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: 'Start writing your note here...' }),
      (Markdown as any).configure({
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    editorProps: {
      attributes: {
        class:
          'focus:outline-none prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg max-w-full min-h-[300px]',
      },
    },
    content: noteRef.content,
    onUpdate({ editor }) {
      try {
        const md = (editor.storage as any).markdown.getMarkdown();
        if (md) debouncedSave(md, noteRef.metapath, noteRef.metadata.id);
      } catch (e) {
        console.error('Failed to save note:', e);
      }
    },
  });

  const handleDelete = async () => {
    await deleteRef(noteRef.metadata.id);
    deleteRefFromStore(noteRef.metadata.id);
    onClose();
  };

  return (
    <div className="flex w-[700px] max-w-[90vw] flex-col gap-4">
      {/* Editor container */}
      <div className="bg-background max-h-[70vh] overflow-y-auto rounded-xl p-6">
        {editor && <EditorContent editor={editor} />}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-white">
            {noteRef.metadata.name || 'Untitled Note'}
          </span>
          <span className="text-xs text-white/60">
            {elapsedTime(noteRef.metadata.updated_at)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-2 text-red-400 hover:bg-red-500/20 hover:text-red-300"
            onClick={handleDelete}
          >
            <FiTrash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

// Link Viewer
interface LinkViewerProps {
  linkRef: LinkRef;
  onClose: () => void;
}

const LinkViewer: React.FC<LinkViewerProps> = ({ linkRef, onClose }) => {
  const deleteRefFromStore = useRefStore((state) => state.deleteRef);

  const handleOpenLink = () => {
    window.open(linkRef.metadata.source_uri, '_blank');
  };

  const handleDelete = async () => {
    await deleteRef(linkRef.metadata.id);
    deleteRefFromStore(linkRef.metadata.id);
    onClose();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Link preview */}
      <div className="relative overflow-hidden rounded-xl bg-black/40">
        <img
          src={toAssetUrl(linkRef.snapshoot)}
          alt={linkRef.metadata.name || 'Link preview'}
          className="max-h-[60vh] max-w-[80vw] object-contain"
        />
      </div>

      {/* URL display */}
      <div className="rounded-xl bg-white/10 px-4 py-2 backdrop-blur-sm">
        <span className="text-sm break-all text-white/80">
          {linkRef.metadata.source_uri}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-white">
            {linkRef.metadata.name || 'Untitled Link'}
          </span>
          <span className="text-xs text-white/60">
            {elapsedTime(linkRef.metadata.created_at)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-2 text-white hover:bg-white/20 hover:text-white"
            onClick={handleOpenLink}
          >
            <FiExternalLink className="h-4 w-4" />
            Open Link
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-2 text-red-400 hover:bg-red-500/20 hover:text-red-300"
            onClick={handleDelete}
          >
            <FiTrash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

// Audio Viewer
interface AudioViewerProps {
  audioRef: AudioRef;
  onClose: () => void;
}

const AudioViewer: React.FC<AudioViewerProps> = ({ audioRef, onClose }) => {
  const deleteRefFromStore = useRefStore((state) => state.deleteRef);

  const handleExport = async () => {
    await saveMediaToDisk(audioRef.metadata.id, audioRef.metadata.file_name);
  };

  const handleDelete = async () => {
    await deleteRef(audioRef.metadata.id);
    deleteRefFromStore(audioRef.metadata.id);
    onClose();
  };

  return (
    <div className="flex w-[500px] max-w-[90vw] flex-col gap-4">
      {/* Audio player */}
      <div className="bg-background rounded-xl p-6">
        <div className="mb-4 text-center">
          <div className="bg-primary/20 mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full">
            <svg
              className="text-primary h-12 w-12"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium">
            {audioRef.metadata.name || 'Untitled Audio'}
          </h3>
          <p className="text-muted-foreground text-sm">
            {audioRef.metadata.file_size}
          </p>
        </div>
        <audio
          src={toAssetUrl(audioRef.audio_path)}
          className="w-full"
          controls
          autoPlay
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
        <span className="text-xs text-white/60">
          {elapsedTime(audioRef.metadata.created_at)}
        </span>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-2 text-white hover:bg-white/20 hover:text-white"
            onClick={handleExport}
          >
            <FiDownload className="h-4 w-4" />
            Export
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-2 text-red-400 hover:bg-red-500/20 hover:text-red-300"
            onClick={handleDelete}
          >
            <FiTrash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ViewerOverlay;
