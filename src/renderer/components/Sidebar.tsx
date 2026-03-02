import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useMediaStore } from '../store/useMediaStore';
import { usePlaylistStore } from '../store/usePlaylistStore';
import { useMediaActions } from '../hooks/useMediaActions';
import { useKeyboard } from '../hooks/useKeyboard';
import { SearchBar } from './SearchBar';
import { MediaGrid } from './MediaGrid';
import { TabBar } from './TabBar';
import { MediaFile, Playlist } from '../../shared/types';

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
    setIconSize,
  } = useAppStore();

  // 媒体库Store
  const {
    filteredMediaList: libraryMediaList,
    selectedMediaIds: librarySelectedIds,
    lastSelectedId: libraryLastSelectedId,
    searchQuery: librarySearchQuery,
    searchTags: librarySearchTags,
    sortField: librarySortField,
    sortOrder: librarySortOrder,
    setSearchQuery: setLibrarySearchQuery,
    setSearchTags: setLibrarySearchTags,
    setSelectedMediaIds: setLibrarySelectedIds,
    setLastSelectedId: setLibraryLastSelectedId,
    toggleSort: toggleLibrarySort,
  } = useMediaStore();

  // 播放列表Store
  const {
    playlists,
    activeTabId,
    filteredMediaList: playlistMediaList,
    selectedMediaIds: playlistSelectedIds,
    lastSelectedId: playlistLastSelectedId,
    searchQuery: playlistSearchQuery,
    sortField: playlistSortField,
    sortOrder: playlistSortOrder,
    setActiveTabId,
    setPlaylists,
    setSearchQuery: setPlaylistSearchQuery,
    setSelectedMediaIds: setPlaylistSelectedIds,
    setLastSelectedId: setPlaylistLastSelectedId,
    toggleSort: togglePlaylistSort,
    loadPlaylists,
    loadPlaylistMedia,
    createPlaylist,
    renamePlaylist,
    deletePlaylist,
    updatePlaylistOrder,
    removeMediaFromPlaylist,
  } = usePlaylistStore();

  // Actions
  const {
    handleRefreshFolders,
    handleDeleteMedia,
    handleOpenMediaFolder,
    handleAddFiles,
    handleAddFolder,
  } = useMediaActions();

  // Local state for resizing
  const [isResizing, setIsResizing] = useState(false);

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 初始化加载播放列表
  useEffect(() => {
    loadPlaylists();
  }, [loadPlaylists]);

  // 监听Tab切换，加载播放列表媒体
  useEffect(() => {
    if (activeTabId !== 'media-library') {
      loadPlaylistMedia(activeTabId);
    }
  }, [activeTabId, loadPlaylistMedia]);

  // 键盘快捷键
  useKeyboard({
    onFocusSearch: () => {
      searchInputRef.current?.focus();
    },
  });

  // 侧边栏宽度调整
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.max(250, Math.min(600, e.clientX));
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

  // 获取当前激活Tab的数据
  const isLibraryActive = activeTabId === 'media-library';
  const currentMediaList = isLibraryActive ? libraryMediaList : playlistMediaList;
  const currentSelectedIds = isLibraryActive ? librarySelectedIds : playlistSelectedIds;
  const currentLastSelectedId = isLibraryActive ? libraryLastSelectedId : playlistLastSelectedId;
  const currentSearchQuery = isLibraryActive ? librarySearchQuery : playlistSearchQuery;
  const currentSortField = isLibraryActive ? librarySortField : playlistSortField;
  const currentSortOrder = isLibraryActive ? librarySortOrder : playlistSortOrder;
  const setCurrentSearchQuery = isLibraryActive ? setLibrarySearchQuery : setPlaylistSearchQuery;
  const setCurrentSelectedIds = isLibraryActive ? setLibrarySelectedIds : setPlaylistSelectedIds;
  const setCurrentLastSelectedId = isLibraryActive
    ? setLibraryLastSelectedId
    : setPlaylistLastSelectedId;
  const toggleCurrentSort = isLibraryActive ? toggleLibrarySort : togglePlaylistSort;

  // 处理媒体点击
  const handleMediaClick = (media: MediaFile, isCtrlClick: boolean, isShiftClick: boolean) => {
    if (isShiftClick && currentLastSelectedId) {
      const lastIndex = currentMediaList.findIndex(m => m.id === currentLastSelectedId);
      const currentIndex = currentMediaList.findIndex(m => m.id === media.id);
      if (lastIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(lastIndex, currentIndex);
        const end = Math.max(lastIndex, currentIndex);
        const rangeIds = currentMediaList.slice(start, end + 1).map(m => m.id);

        const newSet = new Set(currentSelectedIds);
        rangeIds.forEach(id => newSet.add(id));
        setCurrentSelectedIds(newSet);
      }
    } else if (isCtrlClick) {
      const newSet = new Set(currentSelectedIds);
      if (newSet.has(media.id)) {
        newSet.delete(media.id);
      } else {
        newSet.add(media.id);
      }
      setCurrentSelectedIds(newSet);
    } else {
      setCurrentSelectedIds(new Set([media.id]));
    }
    setCurrentLastSelectedId(media.id);
  };

  // 处理编辑标签
  const handleEditTags = (medias: MediaFile[]) => {
    const { setEditingMedias, setTagEditorOpen } = useAppStore.getState();
    setEditingMedias(medias);
    setTagEditorOpen(true);
  };

  // 处理从播放列表移除
  const handleRemoveFromCurrentPlaylist = (mediaIds: string[]) => {
    if (isLibraryActive) {
      // 在媒体库中，移除只是从UI中移除，不删除文件
      const { setMediaList } = useMediaStore.getState();
      const { mediaList } = useMediaStore.getState();
      const newMediaList = mediaList.filter(m => !mediaIds.includes(m.id));
      setMediaList(newMediaList);

      const newSet = new Set(currentSelectedIds);
      mediaIds.forEach(id => newSet.delete(id));
      setCurrentSelectedIds(newSet);
      if (currentLastSelectedId && mediaIds.includes(currentLastSelectedId)) {
        setCurrentLastSelectedId(null);
      }
    } else {
      // 在播放列表中，从播放列表移除
      removeMediaFromPlaylist(activeTabId, mediaIds);
    }
  };

  // 处理播放列表重排序
  const handleReorderPlaylists = async (reorderedPlaylists: Playlist[]) => {
    const orders = reorderedPlaylists.map((p, index) => ({
      id: p.id,
      sortOrder: index + 1,
    }));
    const success = await updatePlaylistOrder(orders);
    if (success) {
      setPlaylists(reorderedPlaylists);
    }
  };

  // 处理添加到播放列表
  const handleAddToPlaylist = async (playlistId: string | null, mediaIds: string[]) => {
    if (!window.electronAPI || mediaIds.length === 0) return;

    try {
      if (playlistId === null) {
        // 需要创建新播放列表
        const playlist = await createPlaylist(`播放列表 ${playlists.length + 1}`);
        if (playlist) {
          await window.electronAPI.addMediaToPlaylist(playlist.id, mediaIds);
          window.showToast?.({
            message: `已创建播放列表并添加 ${mediaIds.length} 个文件`,
            type: 'success',
          });
        }
      } else {
        // 添加到已有播放列表
        const success = await window.electronAPI.addMediaToPlaylist(playlistId, mediaIds);
        if (success) {
          window.showToast?.({
            message: `已添加 ${mediaIds.length} 个文件到播放列表`,
            type: 'success',
          });
        }
      }
    } catch (error) {
      console.error('添加到播放列表失败:', error);
      window.showToast?.({ message: '添加到播放列表失败', type: 'error' });
    }
  };

  // 处理空白处右键菜单
  const handleEmptyContextMenu = (e: React.MouseEvent) => {
    // 显示自定义菜单
    const menu = document.createElement('div');
    menu.className =
      'fixed bg-[#2D2D2D] border border-[#3D3D3D] rounded-lg shadow-xl py-1 z-50 min-w-[160px]';
    menu.style.left = `${e.clientX}px`;
    menu.style.top = `${e.clientY}px`;

    menu.innerHTML = `
      <button class="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-[#e0e0e0] hover:bg-[#e0e0e0]/5 transition-colors flex items-center gap-2" id="add-files">
        📄 添加文件
      </button>
      <button class="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-[#e0e0e0] hover:bg-[#e0e0e0]/5 transition-colors flex items-center gap-2" id="add-folder">
        📁 添加文件夹
      </button>
    `;

    document.body.appendChild(menu);

    const cleanup = () => {
      menu.remove();
      document.removeEventListener('click', cleanup);
    };

    document.addEventListener('click', cleanup);

    menu.querySelector('#add-files')?.addEventListener('click', () => {
      handleAddFiles();
      cleanup();
    });

    menu.querySelector('#add-folder')?.addEventListener('click', () => {
      handleAddFolder();
      cleanup();
    });
  };

  // 处理右键菜单 - 添加文件/文件夹事件监听
  useEffect(() => {
    const handleAddFilesEvent = () => {
      handleAddFiles();
    };

    window.addEventListener('media-library-add-files', handleAddFilesEvent);
    return () => {
      window.removeEventListener('media-library-add-files', handleAddFilesEvent);
    };
  }, [handleAddFiles]);

  const selectedIndex = currentLastSelectedId
    ? currentMediaList.findIndex(m => m.id === currentLastSelectedId)
    : -1;

  if (isSidebarDetached) return null;

  return (
    <div
      style={{ width: sidebarPinned ? sidebarWidth : sidebarVisible ? sidebarWidth : 64 }}
      className={`absolute left-0 top-0 bottom-0 z-20 transition-all duration-300`}
      onMouseEnter={() => {
        if (!sidebarPinned) setSidebarVisible(true);
      }}
      onMouseLeave={() => {
        if (!sidebarPinned) setSidebarVisible(false);
      }}
    >
      <div
        className={`h-full border-r border-[#3D3D3D] flex flex-col bg-[#2D2D2D]/95 backdrop-blur-sm transition-all duration-300 ease-out ${
          sidebarVisible || sidebarPinned ? 'opacity-100' : 'opacity-0 overflow-hidden'
        }`}
        style={{ width: sidebarWidth }}
      >
        {/* 固定按钮 */}
        <div className="absolute right-2 top-2 z-10">
          <button
            onClick={() => setSidebarPinned(!sidebarPinned)}
            className="p-1 text-gray-400 hover:text-[#e0e0e0] transition-all duration-200"
            title={sidebarPinned ? '取消固定' : '固定侧边栏'}
          >
            {sidebarPinned ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Tab栏 */}
        <TabBar
          playlists={playlists}
          activeTabId={activeTabId}
          onTabChange={setActiveTabId}
          onCreatePlaylist={createPlaylist}
          onRenamePlaylist={renamePlaylist}
          onDeletePlaylist={deletePlaylist}
          onReorderPlaylists={handleReorderPlaylists}
          onRefreshLibrary={handleRefreshFolders}
          hasWatchedFolders={watchedFolders.length > 0}
        />

        {/* 搜索栏 */}
        <div className="p-3 border-b border-[#3D3D3D]">
          <SearchBar
            searchQuery={currentSearchQuery}
            onSearchChange={setCurrentSearchQuery}
            selectedTags={isLibraryActive ? librarySearchTags : []}
            onTagsChange={isLibraryActive ? setLibrarySearchTags : () => {}}
            inputRef={el => {
              (searchInputRef as React.MutableRefObject<HTMLInputElement | null>).current =
                el ?? null;
            }}
          />
        </div>

        {/* 工具栏 */}
        <div className="p-3 border-b border-[#3D3D3D] flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              {selectedIndex >= 0
                ? `${selectedIndex + 1} / ${currentMediaList.length}`
                : `${currentMediaList.length} 个文件`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* 视图模式切换 */}
            <div className="flex bg-[#3D3D3D] rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('list')}
                className={`px-2.5 py-1.5 text-xs rounded-md transition-all duration-200 ${
                  viewMode === 'list'
                    ? 'bg-[#005FB8] text-[#e0e0e0] shadow-sm'
                    : 'text-gray-400 hover:text-[#e0e0e0] hover:bg-[#e0e0e0]/5'
                }`}
                title="列表视图"
              >
                ☰
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-2.5 py-1.5 text-xs rounded-md transition-all duration-200 ${
                  viewMode === 'grid'
                    ? 'bg-[#005FB8] text-[#e0e0e0] shadow-sm'
                    : 'text-gray-400 hover:text-[#e0e0e0] hover:bg-[#e0e0e0]/5'
                }`}
                title="图标视图"
              >
                ▦
              </button>
            </div>

            {/* 排序按钮 */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => toggleCurrentSort('filename')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  currentSortField === 'filename'
                    ? 'bg-[#005FB8] text-white'
                    : 'text-gray-400 hover:text-[#e0e0e0] hover:bg-[#e0e0e0]/5'
                }`}
              >
                名称 {currentSortField === 'filename' && (currentSortOrder === 'asc' ? '↑' : '↓')}
              </button>
              <button
                onClick={() => toggleCurrentSort('modifiedAt')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  currentSortField === 'modifiedAt'
                    ? 'bg-[#005FB8] text-white'
                    : 'text-gray-400 hover:text-[#e0e0e0] hover:bg-[#e0e0e0]/5'
                }`}
              >
                日期 {currentSortField === 'modifiedAt' && (currentSortOrder === 'asc' ? '↑' : '↓')}
              </button>
            </div>

            {/* 清空按钮 */}
            {currentMediaList.length > 0 && (
              <button
                onClick={() => {
                  if (isLibraryActive) {
                    if (confirm('确定要清空媒体库吗？')) {
                      const { setMediaList } = useMediaStore.getState();
                      setMediaList([]);
                    }
                  } else {
                    if (confirm('确定要清空此播放列表吗？')) {
                      const allIds = currentMediaList.map(m => m.id);
                      removeMediaFromPlaylist(activeTabId, allIds);
                    }
                  }
                }}
                className="px-2 py-1 text-xs text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                title="清空"
              >
                清空
              </button>
            )}
          </div>
        </div>

        {/* 媒体网格 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <MediaGrid
            mediaList={currentMediaList}
            selectedIds={currentSelectedIds}
            lastSelectedId={currentLastSelectedId}
            onPlay={handleMediaClick}
            onDelete={handleDeleteMedia}
            onOpenFolder={handleOpenMediaFolder}
            onEditTags={handleEditTags}
            onRemoveFromPlaylist={handleRemoveFromCurrentPlaylist}
            onAddToPlaylist={handleAddToPlaylist}
            playlists={playlists}
            viewMode={viewMode}
            iconSize={iconSize}
            onIconSizeChange={setIconSize}
            onEmptyContextMenu={isLibraryActive ? handleEmptyContextMenu : undefined}
          />
        </div>
      </div>

      {/* 调整宽度手柄 */}
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
