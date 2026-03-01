import React from 'react';
import { Grid, type CellComponentProps } from 'react-window';
import { AutoSizer } from 'react-virtualized-auto-sizer';
import type { MediaFile } from '../../shared/types';
import { formatSize } from '../utils/format';
import { getMediaUrl } from '../utils/mediaUrl';

interface VirtualMediaGridProps {
  mediaList: MediaFile[];
  selectedIds?: Set<string>;
  onPlay: (media: MediaFile, isCtrlClick: boolean, isShiftClick: boolean) => void;
  onContextMenu?: (e: React.MouseEvent, media: MediaFile) => void;
  iconSize?: number;
}

interface VirtualMediaGridCellProps {
  columnCount: number;
  mediaList: MediaFile[];
  selectedIds: Set<string>;
  onPlay: (media: MediaFile, isCtrlClick: boolean, isShiftClick: boolean) => void;
  onContextMenu?: (e: React.MouseEvent, media: MediaFile) => void;
}

const ITEM_GAP = 8;

const Cell = ({
  ariaAttributes,
  columnIndex,
  rowIndex,
  style,
  columnCount,
  mediaList,
  selectedIds,
  onPlay,
  onContextMenu,
}: CellComponentProps<VirtualMediaGridCellProps>) => {
  const index = rowIndex * columnCount + columnIndex;
  const media = mediaList[index];

  if (!media) {
    return null;
  }

  const isSelected = selectedIds.has(media.id);

  return (
    <div style={style} className="p-1" {...ariaAttributes}>
      <div
        className={`
          relative group cursor-pointer rounded-lg overflow-hidden h-full w-full
          transition-all duration-200 hover:scale-[1.02]
          ${isSelected ? 'ring-2 ring-[#005FB8]' : ''}
        `}
        onClick={e => onPlay(media, e.ctrlKey || e.metaKey, e.shiftKey)}
        onContextMenu={e => onContextMenu?.(e, media)}
      >
        {/* 缩略图 */}
        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
          {media.thumbnail ? (
            <img
              src={getMediaUrl(media.thumbnail)}
              alt={media.filename}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : media.type === 'image' ? (
            <img
              src={getMediaUrl(media.path)}
              alt={media.filename}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-500">
              <span className="text-4xl mb-2">🎬</span>
              <span className="text-xs">视频</span>
            </div>
          )}
        </div>

        {/* 悬停遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a]/80 via-[#1a1a1a]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="absolute bottom-0 left-0 right-0 p-2">
            <p className="text-xs text-[#e0e0e0] truncate font-medium" title={media.filename}>
              {media.filename}
            </p>
            <p className="text-[10px] text-gray-300">
              {formatSize(media.size)}
              {media.width && media.height && (
                <span className="ml-1">
                  {media.width}×{media.height}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* 选中指示 */}
        {isSelected && (
          <div className="absolute top-1 right-1 w-2 h-2 bg-[#005FB8] rounded-full"></div>
        )}
      </div>
    </div>
  );
};

export const VirtualMediaGrid: React.FC<VirtualMediaGridProps> = ({
  mediaList,
  selectedIds = new Set(),
  onPlay,
  onContextMenu,
  iconSize = 120,
}) => {
  // 单个格子的实际大小 = 图标大小 + 间隙
  const itemSize = iconSize + ITEM_GAP;

  if (mediaList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500 h-full">
        <p className="text-3xl mb-3 opacity-50">📂</p>
        <p className="text-sm">暂无媒体文件</p>
        <p className="text-xs mt-1 opacity-60">点击添加文件或文件夹</p>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full w-full overflow-hidden">
      <AutoSizer
        renderProp={({ height, width }) => {
          if (height == null || width == null) {
            return null;
          }

          // 计算列数
          const columnCount = Math.floor(width / itemSize) || 1;
          // 计算行数
          const rowCount = Math.ceil(mediaList.length / columnCount);
          // 实际单元格大小（平分剩余空间）
          // const actualItemWidth = width / columnCount;
          // 保持固定大小更符合 Windows 资源管理器习惯，但为了填满屏幕，我们可以居中或微调
          // 这里简单起见，使用固定大小，让 react-window 处理滚动

          return (
            <Grid
              className="virtual-grid"
              style={{ height, width }}
              cellComponent={Cell}
              cellProps={{
                columnCount,
                mediaList,
                selectedIds,
                onPlay,
                onContextMenu,
              }}
              columnCount={columnCount}
              columnWidth={itemSize}
              rowCount={rowCount}
              rowHeight={itemSize}
            />
          );
        }}
      />
    </div>
  );
};
