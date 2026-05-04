# AGENTS.md

## Build & Run Commands

- **Dev server**: `npm run dev` (Vite on port 1420)
- **Build**: `npm run build` (frontend) / `cargo build` (Rust backend)
- **Tauri app**: `npm run tauri dev` or `npm run tauri build`
- **Tests**: `npm test` (runs vitest) / `cargo test` (Rust)
- **Single test**: `npm test -- <test-name>` or `npx vitest <file>`
- **Format**: `npm run prettier` / `cargo fmt`

## Code Style (TypeScript)

- Single quotes, semicolons required, 2-space indent, 80 char width, trailing commas
- Imports: React/external first, then local (`@/` alias for `src/`), then relative
- Components: PascalCase files, `Component.tsx` with co-located `.types.ts` and `.hook.tsx`
- Types: Prefer explicit types, use interfaces for props (e.g., `BoardProps`)

## Code Style (Rust)

- Default rustfmt settings, use `map_err()` for error handling with descriptive messages
- Tauri commands: `#[tauri::command]` with `State<'_, Mutex<T>>` for shared state
- Return `Result<T, String>` from commands, lock state with `.lock().map_err(...)?`

## Project Structure

- `src/` - React frontend with shadcn/ui components in `src/components/ui/`
- `src-tauri/` - Rust backend (Tauri), commands in `commands.rs`, state in `state.rs`
