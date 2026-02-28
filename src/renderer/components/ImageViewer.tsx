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

export const ImageViewer: React.FC<ImageViewerProps> = ({
  media,
  onPrevious,
  onNext,
  onContextMenu,
}) => {
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
  const [isFullscreen, setIsFullscreen] = useState(false);
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

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  // 监听全屏变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

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
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleZoomIn, handleZoomOut, handleResetZoom, toggleFullscreen]);

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

      {/* 底部控制栏 */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-black/50 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* 缩放控制 */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              className="w-8 h-8 flex items-center justify-center text-white hover:text-gray-300 transition-colors rounded hover:bg-white/10"
              title="缩小 (-)"
              aria-label="缩小"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>

            <span className="text-white text-sm min-w-[60px] text-center font-mono">
              {Math.round(scale * 100)}%
            </span>

            <button
              onClick={handleZoomIn}
              className="w-8 h-8 flex items-center justify-center text-white hover:text-gray-300 transition-colors rounded hover:bg-white/10"
              title="放大 (+)"
              aria-label="放大"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>

            <button
              onClick={handleResetZoom}
              className="w-8 h-8 flex items-center justify-center text-white hover:text-gray-300 transition-colors rounded hover:bg-white/10 ml-1"
              title="重置缩放 (0)"
              aria-label="重置缩放"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
            </button>
          </div>

          {/* 图片信息 */}
          <div className="text-gray-300 text-sm">
            {media.width && media.height && `${media.width} × ${media.height}`}
          </div>

          {/* 右侧控制 */}
          <div className="flex items-center gap-2">
            {/* 全屏按钮 */}
            <button
              onClick={toggleFullscreen}
              className="w-8 h-8 flex items-center justify-center text-white hover:text-gray-300 transition-colors rounded hover:bg-white/10"
              title={isFullscreen ? '退出全屏 (F)' : '全屏 (F)'}
              aria-label={isFullscreen ? '退出全屏' : '全屏'}
            >
              {isFullscreen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
                  />
                </svg>
              )}
            </button>

            <div className="w-px h-6 bg-white/20 mx-1" />

            {/* 导航按钮 */}
            <button
              onClick={onPrevious}
              className="w-8 h-8 flex items-center justify-center text-white hover:text-gray-300 transition-colors rounded hover:bg-white/10"
              title="上一张 (← / PageUp)"
              aria-label="上一张"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <button
              onClick={onNext}
              className="w-8 h-8 flex items-center justify-center text-white hover:text-gray-300 transition-colors rounded hover:bg-white/10"
              title="下一张 (→ / PageDown)"
              aria-label="下一张"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
