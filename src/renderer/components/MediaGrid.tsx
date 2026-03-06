import React, { useState, useEffect, useRef } from 'react';
import type { MediaFile, Playlist } from '../../shared/types';
import { formatSize } from '../utils/format';
import { getMediaUrl } from '../utils/mediaUrl';
import { VirtualMediaGrid } from './VirtualMediaGrid';

interface MediaGridProps {
  mediaList: MediaFile[];
  selectedIds?: Set<string>;
  lastSelectedId?: string | null;
  onPlay: (media: MediaFile, isCtrlClick: boolean, isShiftClick: boolean) => void;
  onDelete: (mediaIds: string[]) => void;
  onOpenFolder?: (media: MediaFile) => void;
  onEditTags?: (medias: MediaFile[]) => void;
  onRemoveFromPlaylist?: (mediaIds: string[]) => void;
  onAddToPlaylist?: (playlistId: string | null, mediaIds: string[]) => void;
  playlists?: Playlist[];
  viewMode?: 'list' | 'grid';
  iconSize?: number;
  onIconSizeChange?: (size: number) => void;
  // 空白处右键回调
  onEmptyContextMenu?: (e: React.MouseEvent) => void;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  media: MediaFile | null;
}

const OpenFolderIcon: React.FC = () => (
  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.7}
      d="M3 7.5a1.5 1.5 0 011.5-1.5h4l1.6 1.6a1.5 1.5 0 001.06.44H19.5A1.5 1.5 0 0121 9.54V18a2 2 0 01-2 2H5a2 2 0 01-2-2V7.5z"
    />
  </svg>
);

const PlaylistIcon: React.FC = () => (
  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M4 7h16M4 12h10M4 17h8m8-3v4m0 0l2-2m-2 2l-2-2" />
  </svg>
);

const TagIcon: React.FC = () => (
  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.7}
      d="M20 12l-8 8-9-9V4h7l10 8zM7.5 7.5h.01"
    />
  </svg>
);

const RemoveIcon: React.FC = () => (
  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M4 6h16m-3 0v12a2 2 0 01-2 2H9a2 2 0 01-2-2V6m3-2h4m-2 8v6" />
  </svg>
);

const DeleteIcon: React.FC = () => (
  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M4 7h16m-3 0v12a2 2 0 01-2 2H9a2 2 0 01-2-2V7m3-3h4m-5 8l1 6m4-6l-1 6" />
  </svg>
);

export const MediaGrid: React.FC<MediaGridProps> = ({
  mediaList,
  selectedIds = new Set(),
  onPlay,
  onDelete,
  onOpenFolder,
  onEditTags,
  onRemoveFromPlaylist,
  onAddToPlaylist,
  playlists = [],
  viewMode = 'list',
  iconSize = 120,
  onIconSizeChange,
  onEmptyContextMenu,
}) => {
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    media: null,
  });
  const [showTooltip, setShowTooltip] = useState(false);
  const [showPlaylistDialog, setShowPlaylistDialog] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [mediaToAdd, setMediaToAdd] = useState<string[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 处理右键菜单
  const handleContextMenu = (e: React.MouseEvent, media: MediaFile | null) => {
    e.preventDefault();
    e.stopPropagation();

    if (media) {
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        media,
      });
    } else {
      // 空白处右键
      onEmptyContextMenu?.(e);
    }
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

  // 执行菜单操作
  const handleMenuAction = (action: 'open' | 'delete' | 'tags' | 'remove' | 'addToPlaylist') => {
    if (!contextMenu.media) return;

    const targetIds = selectedIds.has(contextMenu.media.id)
      ? Array.from(selectedIds)
      : [contextMenu.media.id];

    switch (action) {
      case 'open':
        onOpenFolder?.(contextMenu.media);
        break;
      case 'delete':
        onDelete(targetIds);
        break;
      case 'tags':
        onEditTags?.(
          targetIds.map(id => mediaList.find(m => m.id === id)).filter(Boolean) as MediaFile[]
        );
        break;
      case 'remove':
        onRemoveFromPlaylist?.(targetIds);
        break;
      case 'addToPlaylist':
        setMediaToAdd(targetIds);
        setShowPlaylistDialog(true);
        break;
    }
    closeContextMenu();
  };

  // 处理添加到播放列表
  const handleConfirmAddToPlaylist = () => {
    if (mediaToAdd.length > 0 && onAddToPlaylist) {
      if (newPlaylistName.trim()) {
        // 创建新播放列表并添加
        onAddToPlaylist(null, mediaToAdd);
      } else if (selectedPlaylistId) {
        // 添加到已有播放列表
        onAddToPlaylist(selectedPlaylistId, mediaToAdd);
      }
    }
    setShowPlaylistDialog(false);
    setNewPlaylistName('');
    setSelectedPlaylistId(null);
    setMediaToAdd([]);
  };

  // 处理点击事件（支持多选）
  const handleMediaClick = (e: React.MouseEvent, media: MediaFile) => {
    const isCtrlClick = e.ctrlKey || e.metaKey;
    const isShiftClick = e.shiftKey;
    onPlay(media, isCtrlClick, isShiftClick);
  };

  // 显示提示
  const handleMouseEnter = () => {
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    if (viewMode !== 'grid') return undefined;
    if (!onIconSizeChange) return undefined;

    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();

      const step = 10;
      const delta = e.deltaY < 0 ? step : -step;
      const next = Math.min(240, Math.max(80, iconSize + delta));
      if (next !== iconSize) onIconSizeChange(next);
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, [iconSize, onIconSizeChange, viewMode]);

  // 列表视图
  if (viewMode === 'list') {
    return (
      <>
        <div
          className="media-grid-container p-2 space-y-1 flex-1 overflow-auto"
          onContextMenu={e => handleContextMenu(e, null)}
        >
          {mediaList.map(media => (
            <div
              key={media.id}
              className={`
                flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all duration-200
                ${
                  selectedIds.has(media.id)
                    ? 'bg-[#005FB8]/20 border border-[#005FB8] shadow-sm'
                    : 'hover:bg-white/5 border border-transparent'
                }
              `}
              onClick={e => handleMediaClick(e, media)}
              onContextMenu={e => handleContextMenu(e, media)}
            >
              {/* 缩略图 */}
              <div className="w-14 h-10 bg-gray-800 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden shadow-sm">
                {media.thumbnail ? (
                  <img
                    src={getMediaUrl(media.thumbnail)}
                    alt={media.filename}
                    className="w-full h-full object-cover"
                  />
                ) : media.type === 'image' ? (
                  <img
                    src={getMediaUrl(media.path)}
                    alt={media.filename}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-base">🎬</span>
                )}
              </div>

              {/* 信息 */}
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate text-gray-100 font-medium" title={media.filename}>
                  {media.filename}
                </p>
                <p className="text-xs text-gray-400">
                  {formatSize(media.size)}
                  {media.width && media.height && (
                    <span className="ml-2">
                      {media.width}×{media.height}
                    </span>
                  )}
                </p>
              </div>

              {/* 选中指示 */}
              {selectedIds.has(media.id) && (
                <div className="w-1.5 h-1.5 bg-[#005FB8] rounded-full"></div>
              )}
            </div>
          ))}

          {mediaList.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <p className="text-3xl mb-3 opacity-50">📂</p>
              <p className="text-sm">暂无媒体文件</p>
              <p className="text-xs mt-1 opacity-60">右键点击空白处添加文件或文件夹</p>
            </div>
          )}
        </div>

        {/* 右键菜单 */}
        {contextMenu.visible && contextMenu.media && (
          <div
            ref={menuRef}
            className="fixed bg-[#252525]/95 backdrop-blur-md border border-[#4A4A4A] rounded-lg shadow-2xl py-1 z-50 min-w-[188px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => handleMenuAction('open')}
              className="w-full text-left px-3.5 py-2 text-sm text-gray-200 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
            >
              <OpenFolderIcon />
              打开所在目录
            </button>
            <button
              onClick={() => handleMenuAction('addToPlaylist')}
              className="w-full text-left px-3.5 py-2 text-sm text-gray-200 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
            >
              <PlaylistIcon />
              添加到播放列表
            </button>
            <button
              onClick={() => handleMenuAction('tags')}
              className="w-full text-left px-3.5 py-2 text-sm text-gray-200 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
            >
              <TagIcon />
              编辑标签
            </button>
            {onRemoveFromPlaylist && (
              <button
                onClick={() => handleMenuAction('remove')}
                className="w-full text-left px-3.5 py-2 text-sm text-gray-200 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
              >
                <RemoveIcon />
                移出播放列表
              </button>
            )}
            <div className="border-t border-[#3D3D3D] my-1"></div>
            <button
              onClick={() => handleMenuAction('delete')}
              className="w-full text-left px-3.5 py-2 text-sm text-gray-200 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
            >
              <DeleteIcon />
              删除
            </button>
          </div>
        )}

        {/* 添加到播放列表对话框 */}
        {showPlaylistDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#2D2D2D] rounded-lg p-6 w-96 border border-[#3D3D3D]">
              <h3 className="text-[#e0e0e0] font-semibold mb-4">添加到播放列表</h3>

              {playlists.length > 0 && (
                <div className="mb-4">
                  <label className="text-gray-400 text-xs mb-2 block">选择播放列表</label>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {playlists.map(playlist => (
                      <button
                        key={playlist.id}
                        onClick={() => {
                          setSelectedPlaylistId(playlist.id);
                          setNewPlaylistName('');
                        }}
                        className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                          selectedPlaylistId === playlist.id
                            ? 'bg-[#005FB8] text-white'
                            : 'text-gray-300 hover:bg-[#e0e0e0]/5'
                        }`}
                      >
                        {playlist.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-4">
                <label className="text-gray-400 text-xs mb-2 block">或创建新播放列表</label>
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={e => {
                    setNewPlaylistName(e.target.value);
                    setSelectedPlaylistId(null);
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleConfirmAddToPlaylist();
                    if (e.key === 'Escape') setShowPlaylistDialog(false);
                  }}
                  placeholder="输入新播放列表名称"
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#3D3D3D] rounded text-[#e0e0e0] placeholder-gray-500 focus:outline-none focus:border-[#005FB8]"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowPlaylistDialog(false);
                    setNewPlaylistName('');
                    setSelectedPlaylistId(null);
                    setMediaToAdd([]);
                  }}
                  className="px-4 py-2 text-gray-400 hover:text-[#e0e0e0] transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmAddToPlaylist}
                  disabled={!selectedPlaylistId && !newPlaylistName.trim()}
                  className="px-4 py-2 bg-[#005FB8] text-white rounded hover:bg-[#004a91] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  添加
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        className="media-grid-container flex-1 overflow-hidden relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onContextMenu={e => handleContextMenu(e, null)}
      >
        {/* 操作提示 */}
        {showTooltip && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-[#1a1a1a]/70 text-[#e0e0e0] text-xs px-3 py-1.5 rounded-full backdrop-blur-sm z-10 pointer-events-none transition-opacity duration-300">
            💡 Ctrl + 滚轮缩放图标
          </div>
        )}

        <VirtualMediaGrid
          mediaList={mediaList}
          selectedIds={selectedIds}
          onPlay={onPlay}
          onContextMenu={handleContextMenu}
          iconSize={iconSize}
        />
      </div>

      {/* 右键菜单 - 网格视图 */}
      {contextMenu.visible && contextMenu.media && (
        <div
          ref={menuRef}
          className="fixed bg-[#252525]/95 backdrop-blur-md border border-[#4A4A4A] rounded-lg shadow-2xl py-1 z-50 min-w-[188px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={() => handleMenuAction('open')}
            className="w-full text-left px-3.5 py-2 text-sm text-gray-200 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
          >
            <OpenFolderIcon />
            打开所在目录
          </button>
          <button
            onClick={() => handleMenuAction('addToPlaylist')}
            className="w-full text-left px-3.5 py-2 text-sm text-gray-200 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
          >
            <PlaylistIcon />
            添加到播放列表
          </button>
          <button
            onClick={() => handleMenuAction('tags')}
            className="w-full text-left px-3.5 py-2 text-sm text-gray-200 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
          >
            <TagIcon />
            编辑标签
          </button>
          {onRemoveFromPlaylist && (
            <button
              onClick={() => handleMenuAction('remove')}
              className="w-full text-left px-3.5 py-2 text-sm text-gray-200 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
            >
              <RemoveIcon />
              移出播放列表
            </button>
          )}
          <div className="border-t border-[#3D3D3D] my-1"></div>
          <button
            onClick={() => handleMenuAction('delete')}
            className="w-full text-left px-3.5 py-2 text-sm text-gray-200 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
          >
            <DeleteIcon />
            删除
          </button>
        </div>
      )}

      {/* 添加到播放列表对话框 - 网格视图 */}
      {showPlaylistDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#2D2D2D] rounded-lg p-6 w-96 border border-[#3D3D3D]">
            <h3 className="text-[#e0e0e0] font-semibold mb-4">添加到播放列表</h3>

            {playlists.length > 0 && (
              <div className="mb-4">
                <label className="text-gray-400 text-xs mb-2 block">选择播放列表</label>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {playlists.map(playlist => (
                    <button
                      key={playlist.id}
                      onClick={() => {
                        setSelectedPlaylistId(playlist.id);
                        setNewPlaylistName('');
                      }}
                      className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                        selectedPlaylistId === playlist.id
                          ? 'bg-[#005FB8] text-white'
                          : 'text-gray-300 hover:bg-[#e0e0e0]/5'
                      }`}
                    >
                      {playlist.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="text-gray-400 text-xs mb-2 block">或创建新播放列表</label>
              <input
                type="text"
                value={newPlaylistName}
                onChange={e => {
                  setNewPlaylistName(e.target.value);
                  setSelectedPlaylistId(null);
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleConfirmAddToPlaylist();
                  if (e.key === 'Escape') setShowPlaylistDialog(false);
                }}
                placeholder="输入新播放列表名称"
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#3D3D3D] rounded text-[#e0e0e0] placeholder-gray-500 focus:outline-none focus:border-[#005FB8]"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowPlaylistDialog(false);
                  setNewPlaylistName('');
                  setSelectedPlaylistId(null);
                  setMediaToAdd([]);
                }}
                className="px-4 py-2 text-gray-400 hover:text-[#e0e0e0] transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmAddToPlaylist}
                disabled={!selectedPlaylistId && !newPlaylistName.trim()}
                className="px-4 py-2 bg-[#005FB8] text-white rounded hover:bg-[#004a91] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
