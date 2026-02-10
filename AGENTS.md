# AGENTS.md

This file contains guidelines for agentic coding assistants working in this repository.

---

## Commands

### Development
- `npm run dev` - Start development server with Vite and Electron
- `npm run build` - Build production bundle (runs Vite build + Electron builder)

### Linting & Type Checking
- `npm run lint` - Run ESLint on TypeScript files (use this before committing)

### Testing
No test framework is currently configured. Before adding tests, consult the user.

---

## Code Style & Conventions

### Imports
- Use `@/` alias for src imports (configured in vite.config.ts)
- Group imports: external libraries first, then internal modules
- Example:
  ```ts
  import React, { useState } from 'react';
  import { MediaFile } from '@/shared/types';
  import { MediaPlayer } from './components/MediaPlayer';
  ```

### TypeScript
- Strictly typed - all code must pass TypeScript compilation
- Interface over type for component props
- Use shared types from `src/shared/types.ts` for cross-boundary data
- Avoid `any` - use `unknown` if type is truly unknown

### React Components
- Functional components with TypeScript interfaces for props
- Use hooks for state and side effects
- Prefer named exports for components (easier debugging)
- Example:
  ```tsx
  interface Props {
    media: MediaFile;
    onClose: () => void;
  }
  export const MediaPlayer: React.FC<Props> = ({ media, onClose }) => { ... };
  ```

### Styling
- Tailwind CSS for all styling
- Prefer utility classes over custom CSS
- Use semantic spacing (p-4, gap-2, m-2)
- Dark mode base colors: `bg-gray-900`, `bg-gray-800`, `text-white`, `text-gray-400`

### Error Handling
- Use confirm() dialogs for destructive actions (deletion)
- Async functions should handle errors appropriately
- IPC calls to electronAPI should be awaited

### File Naming
- Components: PascalCase (e.g., MediaPlayer.tsx)
- Utilities/files: camelCase (e.g., formatDuration.ts)
- Types: camelCase (e.g., types.ts)

### Project Structure
```
src/
  ├── renderer/     # React UI (root: src/renderer)
  ├── shared/       # Shared types/interfaces
  └── main/         # Electron main process
```

### Electron IPC
- Use `window.electronAPI` for main process communication
- Available methods: getAllMedia, searchMediaByTags, scanMediaFolder, deleteMedia
- All IPC methods are async and return promises

### Chinese Language
- UI strings are in Chinese (as per README)
- English for code comments and technical terms