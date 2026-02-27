import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useMediaStore } from '../store/useMediaStore';
import { useMediaActions } from '../hooks/useMediaActions';
import { useKeyboard } from '../hooks/useKeyboard';
import { SearchBar } from './SearchBar';
import { MediaGrid } from './MediaGrid';
import { MediaFile } from '../../shared/types';

export const Sidebar: React.FC = () => {
  // Store state
  const {
    sidebarPinned,
    sidebarVisible,
    sidebarWidth,
    isSidebarDetached,
    viewMode,
    iconSize,
    watchedFolders,
    setSidebarPinned,
    setSidebarVisible,
    setSidebarWidth,
    setViewMode,
    setShowSettings,
    setIconSize,
    setIsSidebarDetached
  } = useAppStore();

  const {
    filteredMediaList,
    selectedMediaIds,
    lastSelectedId,
    searchQuery,
    searchTags,
    setSearchQuery,
    setSearchTags,
    setSelectedMediaIds,
    setLastSelectedId
  } = useMediaStore();

  // Actions
  const {
    handleRefreshFolders,
    handleClearPlaylist,
    handleDeleteMedia,
    handleOpenMediaFolder,
    handleRemoveFromPlaylist
  } = useMediaActions();

  // Local state for resizing
  const [isResizing, setIsResizing] = useState(false);
  const [isDraggingToDetach, setIsDraggingToDetach] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  
  // Refs
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Keyboard Shortcuts
  useKeyboard({
    onFocusSearch: () => {
      searchInputRef.current?.focus();
    }
  });

  // Handlers
  const handleSidebarMouseEnter = () => {
    if (!sidebarPinned) {
      setSidebarVisible(true);
    }
  };

  const handleSidebarMouseLeave = () => {
    if (!sidebarPinned) {
      setSidebarVisible(false);
    }
  };

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.max(280, Math.min(600, e.clientX));
      setSidebarWidth(newWidth);
    },
    [isResizing, setSidebarWidth]
  );

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
      return () => {
        window.removeEventListener('mousemove', handleResizeMove);
        window.removeEventListener('mouseup', handleResizeEnd);
      };
    }
    return undefined;
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  // Detach logic
  const handleSidebarDragStart = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.resize-handle')) return;
    if (target.closest('button')) return;
    if (target.closest('input')) return;
    if (target.closest('.media-grid-container')) return;

    setDragStartPos({ x: e.clientX, y: e.clientY });
    setIsDraggingToDetach(true);
  }, []);

  const detachSidebar = useCallback(async () => {
    if (!window.electronAPI?.createPlaylistWindow) {
      window.showToast?.({ message: '独立窗口功能未启用', type: 'info' });
      return;
    }
    try {
      await window.electronAPI.createPlaylistWindow();
      setIsSidebarDetached(true);
      setSidebarVisible(false);
      window.showToast?.({ message: '播放列表已分离', type: 'success' });
    } catch (error) {
      console.error('分离窗口失败:', error);
      window.showToast?.({ message: '分离窗口失败', type: 'error' });
    }
  }, [setIsSidebarDetached, setSidebarVisible]);

  const attachSidebar = useCallback(async () => {
    if (!window.electronAPI?.closePlaylistWindow) return;
    try {
      await window.electronAPI.closePlaylistWindow();
      setIsSidebarDetached(false);
      setSidebarVisible(true);
      window.showToast?.({ message: '播放列表已合并', type: 'success' });
    } catch (error) {
      console.error('合并窗口失败:', error);
    }
  }, [setIsSidebarDetached, setSidebarVisible]);

  const handleSidebarDragMove = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingToDetach || !dragStartPos) return;

      const deltaX = Math.abs(e.clientX - dragStartPos.x);
      const deltaY = Math.abs(e.clientY - dragStartPos.y);

      if (deltaX > 100 || deltaY > 100) {
        detachSidebar();
        setIsDraggingToDetach(false);
        setDragStartPos(null);
      }
    },
    [isDraggingToDetach, dragStartPos, detachSidebar]
  );

  const handleSidebarDragEnd = useCallback(() => {
    setIsDraggingToDetach(false);
    setDragStartPos(null);
  }, []);

  useEffect(() => {
    if (isDraggingToDetach) {
      window.addEventListener('mousemove', handleSidebarDragMove);
      window.addEventListener('mouseup', handleSidebarDragEnd);
      return () => {
        window.removeEventListener('mousemove', handleSidebarDragMove);
        window.removeEventListener('mouseup', handleSidebarDragEnd);
      };
    }
    return undefined;
  }, [isDraggingToDetach, handleSidebarDragMove, handleSidebarDragEnd]);

  // Media interaction
  const handlePlayMedia = (media: MediaFile, isCtrlClick: boolean, isShiftClick: boolean) => {
    if (isShiftClick && lastSelectedId) {
      const lastIndex = filteredMediaList.findIndex(m => m.id === lastSelectedId);
      const currentIndex = filteredMediaList.findIndex(m => m.id === media.id);
      if (lastIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(lastIndex, currentIndex);
        const end = Math.max(lastIndex, currentIndex);
        const rangeIds = filteredMediaList.slice(start, end + 1).map(m => m.id);
        
        const newSet = new Set(selectedMediaIds);
        rangeIds.forEach(id => newSet.add(id));
        setSelectedMediaIds(newSet);
      }
    } else if (isCtrlClick) {
      const newSet = new Set(selectedMediaIds);
      if (newSet.has(media.id)) {
        newSet.delete(media.id);
      } else {
        newSet.add(media.id);
      }
      setSelectedMediaIds(newSet);
    } else {
      setSelectedMediaIds(new Set([media.id]));
    }
    setLastSelectedId(media.id);
  };
  
  const handleEditTags = (medias: MediaFile[]) => {
    // We need to set editing medias in AppStore
    // This logic was in App.tsx handleEditTags
    const { setEditingMedias, setTagEditorOpen } = useAppStore.getState();
    setEditingMedias(medias);
    setTagEditorOpen(true);
  };
  
  const selectedIndex = lastSelectedId
    ? filteredMediaList.findIndex(m => m.id === lastSelectedId)
    : -1;

  if (isSidebarDetached) return null;

  return (
    <div
      style={{ width: sidebarPinned ? sidebarWidth : sidebarVisible ? sidebarWidth : 64 }}
      className={`absolute left-0 top-0 bottom-0 z-20 transition-all duration-300`}
      onMouseEnter={handleSidebarMouseEnter}
      onMouseLeave={handleSidebarMouseLeave}
      onMouseDown={handleSidebarDragStart}
    >
      <div
        className={`h-full border-r border-[#3D3D3D] flex flex-col bg-[#2D2D2D]/95 backdrop-blur-sm transition-all duration-300 ease-out ${
          sidebarVisible || sidebarPinned ? 'opacity-100' : 'opacity-0 overflow-hidden'
        }`}
        style={{ width: sidebarWidth }}
      >
        {/* Pin Button */}
        <div className="absolute right-2 top-2 z-10">
          <button
            onClick={() => setSidebarPinned(!sidebarPinned)}
            className="p-1 text-gray-400 hover:text-[#e0e0e0] transition-all duration-200"
            title={sidebarPinned ? '取消固定' : '固定侧边栏'}
          >
            {sidebarPinned ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            )}
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-[#3D3D3D]">
          <SearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedTags={searchTags}
            onTagsChange={setSearchTags}
            inputRef={(el) => { searchInputRef.current = el ?? null; }}
          />
        </div>

        {/* Playlist Header */}
        <div className="p-3 border-b border-[#3D3D3D] flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h2 className="text-[#e0e0e0] font-semibold text-sm">播放列表</h2>
            {isSidebarDetached && (
              <button
                onClick={attachSidebar}
                className="text-xs text-gray-400 hover:text-blue-400 transition-colors"
                title="合并窗口"
              >
                🗗 合并
              </button>
            )}
            {filteredMediaList.length > 0 && (
              <button
                onClick={handleClearPlaylist}
                className="text-xs text-gray-400 hover:text-red-400 transition-colors"
                title="清空播放列表"
              >
                清空
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              {selectedIndex >= 0 ? `${selectedIndex + 1} / ${filteredMediaList.length}` : ''}
            </span>

            {viewMode === 'grid' && (
              <span className="text-xs text-gray-400">{iconSize}px</span>
            )}

            <div className="flex bg-[#3D3D3D] rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('list')}
                className={`px-2.5 py-1.5 text-xs rounded-md transition-all duration-200 ${viewMode === 'list' ? 'bg-[#005FB8] text-[#e0e0e0] shadow-sm' : 'text-gray-400 hover:text-[#e0e0e0] hover:bg-[#e0e0e0]/5'}`}
                title="列表视图"
              >
                ☰
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-2.5 py-1.5 text-xs rounded-md transition-all duration-200 ${viewMode === 'grid' ? 'bg-[#005FB8] text-[#e0e0e0] shadow-sm' : 'text-gray-400 hover:text-[#e0e0e0] hover:bg-[#e0e0e0]/5'}`}
                title="图标视图"
              >
                ▦
              </button>
            </div>

            {watchedFolders.length > 0 && (
              <button
                onClick={handleRefreshFolders}
                className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-[#e0e0e0] transition-colors"
                title="刷新文件夹"
              >
                🔄
              </button>
            )}

            <button
              onClick={() => setShowSettings(true)}
              className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-[#e0e0e0] transition-colors"
              title="设置"
            >
              ⚙️
            </button>
          </div>
        </div>

        {/* Media Grid */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <MediaGrid
            mediaList={filteredMediaList}
            selectedIds={selectedMediaIds}
            lastSelectedId={lastSelectedId}
            onPlay={handlePlayMedia}
            onDelete={handleDeleteMedia}
            onOpenFolder={handleOpenMediaFolder}
            onEditTags={handleEditTags}
            onRemoveFromPlaylist={handleRemoveFromPlaylist}
            viewMode={viewMode}
            iconSize={iconSize}
            onIconSizeChange={setIconSize}
          />
        </div>
      </div>

      {/* Resize Handle */}
      {sidebarPinned && (
        <div
          className="resize-handle absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#005FB8] z-30 transition-colors"
          onMouseDown={handleResizeStart}
          title="拖拽调整宽度"
        />
      )}
    </div>
  );
};
