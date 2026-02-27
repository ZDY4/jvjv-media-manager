import React, { useState, useEffect, useRef } from 'react';
import type { MediaFile } from '../../shared/types';
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
  viewMode?: 'list' | 'grid';
  iconSize?: number;
  onIconSizeChange?: (size: number) => void;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  media: MediaFile | null;
}

export const MediaGrid: React.FC<MediaGridProps> = ({
  mediaList,
  selectedIds = new Set(),
  onPlay,
  onDelete,
  onOpenFolder,
  onEditTags,
  onRemoveFromPlaylist,
  viewMode = 'list',
  iconSize = 120,
}) => {
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    media: null,
  });
  const [showTooltip, setShowTooltip] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 处理右键菜单
  const handleContextMenu = (e: React.MouseEvent, media: MediaFile) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      media,
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

  // 执行菜单操作
  const handleMenuAction = (action: 'open' | 'delete' | 'tags' | 'remove') => {
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
    }
    closeContextMenu();
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

  // 列表视图
  if (viewMode === 'list') {
    return (
      <>
        <div className="media-grid-container p-2 space-y-1">
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
              <p className="text-xs mt-1 opacity-60">点击添加文件或文件夹</p>
            </div>
          )}
        </div>

        {/* 右键菜单 */}
        {contextMenu.visible && contextMenu.media && (
          <div
            ref={menuRef}
            className="fixed bg-[#2D2D2D] border border-[#3D3D3D] rounded-lg shadow-xl py-1 z-50 min-w-[160px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => handleMenuAction('open')}
              className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-[#e0e0e0] hover:bg-[#e0e0e0]/5 transition-colors flex items-center gap-2"
            >
              📂 打开所在目录
            </button>
            <button
              onClick={() => handleMenuAction('tags')}
              className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-[#e0e0e0] hover:bg-[#e0e0e0]/5 transition-colors flex items-center gap-2"
            >
              🏷️ 编辑标签
            </button>
            {onRemoveFromPlaylist && (
              <button
                onClick={() => handleMenuAction('remove')}
                className="w-full text-left px-4 py-2 text-sm text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 transition-colors flex items-center gap-2"
              >
                📤 移出播放列表
              </button>
            )}
            <div className="border-t border-[#3D3D3D] my-1"></div>
            <button
              onClick={() => handleMenuAction('delete')}
              className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors flex items-center gap-2"
            >
              🗑️ 删除
            </button>
          </div>
        )}
      </>
    );
  }

  // 网格视图 - 使用虚拟滚动
  return (
    <>
      <div
        ref={containerRef}
        className="media-grid-container flex-1 overflow-hidden relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
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
          iconSize={iconSize}
        />
      </div>
    </>
  );
};
