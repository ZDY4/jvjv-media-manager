import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Button, makeStyles, tokens } from '@fluentui/react-components';
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
  const styles = useStyles();
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
    handleAddPaths,
  } = useMediaActions();

  // Local state for resizing
  const [isResizing, setIsResizing] = useState(false);
  const [isDropActive, setIsDropActive] = useState(false);

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

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
  const currentSortLabel =
    currentSortField === 'filename'
      ? `名称${currentSortOrder === 'asc' ? '↑' : '↓'}`
      : `日期${currentSortOrder === 'asc' ? '↑' : '↓'}`;

  const handleCycleSortMode = () => {
    if (currentSortField === 'filename' && currentSortOrder === 'asc') {
      toggleCurrentSort('filename'); // 名称↑ -> 名称↓
      return;
    }
    if (currentSortField === 'filename' && currentSortOrder === 'desc') {
      toggleCurrentSort('modifiedAt'); // 名称↓ -> 日期↑
      return;
    }
    if (currentSortField === 'modifiedAt' && currentSortOrder === 'asc') {
      toggleCurrentSort('modifiedAt'); // 日期↑ -> 日期↓
      return;
    }
    toggleCurrentSort('filename'); // 日期↓ -> 名称↑
  };

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
      'fixed bg-[#252525]/95 backdrop-blur-md border border-[#4A4A4A] rounded-lg shadow-2xl py-1 z-50 min-w-[188px]';
    menu.style.left = `${e.clientX}px`;
    menu.style.top = `${e.clientY}px`;

    menu.innerHTML = `
      <button class="w-full text-left px-3.5 py-2 text-sm text-gray-200 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2" id="add-files">
        <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" d="M7 3h7l5 5v13a1 1 0 01-1 1H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
        </svg>
        添加文件
      </button>
      <button class="w-full text-left px-3.5 py-2 text-sm text-gray-200 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2" id="add-folder">
        <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" d="M3 7.5a1.5 1.5 0 011.5-1.5h4l1.6 1.6a1.5 1.5 0 001.06.44H19.5A1.5 1.5 0 0121 9.54V18a2 2 0 01-2 2H5a2 2 0 01-2-2V7.5z" />
        </svg>
        添加文件夹
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

  const hasDraggedFiles = (event: React.DragEvent): boolean =>
    Array.from(event.dataTransfer.types).includes('Files');

  const extractDroppedPaths = (event: React.DragEvent): string[] => {
    const fromFiles = Array.from(event.dataTransfer.files)
      .map(file => (file as File & { path?: string }).path)
      .filter((p): p is string => typeof p === 'string' && p.length > 0);

    if (fromFiles.length > 0) {
      return Array.from(new Set(fromFiles));
    }

    const uriList = event.dataTransfer.getData('text/uri-list');
    if (!uriList) return [];

    const parsed = uriList
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('#'))
      .map(uri => {
        try {
          const url = new URL(uri);
          if (url.protocol !== 'file:') return '';
          let pathname = decodeURIComponent(url.pathname);
          if (/^\/[a-zA-Z]:\//.test(pathname)) {
            pathname = pathname.slice(1);
          }
          return pathname.replace(/\//g, '\\');
        } catch {
          return '';
        }
      })
      .filter(Boolean);

    return Array.from(new Set(parsed));
  };

  const handleDropMediaToPlaylistTab = useCallback(
    async (playlistId: string, paths: string[]) => {
      if (!window.electronAPI) return;

      const importedMedia = await handleAddPaths(paths, { silentSuccessToast: true });
      if (importedMedia.length === 0) {
        return;
      }

      const mediaIds = Array.from(new Set(importedMedia.map(media => media.id)));
      if (mediaIds.length === 0) {
        window.showToast?.({ message: '未找到可添加到播放列表的媒体', type: 'info' });
        return;
      }

      try {
        const success = await window.electronAPI.addMediaToPlaylist(playlistId, mediaIds);
        if (!success) {
          window.showToast?.({ message: '导入成功，但加入播放列表失败', type: 'error' });
          return;
        }

        if (activeTabId === playlistId) {
          await loadPlaylistMedia(playlistId);
        }

        const playlistName = playlists.find(item => item.id === playlistId)?.name ?? '目标播放列表';
        window.showToast?.({
          message: `已导入并添加 ${mediaIds.length} 个文件到 "${playlistName}"`,
          type: 'success',
        });
      } catch (error) {
        console.error('拖拽添加到播放列表失败:', error);
        window.showToast?.({ message: '拖拽添加到播放列表失败', type: 'error' });
      }
    },
    [handleAddPaths, activeTabId, loadPlaylistMedia, playlists]
  );

  const handleLibraryDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    if (!isLibraryActive || !hasDraggedFiles(event)) return;
    event.preventDefault();
    event.stopPropagation();
    dragCounterRef.current += 1;
    setIsDropActive(true);
  };

  const handleLibraryDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (!isLibraryActive || !hasDraggedFiles(event)) return;
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'copy';
    if (!isDropActive) {
      setIsDropActive(true);
    }
  };

  const handleLibraryDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    if (!isLibraryActive || !hasDraggedFiles(event)) return;
    event.preventDefault();
    event.stopPropagation();
    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
    if (dragCounterRef.current === 0) {
      setIsDropActive(false);
    }
  };

  const handleLibraryDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    if (!isLibraryActive) return;
    event.preventDefault();
    event.stopPropagation();
    dragCounterRef.current = 0;
    setIsDropActive(false);

    const droppedPaths = extractDroppedPaths(event);
    if (droppedPaths.length === 0) {
      window.showToast?.({ message: '未检测到可导入的文件或文件夹', type: 'info' });
      return;
    }

    await handleAddPaths(droppedPaths);
  };

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
        className={`${styles.sidebarPanel} ${
          sidebarVisible || sidebarPinned ? 'opacity-100' : 'opacity-0 overflow-hidden'
        }`}
        style={{ width: sidebarWidth }}
      >
        {/* 固定按钮 */}
        <div className="absolute right-2 top-2 z-10">
          <Button
            appearance="subtle"
            size="small"
            onClick={() => setSidebarPinned(!sidebarPinned)}
            className={styles.pinButton}
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
          </Button>
        </div>

        {/* Tab栏 */}
        <TabBar
          playlists={playlists}
          activeTabId={activeTabId}
          onTabChange={setActiveTabId}
          onRenamePlaylist={renamePlaylist}
          onDeletePlaylist={deletePlaylist}
          onReorderPlaylists={handleReorderPlaylists}
          onRefreshLibrary={handleRefreshFolders}
          hasWatchedFolders={watchedFolders.length > 0}
          onDropMediaToPlaylistTab={handleDropMediaToPlaylistTab}
        />

        {/* 搜索栏 */}
        <div className={styles.searchContainer}>
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
        <div className={styles.toolbar}>
          <div className="flex items-center gap-2">
            <span className={styles.counterText}>
              {selectedIndex >= 0
                ? `${selectedIndex + 1} / ${currentMediaList.length}`
                : `${currentMediaList.length} 个文件`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* 视图模式切换 */}
            <div className={styles.viewModeGroup}>
              <Button
                appearance={viewMode === 'list' ? 'primary' : 'subtle'}
                size="small"
                onClick={() => setViewMode('list')}
                className={styles.viewModeButton}
                title="列表视图"
              >
                列表
              </Button>
              <Button
                appearance={viewMode === 'grid' ? 'primary' : 'subtle'}
                size="small"
                onClick={() => setViewMode('grid')}
                className={styles.viewModeButton}
                title="图标视图"
              >
                网格
              </Button>
            </div>

            <Button
              appearance="subtle"
              size="small"
              onClick={handleCycleSortMode}
              className={styles.sortButton}
              title="循环切换：名称↑ → 名称↓ → 日期↑ → 日期↓"
            >
              排序: {currentSortLabel}
            </Button>

            {/* 清空按钮 */}
            {currentMediaList.length > 0 && (
              <Button
                appearance="subtle"
                size="small"
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
                className={styles.clearButton}
                title="清空"
              >
                清空
              </Button>
            )}
          </div>
        </div>

        {/* 媒体网格 */}
        <div
          className={`flex-1 flex flex-col overflow-hidden relative ${
            isDropActive ? 'ring-2 ring-[#005FB8]/70 ring-inset bg-[#005FB8]/5' : ''
          }`}
          onDragEnter={handleLibraryDragEnter}
          onDragOver={handleLibraryDragOver}
          onDragLeave={handleLibraryDragLeave}
          onDrop={handleLibraryDrop}
        >
          {isDropActive && isLibraryActive && (
            <div className="absolute inset-3 border-2 border-dashed border-[#63AFFF] rounded-xl bg-[#005FB8]/10 pointer-events-none z-20 flex items-center justify-center">
              <div className="text-[#e0e0e0] text-sm bg-black/35 px-4 py-2 rounded-lg">
                释放鼠标以添加文件或文件夹到媒体库
              </div>
            </div>
          )}
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

const useStyles = makeStyles({
  sidebarPanel: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: colorMix(tokens.colorNeutralBackground2, 0.9),
    backdropFilter: 'blur(12px)',
    transitionDuration: '300ms',
    transitionProperty: 'opacity,width,transform',
    transitionTimingFunction: 'ease-out',
  },
  pinButton: {
    color: tokens.colorNeutralForeground3,
  },
  searchContainer: {
    padding: tokens.spacingHorizontalM,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  toolbar: {
    padding: tokens.spacingHorizontalM,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalS,
  },
  counterText: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  viewModeGroup: {
    display: 'flex',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalXXS,
    backgroundColor: colorMix(tokens.colorNeutralBackground3, 0.62),
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingHorizontalXXS,
  },
  viewModeButton: {
    minWidth: '52px',
  },
  sortButton: {
    minWidth: '128px',
  },
  clearButton: {
    color: tokens.colorPaletteRedForeground2,
  },
});

function colorMix(color: string, alpha: number): string {
  const percent = Math.max(0, Math.min(1, alpha)) * 100;
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`;
}
