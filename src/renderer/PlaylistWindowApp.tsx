import { useEffect, useMemo, useRef, useState } from 'react';
import { SearchBar } from './components/SearchBar';
import { MediaGrid } from './components/MediaGrid';
import type { MediaFile } from '../shared/types';

type ViewMode = 'list' | 'grid';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const PlaylistWindowApp = () => {
  const [mediaList, setMediaList] = useState<MediaFile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [iconSize, setIconSize] = useState(120);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchTags, setSearchTags] = useState<string[]>([]);

  const selectedIds = useMemo(() => (selectedId ? new Set([selectedId]) : new Set<string>()), [selectedId]);

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const tags = searchTags;
    return mediaList.filter((m) => {
      if (q && !m.filename.toLowerCase().includes(q)) return false;
      if (tags.length > 0 && !tags.every((t) => m.tags.includes(t))) return false;
      return true;
    });
  }, [mediaList, searchQuery, searchTags]);

  const selectedIndexText = useMemo(() => {
    if (!selectedId) return '';
    const idx = filteredList.findIndex((m) => m.id === selectedId);
    if (idx < 0) return '';
    return `${idx + 1} / ${filteredList.length}`;
  }, [filteredList, selectedId]);

  useEffect(() => {
    if (!window.electronAPI?.onPlaylistDataSync) return;

    const unsubscribe = window.electronAPI.onPlaylistDataSync((data) => {
      setMediaList(data.mediaList ?? []);
      setSelectedId(data.selectedId ?? null);
      if (data.viewMode) setViewMode(data.viewMode);
      if (typeof data.iconSize === 'number') setIconSize(data.iconSize);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    window.electronAPI?.sendPlaylistAction?.({ type: 'ready' });
  }, []);

  const requestAttachToMain = () => {
    window.electronAPI?.closePlaylistWindow?.();
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    window.electronAPI?.sendPlaylistAction?.({ type: 'setViewMode', payload: { viewMode: mode } });
  };

  const handleIconSizeChange = (size: number) => {
    const next = clamp(size, 80, 240);
    setIconSize(next);
    window.electronAPI?.sendPlaylistAction?.({ type: 'setIconSize', payload: { iconSize: next } });
  };

  const handlePlay = (media: MediaFile) => {
    setSelectedId(media.id);
    window.electronAPI?.sendPlaylistAction?.({ type: 'play', payload: { mediaId: media.id } });
  };

  return (
    <div className="h-screen flex flex-col bg-[#202020] text-white overflow-hidden">
      <div className="h-9 bg-[#2D2D2D] flex items-center justify-between select-none z-50" style={{ WebkitAppRegion: 'drag' }}>
        <div className="flex items-center gap-2 px-3" style={{ WebkitAppRegion: 'no-drag' }}>
          <span className="text-[#e0e0e0] text-sm font-semibold">播放列表</span>
          <button
            onClick={requestAttachToMain}
            className="text-xs text-gray-400 hover:text-blue-400 transition-colors"
            title="回到主窗口"
          >
            🗗 合并
          </button>
        </div>
        <div className="flex items-center" style={{ WebkitAppRegion: 'no-drag' }}>
          <button
            onClick={() => window.electronAPI?.minimizeWindow?.()}
            className="w-10 h-9 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
            title="最小化"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <button
            onClick={() => window.electronAPI?.maximizeWindow?.()}
            className="w-10 h-9 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
            title="最大化"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
          </button>
          <button
            onClick={requestAttachToMain}
            className="w-10 h-9 flex items-center justify-center text-gray-400 hover:bg-red-600 hover:text-white transition-colors"
            title="关闭"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-3 border-b border-[#3D3D3D] bg-[#202020]">
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedTags={searchTags}
          onTagsChange={setSearchTags}
          inputRef={(el) => {
            searchInputRef.current = el ?? null;
          }}
        />
      </div>

      <div className="p-3 border-b border-[#3D3D3D] flex justify-between items-center bg-[#202020]">
        <div className="flex items-center gap-2">
          <span className="text-[#e0e0e0] font-semibold text-sm">播放列表</span>
          <span className="text-xs text-gray-400">{selectedIndexText}</span>
        </div>
        <div className="flex items-center gap-2">
          {viewMode === 'grid' && (
            <>
              <span className="text-xs text-gray-400">{iconSize}px</span>
              <input
                type="range"
                min={80}
                max={240}
                step={10}
                value={iconSize}
                onChange={(e) => handleIconSizeChange(Number(e.target.value))}
                className="w-28 accent-[#005FB8]"
                title="缩放图标大小"
              />
            </>
          )}
          <div className="flex bg-[#3D3D3D] rounded-lg p-0.5">
            <button
              onClick={() => handleViewModeChange('list')}
              className={`px-2.5 py-1.5 text-xs rounded-md transition-all duration-200 ${viewMode === 'list' ? 'bg-[#005FB8] text-[#e0e0e0] shadow-sm' : 'text-gray-400 hover:text-[#e0e0e0] hover:bg-[#e0e0e0]/5'}`}
              title="列表视图"
            >
              ☰
            </button>
            <button
              onClick={() => handleViewModeChange('grid')}
              className={`px-2.5 py-1.5 text-xs rounded-md transition-all duration-200 ${viewMode === 'grid' ? 'bg-[#005FB8] text-[#e0e0e0] shadow-sm' : 'text-gray-400 hover:text-[#e0e0e0] hover:bg-[#e0e0e0]/5'}`}
              title="图标视图"
            >
              ▦
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <MediaGrid
          mediaList={filteredList}
          selectedIds={selectedIds}
          lastSelectedId={selectedId}
          onPlay={(media) => handlePlay(media)}
          onDelete={() => {
            window.showToast?.({ message: '请在主窗口中删除', type: 'info' });
          }}
          onOpenFolder={(media) => {
            window.electronAPI?.openMediaFolder?.(media.path);
          }}
          viewMode={viewMode}
          iconSize={iconSize}
          onIconSizeChange={handleIconSizeChange}
        />
      </div>
    </div>
  );
};
