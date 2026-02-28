# AGENTS.md

This file contains guidelines for agentic coding assistants working in this repository.

---

## Commands

### Development

- `npm run dev` - Start development server with Vite and Electron (runs both in parallel)
- `npm run dev:vite` - Start Vite dev server only
- `npm run dev:electron` - Build main process and start Electron (waits for Vite)

### Build

- `npm run build` - Full production build (renderer + main + electron-builder)
- `npm run build:renderer` - Build renderer process with Vite
- `npm run build:main` - Build main process with esbuild + TypeScript
- `npm run build:electron` - Package with electron-builder

### Linting & Formatting

- `npm run lint` - Run ESLint on TypeScript files (use this before committing)
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check formatting without modifying files

### Testing (Vitest)

- `npm test` - Run tests in watch mode
- `npm run test:run` - Run tests once (CI mode)
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Run tests with coverage report
- **Running single test:** `npx vitest run src/path/to/file.test.ts` or `npx vitest src/path/to/file.test.ts` (watch mode)
- **Running tests matching pattern:** `npx vitest run -t "test name pattern"`

### AI Scripts

- `npm run ai:check` - Run format check (lint skipped - not installed)
- `npm run ai:test` - Run test coverage
- `npm run ai:build` - Run production build
- `npm run ai:acceptance` - Run acceptance tests
- `npm run ai:loop` - Run all AI checks in sequence

---

## Tech Stack

- **Framework:** Electron 28 + React 18 + TypeScript 5
- **Build:** Vite (renderer), esbuild (main), electron-builder (package)
- **State:** Zustand
- **Styling:** Tailwind CSS 3
- **Testing:** Vitest + @testing-library/react + happy-dom
- **Database:** better-sqlite3
- **Video:** fluent-ffmpeg

---

## Code Style & Conventions

### Imports

- Use `@/` alias for src imports (configured in vite.config.ts and tsconfig.json)
- Group imports in this order:
  1. External libraries (React, Electron)
  2. Internal shared types (`@/shared/types`)
  3. Relative imports from same directory
- Example:
  ```ts
  import { useState, useEffect } from 'react';
  import { MediaFile } from '@/shared/types';
  import { formatDuration } from '../utils/format';
  ```

### TypeScript

- Strict mode enabled - all code must pass TypeScript compilation
- Prefer `interface` over `type` for component props and object shapes
- Use shared types from `src/shared/types.ts` for cross-boundary data
- Avoid `any` - use `unknown` if type is truly unknown
- Enable `noUncheckedIndexedAccess` - handle potentially undefined values
- Function return types should be explicit for public APIs

### React Components

- Functional components with TypeScript interfaces for props
- Use hooks for state and side effects
- Prefer named exports for components (easier debugging in devtools)
- Add `displayName` for components using `forwardRef`
- Example:

  ```tsx
  interface Props {
    media: MediaFile;
    onClose: () => void;
  }

  export const MediaPlayer: React.FC<Props> = ({ media, onClose }) => {
    // implementation
  };
  ```

### Styling

- Tailwind CSS for all styling
- Prefer utility classes over custom CSS
- Use semantic spacing (p-4, gap-2, m-2)
- Dark mode base colors: `bg-gray-900`, `bg-gray-800`, `text-white`, `text-gray-400`
- Custom accent color: `[#005FB8]` (Windows blue)

### Error Handling

- Use `confirm()` dialogs for destructive actions (deletion)
- Async functions should handle errors appropriately with try/catch
- IPC calls to electronAPI should be awaited and errors handled
- Log errors to console with context: `console.error('[Context] Error:', error)`

### File Naming

- Components: PascalCase (e.g., `MediaPlayer.tsx`)
- Utilities/hooks: camelCase (e.g., `useMediaActions.ts`, `formatDuration.ts`)
- Types: camelCase (e.g., `types.ts`)
- IPC handlers: Group by domain in `src/main/ipc/` (e.g., `media.ts`, `tags.ts`)

### Project Structure

```
src/
  ├── renderer/          # React UI (root: src/renderer)
  │   ├── components/    # React components
  │   ├── hooks/         # Custom React hooks
  │   ├── store/         # Zustand stores
  │   └── utils/         # Renderer utilities
  ├── main/              # Electron main process
  │   ├── db/            # Database management
  │   ├── ipc/           # IPC handlers
  │   ├── utils/         # Main process utilities
  │   └── windows/       # Window management
  ├── shared/            # Shared types and utilities
  └── test/              # Test setup and utilities
```

### Electron IPC

- Use `window.electronAPI` for main process communication
- All IPC methods are async and return promises
- Available methods defined in `src/shared/types.ts:ElectronAPI`
- Common methods:
  - `getAllMedia()`, `searchMediaByTags()`, `scanMediaFolder()`
  - `addTag()`, `removeTag()`
  - `deleteMedia()`, `clearAllMedia()`
  - `trimVideoStart()` - Video trimming
  - `selectDataDir()`, `setDataDir()` - Data directory management
  - Window controls: `minimizeWindow()`, `maximizeWindow()`, `closeWindow()`

### State Management (Zustand)

- Use Zustand for global state
- Store structure: separate state interface from actions
- Include helper methods in store (e.g., `updateFilteredList()`)
- Example: `src/renderer/store/useMediaStore.ts`

### Database

- Use better-sqlite3 for database operations
- DatabaseManager class in `src/main/db/databaseManager.ts`
- Media metadata stored with tags as JSON array

### Language

- UI strings are in Chinese (as per README)
- English for code comments and technical terms
- Variable names in English

### ESLint Rules

- TypeScript recommended rules
- React recommended rules
- React Hooks recommended rules
- `react/react-in-jsx-scope`: off (not needed in React 18)
- `react/prop-types`: off (using TypeScript)
- `no-undef`: off (TypeScript handles this)

---

## Testing Guidelines

- Tests located in `src/**/*.test.ts` or `src/**/*.spec.ts`
- Test environment: happy-dom (lightweight alternative to jsdom)
- Use globals: true (no need to import test utilities)
- Coverage thresholds: 70% lines/functions/statements, 60% branches
- Setup file: `src/test/setup.ts`

### Writing Tests

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MediaPlayer } from './MediaPlayer';

describe('MediaPlayer', () => {
  it('should render video element', () => {
    render(<MediaPlayer media={mockMedia} />);
    expect(screen.getByRole('video')).toBeInTheDocument();
  });
});
```

---

## Important Notes

1. **Electron Context:** Remember code runs in two contexts (main and renderer)
2. **Native Dependencies:** sharp, better-sqlite3, and ffmpeg are native modules
3. **Video Processing:** Uses fluent-ffmpeg with bundled binaries
4. **Security:** Never expose sensitive APIs via IPC
5. **Data Directory:** Configurable via settings, defaults to app data directory
6. **Hot Reload:** Vite provides HMR for renderer, electron restarts for main process
7. **Preload:** IPC exposed via preload script at `src/main/preload.ts`
