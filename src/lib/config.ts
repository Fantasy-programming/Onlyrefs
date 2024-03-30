import { createMasonryBreakpoints } from '~/components/Mason';
import { BaseDirectory } from '@tauri-apps/api/fs';
import { createRoot } from 'solid-js';

export const COLLECTIONS_DIR = 'collections';
export const DATA_DIR = BaseDirectory.AppData;

export const breakpoints_4 = createRoot(
  createMasonryBreakpoints(() => [
    { query: '(min-width: 1536px)', columns: 4 },
    { query: '(min-width: 1280px) and (max-width: 1536px)', columns: 4 },
    { query: '(min-width: 1024px) and (max-width: 1280px)', columns: 3 },
    { query: '(min-width: 768px) and (max-width: 1024px)', columns: 2 },
    { query: '(max-width: 768px)', columns: 2 },
  ]),
);

export const breakpoints_5 = createRoot(
  createMasonryBreakpoints(() => [
    { query: '(min-width: 1536px)', columns: 5 },
    { query: '(min-width: 1280px) and (max-width: 1536px)', columns: 5 },
    { query: '(min-width: 1024px) and (max-width: 1280px)', columns: 4 },
    { query: '(min-width: 768px) and (max-width: 1024px)', columns: 3 },
    { query: '(max-width: 768px)', columns: 2 },
  ]),
);

export const breakpoints_6 = createRoot(
  createMasonryBreakpoints(() => [
    { query: '(min-width: 1536px)', columns: 6 },
    { query: '(min-width: 1280px) and (max-width: 1536px)', columns: 6 },
    { query: '(min-width: 1024px) and (max-width: 1280px)', columns: 4 },
    { query: '(min-width: 768px) and (max-width: 1024px)', columns: 3 },
    { query: '(max-width: 768px)', columns: 2 },
  ]),
);
