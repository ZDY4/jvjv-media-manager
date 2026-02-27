import { create } from 'zustand';
import { MediaFile } from '../../shared/types';

interface MediaState {
  mediaList: MediaFile[];
  filteredMediaList: MediaFile[];
  selectedMediaIds: Set<string>;
  lastSelectedId: string | null;
  searchQuery: string;
  searchTags: string[];
  isLoading: boolean;
  
  // Actions
  setMediaList: (mediaList: MediaFile[]) => void;
  setSearchQuery: (query: string) => void;
  setSearchTags: (tags: string[]) => void;
  setSelectedMediaIds: (ids: Set<string>) => void;
  setLastSelectedId: (id: string | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  
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

  setMediaList: (mediaList) => {
    set({ mediaList });
    get().updateFilteredList();
  },

  setSearchQuery: (searchQuery) => {
    set({ searchQuery });
    get().updateFilteredList();
  },

  setSearchTags: (searchTags) => {
    set({ searchTags });
    get().updateFilteredList();
  },

  setSelectedMediaIds: (selectedMediaIds) => set({ selectedMediaIds }),
  
  setLastSelectedId: (lastSelectedId) => set({ lastSelectedId }),
  
  setIsLoading: (isLoading) => set({ isLoading }),

  updateFilteredList: () => {
    const { mediaList, searchQuery, searchTags } = get();
    let filtered = mediaList;

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

    set({ filteredMediaList: filtered });
  },

  clearSelection: () => {
    set({ selectedMediaIds: new Set(), lastSelectedId: null });
  }
}));
