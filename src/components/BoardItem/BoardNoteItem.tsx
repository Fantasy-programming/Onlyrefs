import { JSX, Show, createSignal } from 'solid-js';
import { debounce } from '@solid-primitives/scheduled';
import { createNoteRef } from '~/lib/commands.ts';
import { createTiptapEditor, createEditorTransaction } from 'solid-tiptap';

import StarterKit from '@tiptap/starter-kit';
import { Extension } from '@tiptap/core';
import BubbleMenu from '@tiptap/extension-bubble-menu';
import Placeholder from '@tiptap/extension-placeholder';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import { Markdown } from 'tiptap-markdown';

import { ControlProps, ToolbarProps } from './BoardItem.types.ts';
import { NoteRef } from '~/lib/types.ts';

import { Motion, Presence } from 'solid-motionone';
import { Toggle, Toolbar } from 'terracotta';
import { VsListUnordered } from 'solid-icons/vs';
import { TbBlockquote } from 'solid-icons/tb';
import { OcCodesquare2 } from 'solid-icons/oc';
import { emit } from '@tauri-apps/api/event';

const SaveNote = Extension.create({
  addKeyboardShortcuts() {
    return {
      'Ctrl-Enter': ({ editor }) => {
        const text: string = editor.storage.markdown.getMarkdown();
        if (text.trim() === '') {
          return false;
        }

        createNoteRef('all', text).then(() => {
          editor.commands.clearContent();
        });

        return true;
      },
    };
  },
});

function Control(props: ControlProps): JSX.Element {
  const flag = createEditorTransaction(
    () => props.editor,
    (instance) => {
      if (props.isActive) {
        return props.isActive(instance);
      }
      return instance.isActive(props.key);
    },
  );

  return (
    <Toggle
      defaultPressed={false}
      class={`${props.class} flex h-6 w-6 items-center justify-center rounded focus:outline-none focus-visible:ring focus-visible:ring-purple-400 focus-visible:ring-opacity-75`}
      classList={{
        'text-color-600 bg-white bg-opacity-25': flag(),
      }}
      title={props.title}
      onChange={props.onChange}
    >
      {props.children}
    </Toggle>
  );
}

function Separator() {
  return (
    <div class="flex items-center" aria-hidden="true">
      <div class="h-full border-l border-gray-300" />
    </div>
  );
}

function ToolbarContents(props: ToolbarProps): JSX.Element {
  return (
    <div class="flex space-x-1 p-2">
      <div class="flex space-x-1">
        <Control
          key="heading-1"
          class="font-bold"
          editor={props.editor}
          onChange={() =>
            props.editor.chain().focus().setHeading({ level: 1 }).run()
          }
          isActive={(editor) => editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          H1
        </Control>
      </div>
      <Separator />
      <div class="flex space-x-1">
        <Control
          key="bold"
          class="font-bold"
          editor={props.editor}
          onChange={() => props.editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          B
        </Control>
      </div>
      <Separator />
      <div class="flex space-x-1">
        <Control
          key="bulletList"
          class=""
          editor={props.editor}
          onChange={() => props.editor.chain().focus().toggleBulletList().run()}
          title="Bullet List"
        >
          <VsListUnordered title="Unordered List" class="m-1 h-full w-full" />
        </Control>
        <Control
          key="blockquote"
          class=""
          editor={props.editor}
          onChange={() => props.editor.chain().focus().toggleBlockquote().run()}
          title="Blockquote"
        >
          <TbBlockquote title="Blockquote" class="m-1 h-full w-full" />
        </Control>
        <Control
          key="codeBlock"
          class=""
          editor={props.editor}
          onChange={() => props.editor.chain().focus().toggleCodeBlock().run()}
          title="Code Block"
        >
          <OcCodesquare2 title="Code Block" class="m-1 h-full w-full" />
        </Control>
      </div>
    </div>
  );
}

export const NoteContent = (props: { data: NoteRef }) => {
  const [container, setContainer] = createSignal<HTMLDivElement>();

  createTiptapEditor(() => ({
    element: container()!,
    editable: false,
    extensions: [
      StarterKit,
      Markdown.configure({
        transformPastedText: true,
        transformCopiedText: true,
      }),

      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    editorProps: {
      attributes: {
        class:
          'focus:outline-none prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-xl max-w-full h-full',
      },
    },
    content: props.data.content,
  }));

  return (
    <div
      ref={setContainer}
      classList={{
        "before:content-['“'] font-serif   after:content-['”'] after:text-3xl before:text-3xl before:leading-[0] after:leading-[0] after:pt-[10px] before:pb-[10px] before:mt-3 after:mt-3 after:block before:block text-2xl text-center":
          props.data.metadata.tags.includes('quote'),

        'h-full overflow-y-hidden': true,
      }}
    />
  );
};

export const NewNote = () => {
  const [container, setContainer] = createSignal<HTMLDivElement>();
  const [menu, setMenu] = createSignal<HTMLDivElement>();
  const [helper, setHelper] = createSignal<boolean>(false);

  const editor = createTiptapEditor(() => ({
    element: container()!,
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Placeholder.configure({
        placeholder: 'Start writing your note here...',
      }),
      Markdown.configure({
        transformPastedText: true,
        transformCopiedText: true,
      }),
      BubbleMenu.configure({
        element: menu()!,
      }),
      SaveNote,
    ],
    editorProps: {
      attributes: {
        class:
          'focus:outline-none prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-xl max-w-full h-full ',
      },
    },
    content: ``,
    onFocus() {
      if (!helper()) {
        setHelper(true);
      }
    },
    onBlur() {
      if (helper()) {
        setHelper(false);
      }
    },
  }));

  return (
    <div
      id="editor"
      class="h-[400px] overflow-hidden rounded-xl border border-transparent bg-foreground/10 p-6 shadow-md focus-within:border-secondary hover:border-secondary focus-visible:border-secondary"
    >
      <h4 class="mb-2 text-lg text-secondary">ADD NEW NOTE</h4>
      <Toolbar
        ref={setMenu}
        class="dynamic-shadow  rounded-lg bg-gradient-to-bl from-primary/80 to-tertiary text-white"
        horizontal
      >
        <Show when={editor()} keyed>
          {(instance) => <ToolbarContents editor={instance} />}
        </Show>
      </Toolbar>
      <div ref={setContainer} class="h-full overflow-y-scroll" />
      <Presence>
        <Show when={helper()}>
          <Motion.div
            animate={{ opacity: [0, 1] }}
            exit={{ opacity: [1, 0] }}
            class="absolute bottom-0 left-0 w-full rounded-b-xl bg-secondary p-1 text-center text-secondary-foreground"
          >
            <p>Press Ctrl + Enter to save note</p>
          </Motion.div>
        </Show>
      </Presence>
    </div>
  );
};

export const NoteEditor = (props: { source: NoteRef }) => {
  const [container, setContainer] = createSignal<HTMLDivElement>();
  const [menu, setMenu] = createSignal<HTMLDivElement>();

  const debouncedSave = debounce(
    async (text: string, path: string, id: string) => {
      emit('note_changed', {
        id: id,
        path: path,
        content: text,
      });
    },
    1000,
  );

  const editor = createTiptapEditor(() => ({
    element: container()!,
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Placeholder.configure({
        placeholder: 'Start writing your note here...',
      }),
      Markdown.configure({
        transformPastedText: true,
        transformCopiedText: true,
      }),
      BubbleMenu.configure({
        element: menu()!,
      }),
    ],
    editorProps: {
      attributes: {
        class:
          'focus:outline-none prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-xl max-w-full h-full ',
      },
    },
    content: props.source.content,
    onUpdate({ editor }) {
      debouncedSave(
        editor.storage.markdown.getMarkdown(),
        props.source.metapath,
        props.source.metadata.id,
      );
    },
  }));

  return (
    <div class="flex h-full w-full flex-col items-center overflow-x-hidden overscroll-y-contain p-12">
      <Toolbar
        ref={setMenu}
        class="dynamic-shadow rounded-lg bg-gradient-to-bl from-primary to-primary/50 text-white"
        horizontal
      >
        <Show when={editor()} keyed>
          {(instance) => <ToolbarContents editor={instance} />}
        </Show>
      </Toolbar>
      <div ref={setContainer} class="m-auto w-full hyphens-auto break-words" />
    </div>
  );
};
