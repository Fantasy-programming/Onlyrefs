import React, { useMemo, useRef, useState } from 'react';
import { debounce as _debounce } from 'lodash-es';
import { createNoteRef } from '@/lib/commands';
import { useEditor, EditorContent, BubbleMenu as TipTapBubbleMenu } from '@tiptap/react';

import StarterKit from '@tiptap/starter-kit';
import { Extension } from '@tiptap/core';
import BubbleMenuExtension from '@tiptap/extension-bubble-menu';
import Placeholder from '@tiptap/extension-placeholder';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import { Markdown } from 'tiptap-markdown';

import { ControlProps, ToolbarProps } from './BoardItem.types';
import { NoteRef } from '@/lib/types';

import { motion, AnimatePresence } from 'framer-motion';
import { FiList } from 'react-icons/fi';
import { TbBlockquote } from 'react-icons/tb';
import { IoCodeSlash } from 'react-icons/io5';
import { emit } from '@tauri-apps/api/event';

const SaveNote = Extension.create({
  addKeyboardShortcuts() {
    return {
      'Ctrl-Enter': ({ editor }) => {
        const text: string = (editor.storage as any).markdown.getMarkdown();
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

function Control(props: ControlProps & { format?: string; editor?: any }) {
  const { editor } = props as any;
  const isActive = !!(editor && props.format ? editor.isActive(props.format) : editor && props.key ? editor.isActive((props as any).key) : false);

  const onClick = () => {
    if (!editor) return;
    if (props.onChange) props.onChange();
  };

  return (
    <button
      aria-pressed={isActive}
      title={props.title}
      onClick={onClick}
      className={`${props.class || ''} flex h-6 w-6 items-center justify-center rounded focus:outline-none focus-visible:ring focus-visible:ring-purple-400 focus-visible:ring-opacity-75 ${isActive ? 'text-color-600 bg-white bg-opacity-25' : ''}`}
    >
      {props.children}
    </button>
  );
}

function Separator() {
  return (
    <div className="flex items-center" aria-hidden="true">
      <div className="h-full border-l border-gray-300" />
    </div>
  );
}

function ToolbarContents(props: ToolbarProps): JSX.Element {
  const editor = props.editor;

  return (
    <div className="flex space-x-1 p-2">
      <div className="flex space-x-1">
        <Control
          format="heading"
          class="font-bold"
          editor={editor}
          onChange={() => editor.chain().focus().setHeading({ level: 1 }).run()}
          title="Heading 1"
        >
          H1
        </Control>
      </div>
      <Separator />
      <div className="flex space-x-1">
        <Control
          format="bold"
          class="font-bold"
          editor={editor}
          onChange={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          B
        </Control>
      </div>
      <Separator />
      <div className="flex space-x-1">
        <Control
          format="bulletList"
          className=""
          editor={editor}
          onChange={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet List"
        >
          <FiList title="Unordered List" className="m-1 h-full w-full" />
        </Control>
        <Control
          format="blockquote"
          className=""
          editor={editor}
          onChange={() => editor.chain().focus().toggleBlockquote().run()}
          title="Blockquote"
        >
          <TbBlockquote title="Blockquote" className="m-1 h-full w-full" />
        </Control>
        <Control
          format="codeBlock"
          className=""
          editor={editor}
          onChange={() => editor.chain().focus().toggleCodeBlock().run()}
          title="Code Block"
        >
          <IoCodeSlash title="Code Block" className="m-1 h-full w-full" />
        </Control>
      </div>
    </div>
  );
}

export const NoteContent: React.FC<{ data: NoteRef }> = ({ data }) => {
  const editor = useEditor({
    editable: false,
    extensions: [
      StarterKit,
      (Markdown as any).configure({ transformPastedText: true, transformCopiedText: true }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    editorProps: {
      attributes: {
        class: 'focus:outline-none prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-xl max-w-full h-full',
      },
    },
    content: data.content,
  });

  const isQuote = data.metadata.tags.includes('quote');

  return (
    <div className={`${isQuote ? "before:content-['“'] font-serif after:content-['”'] after:text-3xl before:text-3xl before:leading-[0] after:leading-[0] after:pt-[10px] before:pb-[10px] before:mt-3 after:mt-3 after:block before:block text-2xl text-center" : ''} h-full overflow-y-hidden`}>
      {editor ? <EditorContent editor={editor} /> : null}
    </div>
  );
};

export const NewNote: React.FC = () => {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [helper, setHelper] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: 'Start writing your note here...' }),
      (Markdown as any).configure({ transformPastedText: true, transformCopiedText: true }),
      BubbleMenuExtension.configure({ element: menuRef.current as any }),
      SaveNote,
    ],
    editorProps: {
      attributes: {
        class: 'focus:outline-none prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-xl max-w-full h-full ',
      },
    },
    content: '',
    onFocus() {
      if (!helper) setHelper(true);
    },
    onBlur() {
      if (helper) setHelper(false);
    },
  });

  return (
    <div id="editor" className="h-[400px] overflow-hidden rounded-xl border border-transparent bg-foreground/10 p-6 shadow-md focus-within:border-secondary hover:border-secondary focus-visible:border-secondary">
      <h4 className="mb-2 text-lg text-secondary">ADD NEW NOTE</h4>
      <div ref={menuRef} className="dynamic-shadow rounded-lg bg-gradient-to-bl from-primary/80 to-tertiary text-white">
        {editor ? <ToolbarContents editor={editor} /> : null}
      </div>
      <div className="h-full overflow-y-scroll">{editor ? <EditorContent editor={editor} /> : null}</div>
      <AnimatePresence>
        {helper && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute bottom-0 left-0 w-full rounded-b-xl bg-secondary p-1 text-center text-secondary-foreground">
            <p>Press Ctrl + Enter to save note</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const NoteEditor: React.FC<{ source: NoteRef }> = ({ source }) => {
  const menuRef = useRef<HTMLDivElement | null>(null);

  const debouncedSave = useMemo(() => _debounce(async (text: string, path: string, id: string) => {
    await emit('note_changed', { id, path, content: text });
  }, 1000), []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: 'Start writing your note here...' }),
      (Markdown as any).configure({ transformPastedText: true, transformCopiedText: true }),
      BubbleMenuExtension.configure({ element: menuRef.current as any }),
    ],
    editorProps: {
      attributes: {
        class: 'focus:outline-none prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-xl max-w-full h-full ',
      },
    },
    content: source.content,
    onUpdate({ editor }) {
      try {
        const md = (editor.storage as any).markdown.getMarkdown();
        if (md) debouncedSave(md, source.metapath, source.metadata.id);
      } catch (e) {}
    },
  });

  return (
    <div className="flex h-full w-full flex-col items-center overflow-x-hidden overscroll-y-contain p-12">
      <div ref={menuRef} className="dynamic-shadow rounded-lg bg-gradient-to-bl from-primary to-primary/50 text-white">
        {editor ? <ToolbarContents editor={editor} /> : null}
      </div>
      <div className="m-auto w-full hyphens-auto break-words">{editor ? <EditorContent editor={editor} /> : null}</div>
    </div>
  );
};
