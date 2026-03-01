import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MediaFile, WatchedFolder } from '../../shared/types';

interface ScanProgress {
  message: string;
  percent: number;
}

interface AppState {
  // UI State
  viewMode: 'list' | 'grid';
  iconSize: number;
  sidebarPinned: boolean;
  sidebarVisible: boolean;
  sidebarWidth: number;
  playMode: 'list' | 'single' | 'random';
  watchedFolders: WatchedFolder[];
  scanProgress: ScanProgress | null;
  tagEditorOpen: boolean;
  editingMedias: MediaFile[];
  showTrimmer: boolean;
  showSettings: boolean;
  apiReady: boolean;
  isSidebarDetached: boolean;
  unlockedFolders: string[]; // 已解锁的文件夹路径列表（仅内存存储，不持久化）
  lockPassword: string; // 全局加锁密码（持久化）

  // Actions
  setViewMode: (mode: 'list' | 'grid') => void;
  setIconSize: (size: number) => void;
  setSidebarPinned: (pinned: boolean) => void;
  setSidebarVisible: (visible: boolean) => void;
  setSidebarWidth: (width: number) => void;
  setPlayMode: (mode: 'list' | 'single' | 'random') => void;
  setWatchedFolders: (folders: WatchedFolder[]) => void;
  setScanProgress: (progress: ScanProgress | null) => void;
  setTagEditorOpen: (open: boolean) => void;
  setEditingMedias: (medias: MediaFile[]) => void;
  setShowTrimmer: (show: boolean) => void;
  setShowSettings: (show: boolean) => void;
  setApiReady: (ready: boolean) => void;
  setIsSidebarDetached: (detached: boolean) => void;
  setLockPassword: (password: string) => void;
  unlockFolder: (path: string) => void;
  lockFolder: (path: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    set => ({
      // Initial State
      viewMode: 'list',
      iconSize: 120,
      sidebarPinned: true,
      sidebarVisible: true,
      sidebarWidth: 320,
      playMode: 'list',
      watchedFolders: [],
      scanProgress: null,
      tagEditorOpen: false,
      editingMedias: [],
      showTrimmer: false,
      showSettings: false,
      apiReady: false,
      isSidebarDetached: false,
      unlockedFolders: [], // 不持久化，仅内存存储
      lockPassword: '', // 全局加锁密码

      // Actions
      setViewMode: viewMode => set({ viewMode }),
      setIconSize: iconSize => set({ iconSize }),
      setSidebarPinned: sidebarPinned => set({ sidebarPinned }),
      setSidebarVisible: sidebarVisible => set({ sidebarVisible }),
      setSidebarWidth: sidebarWidth => set({ sidebarWidth }),
      setPlayMode: playMode => set({ playMode }),
      setWatchedFolders: watchedFolders => set({ watchedFolders }),
      setScanProgress: scanProgress => set({ scanProgress }),
      setTagEditorOpen: tagEditorOpen => set({ tagEditorOpen }),
      setEditingMedias: editingMedias => set({ editingMedias }),
      setShowTrimmer: showTrimmer => set({ showTrimmer }),
      setShowSettings: showSettings => set({ showSettings }),
      setApiReady: apiReady => set({ apiReady }),
      setIsSidebarDetached: isSidebarDetached => set({ isSidebarDetached }),
      setLockPassword: lockPassword => set({ lockPassword }),
      unlockFolder: path =>
        set(state => ({
          unlockedFolders: [...state.unlockedFolders.filter(p => p !== path), path],
        })),
      lockFolder: path =>
        set(state => ({
          unlockedFolders: state.unlockedFolders.filter(p => p !== path),
        })),
    }),
    {
      name: 'app-storage', // unique name
      partialize: state => ({
        viewMode: state.viewMode,
        iconSize: state.iconSize,
        watchedFolders: state.watchedFolders,
        // Don't persist ephemeral state like progress, modal open state, unlockedFolders, etc.
      }),
    }
  )
);
