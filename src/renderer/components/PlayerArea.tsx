import React, { useState, useEffect, forwardRef } from 'react';
import { MediaPlayer, MediaPlayerRef } from './MediaPlayer';
import { useAppStore } from '../store/useAppStore';
import { useMediaStore } from '../store/useMediaStore';
import { usePlayerActions } from '../hooks/usePlayerActions';
import { useMediaActions } from '../hooks/useMediaActions';

type PlayerAreaProps = object;

export const PlayerArea = forwardRef<MediaPlayerRef, PlayerAreaProps>((_props, ref) => {
  const {
    sidebarPinned,
    sidebarWidth,
    isSidebarDetached,
    playMode,
    setTagEditorOpen,
    setEditingMedias,
    setShowTrimmer
  } = useAppStore();

  const {
    lastSelectedId,
    filteredMediaList
  } = useMediaStore();

  const {
    handleNextMedia,
    handlePreviousMedia,
    togglePlayMode
  } = usePlayerActions();

  const {
    handleOpenMediaFolder,
    handleDeleteMedia
  } = useMediaActions();

  const selectedMedia = lastSelectedId
    ? filteredMediaList.find(m => m.id === lastSelectedId) || null
    : null;

  // Local state for context menu
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
  }>({
    visible: false,
    x: 0,
    y: 0,
  });

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!selectedMedia) return;
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const closeContextMenu = () => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

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

  const onEditTags = () => {
    if (selectedMedia) {
      setEditingMedias([selectedMedia]);
      setTagEditorOpen(true);
    }
  };

  return (
    <div
      style={{ left: !isSidebarDetached && sidebarPinned ? sidebarWidth : 0 }}
      className={`absolute top-0 right-0 bottom-0 flex flex-col bg-[#202020] transition-all duration-300`}
    >
      {selectedMedia ? (
        <>
          {/* Title and Tags Overlay */}
          <div className="absolute top-0 left-0 right-0 z-20 p-3 bg-gradient-to-b from-[#1a1a1a]/70 to-transparent pointer-events-none">
            <div className="flex items-center gap-3 justify-center">
              <h2
                className="text-[#e0e0e0] text-sm font-medium truncate max-w-[50%] pointer-events-auto"
                title={selectedMedia.filename}
              >
                {selectedMedia.filename}
              </h2>
              {selectedMedia.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedMedia.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-[#005FB8]/60 backdrop-blur-sm text-[#e0e0e0] text-xs rounded-md pointer-events-auto"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <MediaPlayer
              media={selectedMedia}
              ref={ref}
              onEnded={handleNextMedia}
              onPrevious={handlePreviousMedia}
              onNext={handleNextMedia}
              onEditTags={onEditTags}
              onTrimVideo={
                selectedMedia.type === 'video' ? () => setShowTrimmer(true) : undefined
              }
              playMode={playMode}
              onTogglePlayMode={togglePlayMode}
              onContextMenu={handleContextMenu}
            />
          </div>

          {/* Context Menu */}
          {contextMenu.visible && selectedMedia && (
            <div
              className="fixed bg-[#2D2D2D] border border-[#3D3D3D] rounded-lg shadow-xl py-1 z-50 min-w-[160px]"
              style={{ left: contextMenu.x, top: contextMenu.y }}
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  handleOpenMediaFolder(selectedMedia);
                  closeContextMenu();
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-[#e0e0e0] hover:bg-[#e0e0e0]/5 transition-colors flex items-center gap-2"
              >
                📂 打开所在目录
              </button>
              <button
                onClick={() => {
                  onEditTags();
                  closeContextMenu();
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-[#e0e0e0] hover:bg-[#e0e0e0]/5 transition-colors flex items-center gap-2"
              >
                🏷️ 编辑标签
              </button>
              {selectedMedia.type === 'video' && (
                <button
                  onClick={() => {
                    setShowTrimmer(true);
                    closeContextMenu();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-green-400 hover:text-green-300 hover:bg-green-500/10 transition-colors flex items-center gap-2"
                >
                  ✂️ 剪辑视频
                </button>
              )}
              <div className="border-t border-[#3D3D3D] my-1"></div>
              <button
                onClick={() => {
                  handleDeleteMedia([selectedMedia.id]);
                  closeContextMenu();
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors flex items-center gap-2"
              >
                🗑️ 删除
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <div className="w-20 h-20 bg-[#2D2D2D] rounded-2xl flex items-center justify-center mb-4 mx-auto shadow-lg">
              <span className="text-4xl">▶️</span>
            </div>
            <p className="text-gray-300 text-lg mb-2">选择一个媒体文件开始播放</p>
            <p className="text-sm text-gray-500">按 PageUp/PageDown 切换上一个/下一个</p>
          </div>
        </div>
      )}
    </div>
  );
});

PlayerArea.displayName = 'PlayerArea';
