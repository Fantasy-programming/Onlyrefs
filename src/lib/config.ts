import { createMasonryBreakpoints } from "solid-mason";
export const COLLECTIONS_DIR = "collections";

export const breakpoints_4 = createMasonryBreakpoints(() => [
  { query: "(min-width: 1536px)", columns: 4 },
  { query: "(min-width: 1280px) and (max-width: 1536px)", columns: 4 },
  { query: "(min-width: 1024px) and (max-width: 1280px)", columns: 3 },
  { query: "(min-width: 768px) and (max-width: 1024px)", columns: 2 },
  { query: "(max-width: 768px)", columns: 2 },
]);

export const breakpoints_5 = createMasonryBreakpoints(() => [
  { query: "(min-width: 1536px)", columns: 5 },
  { query: "(min-width: 1280px) and (max-width: 1536px)", columns: 5 },
  { query: "(min-width: 1024px) and (max-width: 1280px)", columns: 4 },
  { query: "(min-width: 768px) and (max-width: 1024px)", columns: 3 },
  { query: "(max-width: 768px)", columns: 2 },
]);

export const breakpoints_6 = createMasonryBreakpoints(() => [
  { query: "(min-width: 1536px)", columns: 6 },
  { query: "(min-width: 1280px) and (max-width: 1536px)", columns: 5 },
  { query: "(min-width: 1024px) and (max-width: 1280px)", columns: 4 },
  { query: "(min-width: 768px) and (max-width: 1024px)", columns: 3 },
  { query: "(max-width: 768px)", columns: 2 },
]);
