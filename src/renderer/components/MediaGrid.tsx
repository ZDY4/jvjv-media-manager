import React from 'react';
import { MediaFile } from '../../shared/types';

interface MediaGridProps {
  mediaList: MediaFile[];
  selectedId?: string | null;
  onPlay: (media: MediaFile) => void;
  onDelete: (mediaId: string) => void;
}

export const MediaGrid: React.FC<MediaGridProps> = ({ mediaList, selectedId, onPlay, onDelete }) => {
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleContextMenu = (e: React.MouseEvent, media: MediaFile) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`删除 "${media.filename}"?`)) {
      onDelete(media.id);
    }
  };

  return (
    <div className="p-2 space-y-1">
      {mediaList.map((media) => (
        <div
          key={media.id}
          className={`
            flex items-center gap-3 p-2 rounded cursor-pointer transition
            ${selectedId === media.id 
              ? 'bg-blue-600/30 border border-blue-500' 
              : 'bg-gray-800 hover:bg-gray-700 border border-transparent'}
          `}
          onClick={() => onPlay(media)}
          onContextMenu={(e) => handleContextMenu(e, media)}
        >
          {/* 缩略图 */}
          <div className="w-16 h-10 bg-gray-900 rounded flex-shrink-0 flex items-center justify-center">
            <span className="text-lg">
              {media.type === 'video' ? '🎬' : '🖼️'}
            </span>
          </div>
          
          {/* 信息 */}
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate text-white" title={media.filename}>
              {media.filename}
            </p>
            <p className="text-xs text-gray-400">
              {formatSize(media.size)}
              {media.duration && ` · ${formatDuration(media.duration)}`}
            </p>
          </div>
          
          {/* 选中指示 */}
          {selectedId === media.id && (
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          )}
        </div>
      ))}
      
      {mediaList.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <p className="text-2xl mb-2">📂</p>
          <p>暂无媒体文件</p>
          <p className="text-xs mt-1">点击左侧"扫描文件夹"添加媒体</p>
        </div>
      )}
    </div>
  );
};
