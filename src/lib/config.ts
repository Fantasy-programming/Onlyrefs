import { createMasonryBreakpoints } from '~/components/Mason';
import { BaseDirectory } from '@tauri-apps/plugin-fs';

export const COLLECTIONS_DIR = 'collections';
export const DATA_DIR = BaseDirectory.AppData;

export const BREAKPOINTS_4 = createMasonryBreakpoints(() => [
  { query: '(min-width: 1536px)', columns: 4 },
  { query: '(min-width: 1280px) and (max-width: 1536px)', columns: 4 },
  { query: '(min-width: 1024px) and (max-width: 1280px)', columns: 3 },
  { query: '(min-width: 768px) and (max-width: 1024px)', columns: 2 },
  { query: '(max-width: 768px)', columns: 2 },
]);

export const BREAKPOINTS_5 = createMasonryBreakpoints(() => [
  { query: '(min-width: 1536px)', columns: 5 },
  { query: '(min-width: 1280px) and (max-width: 1536px)', columns: 5 },
  { query: '(min-width: 1024px) and (max-width: 1280px)', columns: 4 },
  { query: '(min-width: 768px) and (max-width: 1024px)', columns: 3 },
  { query: '(max-width: 768px)', columns: 2 },
]);

export const BREAKPOINTS_6 = createMasonryBreakpoints(() => [
  { query: '(min-width: 1536px)', columns: 6 },
  { query: '(min-width: 1280px) and (max-width: 1536px)', columns: 6 },
  { query: '(min-width: 1024px) and (max-width: 1280px)', columns: 4 },
  { query: '(min-width: 768px) and (max-width: 1024px)', columns: 3 },
  { query: '(max-width: 768px)', columns: 2 },
]);

export const SUPPORTED_FILES = [
  {
    name: 'image',
    extensions: ['png', 'jpeg', 'webp', 'gif', 'jpg'],
  },
  {
    name: 'video',
    extensions: ['mp4', 'avi', 'webm'],
  },
  {
    name: 'audio',
    extensions: ['mp3', 'wav', 'opus', 'aac', 'm4a', 'ogg'],
  },
];
