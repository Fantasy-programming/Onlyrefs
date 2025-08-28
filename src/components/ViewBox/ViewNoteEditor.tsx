import React, { useMemo } from 'react';
import { emit } from '@tauri-apps/api/event';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import StarterKit from '@tiptap/starter-kit';
import { useEditor, EditorContent } from '@tiptap/react';
import { Markdown } from 'tiptap-markdown';

type Props = {
  id: string;
  path: string;
  content: string;
};

function debounce<T extends (...args: any[]) => void>(fn: T, wait = 1000) {
  let t: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

export const ViewNoteEditor: React.FC<Props> = ({ id, path, content }) => {
  const debouncedSave = useMemo(
    () =>
      debounce(async (text: string, path: string, id: string) => {
        await emit('note_text_changed', {
          id,
          path,
          content: text,
        });
      }, 1000),
    [],
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({ nested: true }),
      Markdown.configure({ transformPastedText: true, transformCopiedText: true }),
    ],
    editorProps: {
      attributes: {
        class:
          'focus:outline-none prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-xl max-w-full h-full',
      },
    },
    content,
    onUpdate({ editor }) {
      try {
        const md = (editor.storage as any).markdown?.getMarkdown?.();
        if (md) debouncedSave(md, path, id);
      } catch (e) {
        // ignore
      }
    },
  });

  return (
    <div className="onlyrefNoise flex h-full w-full flex-col items-center overflow-x-hidden overscroll-y-contain rounded-lg bg-foreground/5">
      <div className="m-auto w-full hyphens-auto break-words p-2">
        {editor ? <EditorContent editor={editor} /> : null}
      </div>
    </div>
  );
};

export default ViewNoteEditor;
