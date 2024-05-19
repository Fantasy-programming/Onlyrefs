import { debounce } from '@solid-primitives/scheduled';
import { emit } from '@tauri-apps/api/event';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import StarterKit from '@tiptap/starter-kit';
import { createSignal } from 'solid-js';
import { createTiptapEditor } from 'solid-tiptap';
import { Markdown } from 'tiptap-markdown';

export const ViewNoteEditor = (props: {
  id: string;
  path: string;
  content: string;
}) => {
  const [container, setContainer] = createSignal<HTMLDivElement>();

  const debouncedSave = debounce(
    async (text: string, path: string, id: string) => {
      emit('note_text_changed', {
        id: id,
        path: path,
        content: text,
      });
    },
    1000,
  );

  createTiptapEditor(() => ({
    element: container()!,
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Markdown.configure({
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    editorProps: {
      attributes: {
        class:
          'focus:outline-none prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-xl max-w-full h-full ',
      },
    },
    content: props.content,
    onUpdate({ editor }) {
      debouncedSave(
        editor.storage.markdown.getMarkdown(),
        props.path,
        props.id,
      );
    },
  }));

  return (
    <div class="onlyrefNoise flex h-full w-full flex-col items-center overflow-x-hidden overscroll-y-contain bg-foreground/5">
      <div
        ref={setContainer}
        class="m-auto w-full hyphens-auto break-words p-2"
      />
    </div>
  );
};
