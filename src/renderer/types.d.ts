// This file is deprecated. All types are now in src/shared/types.ts
// Import from @/shared/types instead
import type { ElectronAPI } from '../shared/types';

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }

  // Electron 自定义标题栏 CSS 属性
  namespace React {
    interface CSSProperties {
      WebkitAppRegion?: 'drag' | 'no-drag';
    }
  }
}

export {};
