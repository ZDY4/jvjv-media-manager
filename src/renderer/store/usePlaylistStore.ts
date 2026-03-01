import { create } from 'zustand';
import type { Playlist, MediaFile } from '../../shared/types';
import { isMediaFromUnlockedFolder } from '../utils/folderUtils';
import { useAppStore } from './useAppStore';

interface PlaylistState {
  // 播放列表列表
  playlists: Playlist[];
  // 当前激活的Tab ID（'media-library' 表示媒体库，其他是播放列表ID）
  activeTabId: string;
  // 当前播放列表的媒体
  currentPlaylistMedia: MediaFile[];
  // 当前播放列表的选中状态
  selectedMediaIds: Set<string>;
  lastSelectedId: string | null;
  // 搜索和排序
  searchQuery: string;
  sortField: 'filename' | 'modifiedAt';
  sortOrder: 'asc' | 'desc';
  // 当前过滤后的媒体列表
  filteredMediaList: MediaFile[];
  // 加载状态
  isLoading: boolean;

  // Actions
  setPlaylists: (playlists: Playlist[]) => void;
  setActiveTabId: (id: string) => void;
  setCurrentPlaylistMedia: (media: MediaFile[]) => void;
  setSelectedMediaIds: (ids: Set<string>) => void;
  setLastSelectedId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSortField: (field: 'filename' | 'modifiedAt') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  setIsLoading: (isLoading: boolean) => void;
  toggleSort: (field: 'filename' | 'modifiedAt') => void;
  updateFilteredList: () => void;
  clearSelection: () => void;

  // CRUD Actions
  createPlaylist: (name: string) => Promise<Playlist | null>;
  renamePlaylist: (id: string, name: string) => Promise<boolean>;
  deletePlaylist: (id: string) => Promise<boolean>;
  loadPlaylists: () => Promise<void>;
  loadPlaylistMedia: (playlistId: string) => Promise<void>;
  addMediaToPlaylist: (playlistId: string, mediaIds: string[]) => Promise<boolean>;
  removeMediaFromPlaylist: (playlistId: string, mediaIds: string[]) => Promise<boolean>;
  updatePlaylistOrder: (orders: { id: string; sortOrder: number }[]) => Promise<boolean>;
}

export const usePlaylistStore = create<PlaylistState>((set, get) => ({
  playlists: [],
  activeTabId: 'media-library',
  currentPlaylistMedia: [],
  selectedMediaIds: new Set(),
  lastSelectedId: null,
  searchQuery: '',
  sortField: 'modifiedAt',
  sortOrder: 'desc',
  filteredMediaList: [],
  isLoading: false,

  setPlaylists: playlists => set({ playlists }),
  setActiveTabId: id => set({ activeTabId: id }),
  setCurrentPlaylistMedia: media => {
    set({ currentPlaylistMedia: media });
    get().updateFilteredList();
  },
  setSelectedMediaIds: ids => set({ selectedMediaIds: ids }),
  setLastSelectedId: id => set({ lastSelectedId: id }),
  setSearchQuery: searchQuery => {
    set({ searchQuery });
    get().updateFilteredList();
  },
  setSortField: sortField => {
    set({ sortField });
    get().updateFilteredList();
  },
  setSortOrder: sortOrder => {
    set({ sortOrder });
    get().updateFilteredList();
  },
  setIsLoading: isLoading => set({ isLoading }),

  toggleSort: field => {
    const { sortField, sortOrder } = get();
    if (sortField === field) {
      set({ sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' });
    } else {
      set({ sortField: field, sortOrder: 'asc' });
    }
    get().updateFilteredList();
  },

  updateFilteredList: () => {
    const { currentPlaylistMedia, searchQuery, sortField, sortOrder } = get();
    let filtered = [...currentPlaylistMedia];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(media => {
        const filenameMatch = media.filename.toLowerCase().includes(query);
        const tagMatch = media.tags.some(tag => tag.toLowerCase().includes(query));
        return filenameMatch || tagMatch;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'filename') {
        comparison = a.filename.localeCompare(b.filename);
      } else if (sortField === 'modifiedAt') {
        comparison = a.modifiedAt - b.modifiedAt;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    set({ filteredMediaList: filtered });
  },

  clearSelection: () => {
    set({ selectedMediaIds: new Set(), lastSelectedId: null });
  },

  // CRUD Actions
  createPlaylist: async name => {
    if (!window.electronAPI) return null;
    try {
      const playlist = await window.electronAPI.createPlaylist(name);
      if (playlist) {
        await get().loadPlaylists();
        window.showToast?.({ message: `播放列表 "${name}" 已创建`, type: 'success' });
      }
      return playlist;
    } catch (error) {
      console.error('创建播放列表失败:', error);
      window.showToast?.({ message: '创建播放列表失败', type: 'error' });
      return null;
    }
  },

  renamePlaylist: async (id, name) => {
    if (!window.electronAPI) return false;
    try {
      const success = await window.electronAPI.renamePlaylist(id, name);
      if (success) {
        await get().loadPlaylists();
        window.showToast?.({ message: '播放列表已重命名', type: 'success' });
      }
      return success;
    } catch (error) {
      console.error('重命名播放列表失败:', error);
      window.showToast?.({ message: '重命名播放列表失败', type: 'error' });
      return false;
    }
  },

  deletePlaylist: async id => {
    if (!window.electronAPI) return false;
    try {
      const success = await window.electronAPI.deletePlaylist(id);
      if (success) {
        const { activeTabId } = get();
        if (activeTabId === id) {
          set({ activeTabId: 'media-library' });
        }
        await get().loadPlaylists();
        window.showToast?.({ message: '播放列表已删除', type: 'success' });
      }
      return success;
    } catch (error) {
      console.error('删除播放列表失败:', error);
      window.showToast?.({ message: '删除播放列表失败', type: 'error' });
      return false;
    }
  },

  loadPlaylists: async () => {
    if (!window.electronAPI) return;
    try {
      const playlists = await window.electronAPI.getAllPlaylists();
      set({ playlists });
    } catch (error) {
      console.error('加载播放列表失败:', error);
    }
  },

  loadPlaylistMedia: async playlistId => {
    if (!window.electronAPI) return;
    set({ isLoading: true });
    try {
      const media = await window.electronAPI.getPlaylistMedia?.(playlistId);

      // 获取当前状态用于过滤
      const { watchedFolders, unlockedFolders } = useAppStore.getState();

      // 过滤掉来自加锁且未解锁文件夹的媒体
      const filteredMedia = (media || []).filter(m =>
        isMediaFromUnlockedFolder(m.path, watchedFolders, unlockedFolders)
      );

      set({ currentPlaylistMedia: filteredMedia });
      get().updateFilteredList();
    } catch (error) {
      console.error('加载播放列表媒体失败:', error);
      set({ currentPlaylistMedia: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  addMediaToPlaylist: async (playlistId, mediaIds) => {
    if (!window.electronAPI) return false;
    try {
      const success = await window.electronAPI.addMediaToPlaylist(playlistId, mediaIds);
      if (success) {
        const { activeTabId } = get();
        if (activeTabId === playlistId) {
          await get().loadPlaylistMedia(playlistId);
        }
        window.showToast?.({
          message: `已添加 ${mediaIds.length} 个文件到播放列表`,
          type: 'success',
        });
      }
      return success;
    } catch (error) {
      console.error('添加媒体到播放列表失败:', error);
      window.showToast?.({ message: '添加失败', type: 'error' });
      return false;
    }
  },

  removeMediaFromPlaylist: async (playlistId, mediaIds) => {
    if (!window.electronAPI) return false;
    try {
      const success = await window.electronAPI.removeMediaFromPlaylist(playlistId, mediaIds);
      if (success) {
        const { activeTabId, selectedMediaIds, lastSelectedId } = get();
        if (activeTabId === playlistId) {
          await get().loadPlaylistMedia(playlistId);
        }
        // 清除选中状态
        const newSet = new Set(selectedMediaIds);
        mediaIds.forEach(id => newSet.delete(id));
        set({ selectedMediaIds: newSet });
        if (lastSelectedId && mediaIds.includes(lastSelectedId)) {
          set({ lastSelectedId: null });
        }
      }
      return success;
    } catch (error) {
      console.error('从播放列表移除媒体失败:', error);
      return false;
    }
  },

  updatePlaylistOrder: async orders => {
    if (!window.electronAPI) return false;
    try {
      const success = await window.electronAPI.updatePlaylistOrder(orders);
      if (success) {
        await get().loadPlaylists();
      }
      return success;
    } catch (error) {
      console.error('更新播放列表顺序失败:', error);
      return false;
    }
  },
}));
