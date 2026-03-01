import { useState, useRef, useCallback, useEffect } from 'react';
import type { MediaFile } from '@/shared/types';
import { getMediaUrl } from '../utils/mediaUrl';
import { useImagePreload } from '../hooks/useImagePreload';
import { useMediaStore } from '../store/useMediaStore';

export interface ImageViewerProps {
  media: MediaFile;
  onPrevious?: () => void;
  onNext?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ media, onContextMenu }) => {
  const { filteredMediaList } = useMediaStore();

  // 找到当前图片的索引
  const currentIndex = filteredMediaList.findIndex(m => m.id === media.id);

  // 获取相邻图片的路径
  const preloadPaths = [
    filteredMediaList[currentIndex - 1]?.path,
    filteredMediaList[currentIndex + 1]?.path,
  ].filter((path): path is string => !!path);

  // 预加载相邻图片
  useImagePreload(preloadPaths);

  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(prev * 1.25, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale(prev => {
      const newScale = Math.max(prev / 1.25, 0.5);
      if (newScale <= 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newScale;
    });
  }, []);

  const handleResetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        handleZoomIn();
      } else {
        handleZoomOut();
      }
    },
    [handleZoomIn, handleZoomOut]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging && scale > 1) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    },
    [isDragging, dragStart, scale]
  );

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case '+':
        case '=':
          e.preventDefault();
          handleZoomIn();
          break;
        case '-':
        case '_':
          e.preventDefault();
          handleZoomOut();
          break;
        case '0':
          e.preventDefault();
          handleResetZoom();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleZoomIn, handleZoomOut, handleResetZoom]);

  // 切换图片时重置缩放
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [media.id]);

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col bg-[#1a1a1a] min-h-0 overflow-hidden relative"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* 图片显示区域 */}
      <div
        className="flex-1 flex items-center justify-center overflow-hidden relative"
        onContextMenu={e => {
          e.preventDefault();
          onContextMenu?.(e);
        }}
      >
        <img
          ref={imageRef}
          src={getMediaUrl(media.path)}
          alt={media.filename}
          className="max-w-full max-h-full object-contain select-none"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
          }}
          draggable={false}
        />
      </div>

      {/* 底部控制栏 - 高度减半，仅保留缩放控制 */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-black/50 px-2 py-1.5">
        <div className="flex items-center justify-center gap-2">
          {/* 缩小按钮 */}
          <button
            onClick={handleZoomOut}
            className="w-6 h-6 flex items-center justify-center text-white hover:text-gray-300 transition-colors rounded hover:bg-white/10"
            title="缩小 (-)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>

          {/* 缩放百分比 */}
          <span className="text-white text-xs min-w-[50px] text-center font-mono">
            {Math.round(scale * 100)}%
          </span>

          {/* 放大按钮 */}
          <button
            onClick={handleZoomIn}
            className="w-6 h-6 flex items-center justify-center text-white hover:text-gray-300 transition-colors rounded hover:bg-white/10"
            title="放大 (+)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>

          {/* 重置缩放按钮 */}
          <button
            onClick={handleResetZoom}
            className="w-6 h-6 flex items-center justify-center text-white hover:text-gray-300 transition-colors rounded hover:bg-white/10 ml-1"
            title="重置缩放 (0)"
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
        </div>
      </div>
    </div>
  );
};
