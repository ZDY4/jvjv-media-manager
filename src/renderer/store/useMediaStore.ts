import { create } from 'zustand';
import { MediaFile } from '../../shared/types';

type SortField = 'filename' | 'modifiedAt';
type SortOrder = 'asc' | 'desc';

interface MediaState {
  mediaList: MediaFile[];
  filteredMediaList: MediaFile[];
  selectedMediaIds: Set<string>;
  lastSelectedId: string | null;
  searchQuery: string;
  searchTags: string[];
  isLoading: boolean;
  sortField: SortField;
  sortOrder: SortOrder;

  // Actions
  setMediaList: (mediaList: MediaFile[]) => void;
  addMediaFiles: (files: MediaFile[]) => void; // 增量添加
  setSearchQuery: (query: string) => void;
  setSearchTags: (tags: string[]) => void;
  setSelectedMediaIds: (ids: Set<string>) => void;
  setLastSelectedId: (id: string | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  setSortField: (field: SortField) => void;
  setSortOrder: (order: SortOrder) => void;
  toggleSort: (field: SortField) => void;

  // Helpers
  updateFilteredList: () => void;
  clearSelection: () => void;
}

export const useMediaStore = create<MediaState>((set, get) => ({
  mediaList: [],
  filteredMediaList: [],
  selectedMediaIds: new Set(),
  lastSelectedId: null,
  searchQuery: '',
  searchTags: [],
  isLoading: false,
  sortField: 'modifiedAt',
  sortOrder: 'desc',

  setMediaList: mediaList => {
    set({ mediaList });
    get().updateFilteredList();
  },

  addMediaFiles: files => {
    const { mediaList } = get();
    // 去重：避免添加已存在的文件
    const existingPaths = new Set(mediaList.map(m => m.path));
    const newFiles = files.filter(f => !existingPaths.has(f.path));

    if (newFiles.length > 0) {
      const updatedList = [...mediaList, ...newFiles];
      set({ mediaList: updatedList });
      get().updateFilteredList();
    }
  },

  setSearchQuery: searchQuery => {
    set({ searchQuery });
    get().updateFilteredList();
  },

  setSearchTags: searchTags => {
    set({ searchTags });
    get().updateFilteredList();
  },

  setSelectedMediaIds: selectedMediaIds => set({ selectedMediaIds }),

  setLastSelectedId: lastSelectedId => set({ lastSelectedId }),

  setIsLoading: isLoading => set({ isLoading }),

  setSortField: sortField => {
    set({ sortField });
    get().updateFilteredList();
  },

  setSortOrder: sortOrder => {
    set({ sortOrder });
    get().updateFilteredList();
  },

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
    const { mediaList, searchQuery, searchTags, sortField, sortOrder } = get();
    let filtered = [...mediaList];

    // Filter by search query (filename or tags)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(media => {
        const filenameMatch = media.filename.toLowerCase().includes(query);
        const tagMatch = media.tags.some(tag => tag.toLowerCase().includes(query));
        return filenameMatch || tagMatch;
      });
    }

    // Filter by tags (must match all selected tags)
    if (searchTags.length > 0) {
      filtered = filtered.filter(media =>
        searchTags.every(tag =>
          media.tags.some(mediaTag => mediaTag.toLowerCase().includes(tag.toLowerCase()))
        )
      );
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
}));
