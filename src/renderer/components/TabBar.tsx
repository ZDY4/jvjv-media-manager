import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  Input,
  makeStyles,
  mergeClasses,
  tokens,
} from '@fluentui/react-components';
import type { Playlist } from '../../shared/types';

interface TabBarProps {
  // 播放列表
  playlists: Playlist[];
  // 当前激活的Tab ID
  activeTabId: string;
  // Tab切换回调
  onTabChange: (tabId: string) => void;
  // 创建播放列表回调
  onCreatePlaylist: (name: string) => void;
  // 重命名播放列表回调
  onRenamePlaylist: (id: string, name: string) => void;
  // 删除播放列表回调
  onDeletePlaylist: (id: string) => void;
  // 播放列表排序改变回调
  onReorderPlaylists: (playlists: Playlist[]) => void;
  // 刷新媒体库回调（仅当媒体库Tab激活时显示）
  onRefreshLibrary?: () => void;
  // 是否有监控的文件夹
  hasWatchedFolders?: boolean;
}

// Tab右键菜单状态
interface TabContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  playlistId: string | null;
}

export const TabBar: React.FC<TabBarProps> = ({
  playlists,
  activeTabId,
  onTabChange,
  onCreatePlaylist,
  onRenamePlaylist,
  onDeletePlaylist,
  onReorderPlaylists,
  onRefreshLibrary,
  hasWatchedFolders = false,
}) => {
  const styles = useStyles();
  // Tab容器引用
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [dragOverTabId, setDragOverTabId] = useState<string | null>(null);

  // 右键菜单状态
  const [contextMenu, setContextMenu] = useState<TabContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    playlistId: null,
  });

  // 新建播放列表弹窗状态
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  // 重命名弹窗状态
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [renamePlaylistId, setRenamePlaylistId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // 处理滚轮横向滚动
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!tabsContainerRef.current) return;

    // 只有当有水平滚动空间时才处理
    const container = tabsContainerRef.current;
    const canScrollLeft = container.scrollLeft > 0;
    const canScrollRight = container.scrollLeft < container.scrollWidth - container.clientWidth;

    // 检测滚动方向
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      // 垂直滚动转换为水平滚动
      if ((e.deltaY < 0 && canScrollLeft) || (e.deltaY > 0 && canScrollRight)) {
        e.preventDefault();
        container.scrollLeft += e.deltaY;
      }
    }
  }, []);

  // Tab右键菜单
  const handleTabContextMenu = (e: React.MouseEvent, playlistId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      playlistId,
    });
  };

  // 关闭菜单
  const closeContextMenu = () => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = () => {
      closeContextMenu();
    };

    if (contextMenu.visible) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
    return undefined;
  }, [contextMenu.visible]);

  // 处理重命名
  const handleRenameClick = () => {
    if (contextMenu.playlistId) {
      const playlist = playlists.find(p => p.id === contextMenu.playlistId);
      if (playlist) {
        setRenamePlaylistId(playlist.id);
        setRenameValue(playlist.name);
        setShowRenameDialog(true);
      }
    }
    closeContextMenu();
  };

  // 确认重命名
  const handleConfirmRename = () => {
    if (renamePlaylistId && renameValue.trim()) {
      onRenamePlaylist(renamePlaylistId, renameValue.trim());
    }
    setShowRenameDialog(false);
    setRenamePlaylistId(null);
    setRenameValue('');
  };

  // 处理删除
  const handleDeleteClick = () => {
    if (contextMenu.playlistId) {
      const playlist = playlists.find(p => p.id === contextMenu.playlistId);
      if (playlist && confirm(`确定要删除播放列表 "${playlist.name}" 吗？`)) {
        onDeletePlaylist(contextMenu.playlistId);
      }
    }
    closeContextMenu();
  };

  // 处理新建播放列表
  const handleCreatePlaylist = () => {
    if (newPlaylistName.trim()) {
      onCreatePlaylist(newPlaylistName.trim());
    }
    setShowCreateDialog(false);
    setNewPlaylistName('');
  };

  // 拖动开始
  const handleDragStart = (e: React.DragEvent, tabId: string) => {
    // 媒体库Tab不允许拖动
    if (tabId === 'media-library') {
      e.preventDefault();
      return;
    }
    setIsDragging(true);
    setDraggedTabId(tabId);
    e.dataTransfer.effectAllowed = 'move';
  };

  // 拖动经过
  const handleDragOver = (e: React.DragEvent, tabId: string) => {
    e.preventDefault();
    if (tabId !== draggedTabId && tabId !== 'media-library') {
      setDragOverTabId(tabId);
    }
  };

  // 拖动离开
  const handleDragLeave = () => {
    setDragOverTabId(null);
  };

  // 拖动放下
  const handleDrop = (e: React.DragEvent, targetTabId: string) => {
    e.preventDefault();
    setIsDragging(false);
    setDragOverTabId(null);

    if (draggedTabId && draggedTabId !== targetTabId && targetTabId !== 'media-library') {
      // 重新排序播放列表
      const reordered = [...playlists];
      const draggedIndex = reordered.findIndex(p => p.id === draggedTabId);
      const targetIndex = reordered.findIndex(p => p.id === targetTabId);

      if (draggedIndex !== -1 && targetIndex !== -1) {
        const [removed] = reordered.splice(draggedIndex, 1);
        if (removed) {
          reordered.splice(targetIndex, 0, removed);

          // 更新sortOrder
          const updatedPlaylists = reordered.map((p, index) => ({
            ...p,
            sortOrder: index + 1,
          }));

          onReorderPlaylists(updatedPlaylists);
        }
      }
    }
    setDraggedTabId(null);
  };

  // 拖动结束
  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedTabId(null);
    setDragOverTabId(null);
  };

  return (
    <>
      {/* Tab栏 */}
      <div className={styles.tabRoot}>
        {/* Tab容器 */}
        <div
          ref={tabsContainerRef}
          className={styles.tabScroller}
          onWheel={handleWheel}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* 媒体库固定Tab */}
          <div
            className={mergeClasses(
              styles.tabItem,
              activeTabId === 'media-library' ? styles.tabItemActive : styles.tabItemIdle
            )}
            onClick={() => onTabChange('media-library')}
            onContextMenu={e => handleTabContextMenu(e, null)}
          >
            <span className="text-sm font-medium">媒体库</span>

            {/* 刷新按钮 - 仅在媒体库Tab激活且有监控文件夹时显示 */}
            {activeTabId === 'media-library' && hasWatchedFolders && onRefreshLibrary && (
              <Button
                appearance="subtle"
                size="small"
                onClick={e => {
                  e.stopPropagation();
                  onRefreshLibrary();
                }}
                className={styles.refreshButton}
                title="刷新媒体库"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </Button>
            )}
          </div>

          {/* 播放列表Tabs */}
          {playlists.map(playlist => (
            <div
              key={playlist.id}
              draggable
              onDragStart={e => handleDragStart(e, playlist.id)}
              onDragOver={e => handleDragOver(e, playlist.id)}
              onDragLeave={handleDragLeave}
              onDrop={e => handleDrop(e, playlist.id)}
              onDragEnd={handleDragEnd}
              className={mergeClasses(
                styles.tabItem,
                activeTabId === playlist.id ? styles.tabItemActive : styles.tabItemIdle,
                dragOverTabId === playlist.id ? styles.tabDragOver : '',
                isDragging && draggedTabId === playlist.id ? 'opacity-50' : ''
              )}
              onClick={() => onTabChange(playlist.id)}
              onContextMenu={e => handleTabContextMenu(e, playlist.id)}
            >
              <span className="text-sm font-medium truncate max-w-[120px]">{playlist.name}</span>
            </div>
          ))}
        </div>

        {/* 新建播放列表按钮 */}
        <Button
          appearance="subtle"
          size="small"
          onClick={() => setShowCreateDialog(true)}
          className={styles.createButton}
          title="新建播放列表"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </Button>
      </div>

      {/* Tab右键菜单 */}
      {contextMenu.visible && (
        <div
          className={styles.contextMenu}
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={e => e.stopPropagation()}
        >
          {contextMenu.playlistId ? (
            // 播放列表菜单
            <>
              <Button
                appearance="subtle"
                size="small"
                onClick={handleRenameClick}
                className={styles.contextItem}
              >
                重命名
              </Button>
              <Button
                appearance="subtle"
                size="small"
                onClick={handleDeleteClick}
                className={styles.contextItem}
              >
                删除
              </Button>
            </>
          ) : (
            // 媒体库菜单
            <Button
              appearance="subtle"
              size="small"
              onClick={() => {
                closeContextMenu();
                // 这里可以通过事件通知添加文件/文件夹
                window.dispatchEvent(new CustomEvent('media-library-add-files'));
              }}
              className={styles.contextItem}
            >
              添加文件/文件夹
            </Button>
          )}
        </div>
      )}

      {/* 新建播放列表弹窗 */}
      <Dialog open={showCreateDialog} onOpenChange={(_, data) => setShowCreateDialog(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>新建播放列表</DialogTitle>
            <DialogContent>
              <Field label="播放列表名称">
                <Input
                  value={newPlaylistName}
                  onChange={(_, data) => setNewPlaylistName(data.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleCreatePlaylist();
                    if (e.key === 'Escape') setShowCreateDialog(false);
                  }}
                  placeholder="输入播放列表名称"
                />
              </Field>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setShowCreateDialog(false)}>
                取消
              </Button>
              <Button appearance="primary" onClick={handleCreatePlaylist} disabled={!newPlaylistName.trim()}>
                创建
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* 重命名弹窗 */}
      <Dialog open={showRenameDialog} onOpenChange={(_, data) => setShowRenameDialog(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>重命名播放列表</DialogTitle>
            <DialogContent>
              <Field label="新名称">
                <Input
                  value={renameValue}
                  onChange={(_, data) => setRenameValue(data.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleConfirmRename();
                    if (e.key === 'Escape') setShowRenameDialog(false);
                  }}
                  placeholder="输入新名称"
                />
              </Field>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setShowRenameDialog(false)}>
                取消
              </Button>
              <Button appearance="primary" onClick={handleConfirmRename} disabled={!renameValue.trim()}>
                确认
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </>
  );
};

const useStyles = makeStyles({
  tabRoot: {
    display: 'flex',
    alignItems: 'center',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: colorMix(tokens.colorNeutralBackground3, 0.72),
    backdropFilter: 'blur(10px)',
  },
  tabScroller: {
    flex: 1,
    display: 'flex',
    overflowX: 'auto',
  },
  tabItem: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalXXS,
    padding: `${tokens.spacingVerticalSNudge} ${tokens.spacingHorizontalM}`,
    cursor: 'pointer',
    userSelect: 'none',
    transitionDuration: '140ms',
    transitionProperty: 'background-color,color,border-color',
    borderTop: `2px solid transparent`,
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase300,
  },
  tabItemActive: {
    color: tokens.colorNeutralForeground1,
    backgroundColor: colorMix(tokens.colorNeutralBackground2, 0.82),
    borderTopColor: tokens.colorBrandStroke1,
  },
  tabItemIdle: {
    ':hover': {
      color: tokens.colorNeutralForeground2,
      backgroundColor: colorMix(tokens.colorNeutralBackground2, 0.42),
    },
  },
  tabDragOver: {
    backgroundColor: colorMix(tokens.colorBrandBackground2, 0.35),
  },
  refreshButton: {
    minWidth: 'unset',
    marginLeft: tokens.spacingHorizontalXXS,
  },
  createButton: {
    marginRight: tokens.spacingHorizontalXS,
    minWidth: '36px',
  },
  contextMenu: {
    position: 'fixed',
    minWidth: '156px',
    display: 'flex',
    flexDirection: 'column',
    padding: tokens.spacingVerticalXXS,
    backgroundColor: colorMix(tokens.colorNeutralBackground2, 0.94),
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow16,
    zIndex: 50,
  },
  contextItem: {
    justifyContent: 'flex-start',
    color: tokens.colorNeutralForeground2,
  },
});

function colorMix(color: string, alpha: number): string {
  const percent = Math.max(0, Math.min(1, alpha)) * 100;
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`;
}
