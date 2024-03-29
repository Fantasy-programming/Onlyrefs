import { Toggle, Toolbar } from 'terracotta';
import { createEditorTransaction } from 'solid-tiptap';
import { ControlProps, ToolbarProps } from './BoardItem.types.ts';
import { JSX, Show, createSignal } from 'solid-js';
import { BsTextParagraph } from 'solid-icons/bs';
import { HiSolidCodeBracket } from 'solid-icons/hi';
import { VsListOrdered, VsListUnordered } from 'solid-icons/vs';
import { TbBlockquote } from 'solid-icons/tb';
import { OcCodesquare2 } from 'solid-icons/oc';
import { useRefSelector } from '~/state/store';

import { createTiptapEditor } from 'solid-tiptap';
import StarterKit from '@tiptap/starter-kit';
import BubbleMenu from '@tiptap/extension-bubble-menu';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import { Markdown } from 'tiptap-markdown';
import Placeholder from '@tiptap/extension-placeholder';
import { Extension } from '@tiptap/core';
import { create_note_ref } from '~/lib/helper.ts';
import { NoteRef } from '~/lib/types.ts';
import { Dialog, DialogTrigger } from '../ui/dialog.tsx';
import { ViewBox } from '../ViewBox/ViewBox.tsx';

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

export function ToolbarContents(props: ToolbarProps): JSX.Element {
  return (
    <div class="flex space-x-1 p-2">
      <div class="flex space-x-1">
        <Control
          key="paragraph"
          class="font-bold"
          editor={props.editor}
          onChange={() => props.editor.chain().focus().setParagraph().run()}
          title="Paragraph"
        >
          <BsTextParagraph title="Paragraph" class="m-1 h-full w-full" />
        </Control>
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
        <Control
          key="heading-2"
          class="font-bold"
          editor={props.editor}
          onChange={() =>
            props.editor.chain().focus().setHeading({ level: 2 }).run()
          }
          isActive={(editor) => editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          H2
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
        <Control
          key="italic"
          class="italic"
          editor={props.editor}
          onChange={() => props.editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          I
        </Control>
        <Control
          key="strike"
          class="line-through"
          editor={props.editor}
          onChange={() => props.editor.chain().focus().toggleStrike().run()}
          title="Strike Through"
        >
          S
        </Control>
        <Control
          key="code"
          class=""
          editor={props.editor}
          onChange={() => props.editor.chain().focus().toggleCode().run()}
          title="Code"
        >
          <HiSolidCodeBracket title="Code" class="m-1 h-full w-full" />
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
          key="orderedList"
          class=""
          editor={props.editor}
          onChange={() =>
            props.editor.chain().focus().toggleOrderedList().run()
          }
          title="Ordered List"
        >
          <VsListOrdered title="Ordered List" class="m-1 h-full w-full" />
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

const SaveNote = Extension.create({
  addKeyboardShortcuts() {
    const { options } = this;

    return {
      'Ctrl-Enter': ({ editor }) => {
        const text: string = editor.storage.markdown.getMarkdown();
        if (text.trim() === '') {
          return false;
        }

        create_note_ref('all', text).then(() => {
          editor.commands.clearContent();
          if (typeof options.refresh === 'function') {
            options.refresh();
          }
        });

        return true;
      },
    };
  },
});

export const NoteItem = (props: { noteInfo: NoteRef }) => {
  return (
    <Dialog>
      <DialogTrigger class="w-full">
        <div class="max-h-[500px] min-h-[50px] w-full overflow-hidden rounded-xl border  border-transparent bg-foreground/10 p-6 shadow-md hover:border-secondary">
          <NoteContent content={props.noteInfo.metadata.note_text} />
        </div>
        {props.noteInfo.metadata.name === '' ? null : (
          <p class="mt-[10px] h-5 overflow-hidden text-ellipsis whitespace-nowrap text-center text-sm font-medium text-muted/80">
            {props.noteInfo.metadata.name}
          </p>
        )}
      </DialogTrigger>
      <ViewBox
        source={props.noteInfo}
        content={props.noteInfo.metadata.note_text}
        type="note"
      />
    </Dialog>
  );
};

const NoteContent = (props: { content: string }) => {
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
    ],
    editorProps: {
      attributes: {
        class:
          'focus:outline-none prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-xl max-w-full h-full ',
      },
    },
    content: props.content,
  }));

  return <div ref={setContainer} class="h-full overflow-y-scroll text-start" />;
};

export const NewNote = () => {
  const [container, setContainer] = createSignal<HTMLDivElement>();
  const [menu, setMenu] = createSignal<HTMLDivElement>();
  const { refService } = useRefSelector();

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
      SaveNote.configure({
        refresh: refService.refetchRefs,
      }),
    ],
    editorProps: {
      attributes: {
        class:
          'focus:outline-none prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-xl max-w-full h-full ',
      },
    },
    content: ``,
  }));

  return (
    <div
      id="editor"
      class="h-[400px] overflow-hidden rounded-xl border border-transparent bg-foreground/10 p-6 shadow-md hover:border-secondary"
    >
      <h4 class="mb-2 text-lg text-secondary">ADD NEW NOTE</h4>
      <Toolbar
        ref={setMenu}
        class="dynamic-shadow rounded-lg bg-gradient-to-bl from-primary to-primary/50 text-white"
        horizontal
      >
        <Show when={editor()} keyed>
          {(instance) => <ToolbarContents editor={instance} />}
        </Show>
      </Toolbar>
      <div ref={setContainer} class="h-full overflow-y-scroll" />
    </div>
  );
};

export const NoteEditor = (props: { source: NoteRef; content: string }) => {
  const [container, setContainer] = createSignal<HTMLDivElement>();
  const [menu, setMenu] = createSignal<HTMLDivElement>();

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
    content: props.content,
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
