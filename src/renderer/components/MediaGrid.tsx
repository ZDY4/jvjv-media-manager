import React from 'react';
import { MediaFile } from '../../shared/types';

interface MediaGridProps {
  mediaList: MediaFile[];
  onPlay: (media: MediaFile) => void;
  onDelete: (mediaId: string) => void;
}

export const MediaGrid: React.FC<MediaGridProps> = ({ mediaList, onPlay, onDelete }) => {
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
    if (confirm(`删除 "${media.filename}"?`)) {
      onDelete(media.id);
    }
  };

  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {mediaList.map((media) => (
          <div
            key={media.id}
            className="bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:bg-gray-700 transition group"
            onClick={() => onPlay(media)}
            onContextMenu={(e) => handleContextMenu(e, media)}
          >
            <div className="aspect-video bg-gray-900 relative">
              {media.thumbnail ? (
                <img 
                  src={media.thumbnail} 
                  alt={media.filename}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-4xl">
                    {media.type === 'video' ? '🎬' : '🖼️'}
                  </span>
                </div>
              )}
              {media.type === 'video' && media.duration && (
                <div className="absolute bottom-1 right-1 bg-black/70 px-1.5 py-0.5 rounded text-xs">
                  {formatDuration(media.duration)}
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <span className="text-4xl">▶️</span>
              </div>
            </div>
            
            <div className="p-2">
              <p className="text-sm truncate text-white" title={media.filename}>
                {media.filename}
              </p>
              <p className="text-xs text-gray-400">
                {formatSize(media.size)}
              </p>
              {media.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {media.tags.map(tag => (
                    <span key={tag} className="text-xs bg-blue-600/50 px-1.5 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {mediaList.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <p className="text-xl mb-2">📂</p>
          <p>暂无媒体文件</p>
          <p className="text-sm mt-1">点击左侧"扫描文件夹"添加媒体</p>
        </div>
      )}
    </div>
  );
};
