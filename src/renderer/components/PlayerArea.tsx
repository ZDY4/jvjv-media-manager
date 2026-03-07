import React, { useState, useEffect, forwardRef } from 'react';
import { VideoPlayer, VideoPlayerRef } from './VideoPlayer';
import { ImageViewer } from './ImageViewer';
import { useAppStore } from '../store/useAppStore';
import { useMediaStore } from '../store/useMediaStore';
import { usePlayerActions } from '../hooks/usePlayerActions';
import { useMediaActions } from '../hooks/useMediaActions';

type PlayerAreaProps = object;

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

const TrimIcon: React.FC = () => (
  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M6 5l12 14M6 19L18 5M4 9h4M16 15h4" />
  </svg>
);

const DeleteIcon: React.FC = () => (
  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M4 7h16m-3 0v12a2 2 0 01-2 2H9a2 2 0 01-2-2V7m3-3h4m-5 8l1 6m4-6l-1 6" />
  </svg>
);

export const PlayerArea = forwardRef<VideoPlayerRef, PlayerAreaProps>((_props, ref) => {
  const {
    sidebarPinned,
    sidebarWidth,
    isSidebarDetached,
    playMode,
    setTagEditorOpen,
    setEditingMedias,
    setShowTrimmer,
  } = useAppStore();

  const { lastSelectedId, filteredMediaList } = useMediaStore();

  const {
    handleNextMedia,
    handlePreviousMedia,
    handlePreviousManual,
    handleNextManual,
    togglePlayMode,
  } = usePlayerActions();

  const { handleOpenMediaFolder, handleDeleteMedia } = useMediaActions();

  const selectedMedia = lastSelectedId
    ? filteredMediaList.find(m => m.id === lastSelectedId) || null
    : null;
  const canNavigate = !!selectedMedia && filteredMediaList.length > 1;

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
            <div className="flex items-center gap-3 justify-start">
              <h2
                className="text-[#e0e0e0] text-sm font-medium truncate max-w-[70%] pointer-events-auto"
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
            {selectedMedia.type === 'video' ? (
              <VideoPlayer
                ref={ref}
                media={selectedMedia}
                onEnded={handleNextMedia}
                onPrevious={handlePreviousMedia}
                onNext={handleNextMedia}
                playMode={playMode}
                onTogglePlayMode={togglePlayMode}
                onContextMenu={handleContextMenu}
              />
            ) : (
              <ImageViewer
                media={selectedMedia}
                onPrevious={handlePreviousMedia}
                onNext={handleNextMedia}
                onContextMenu={handleContextMenu}
              />
            )}
          </div>

          {canNavigate && (
            <>
              <div className="absolute inset-y-0 left-0 z-30 w-20">
                <div className="group h-full w-full flex items-center justify-start">
                  <button
                    type="button"
                    onClick={handlePreviousManual}
                    className="ml-3 w-10 h-10 rounded-full bg-black/40 text-white border border-white/10 backdrop-blur-sm opacity-0 group-hover:opacity-100 hover:bg-black/60 transition-all duration-150 flex items-center justify-center"
                    aria-label="上一个"
                    title="上一个"
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
                </div>
              </div>

              <div className="absolute inset-y-0 right-0 z-30 w-20">
                <div className="group h-full w-full flex items-center justify-end">
                  <button
                    type="button"
                    onClick={handleNextManual}
                    className="mr-3 w-10 h-10 rounded-full bg-black/40 text-white border border-white/10 backdrop-blur-sm opacity-0 group-hover:opacity-100 hover:bg-black/60 transition-all duration-150 flex items-center justify-center"
                    aria-label="下一个"
                    title="下一个"
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
            </>
          )}

          {/* Context Menu */}
          {contextMenu.visible && selectedMedia && (
            <div
              className="fixed bg-[#252525]/95 backdrop-blur-md border border-[#4A4A4A] rounded-lg shadow-2xl py-1 z-50 min-w-[188px]"
              style={{ left: contextMenu.x, top: contextMenu.y }}
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  handleOpenMediaFolder(selectedMedia);
                  closeContextMenu();
                }}
                className="w-full text-left px-3.5 py-2 text-sm text-gray-200 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
              >
                <OpenFolderIcon />
                打开所在目录
              </button>
              <button
                onClick={() => {
                  onEditTags();
                  closeContextMenu();
                }}
                className="w-full text-left px-3.5 py-2 text-sm text-gray-200 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
              >
                <TagIcon />
                编辑标签
              </button>
              {selectedMedia.type === 'video' && (
                <button
                  onClick={() => {
                    setShowTrimmer(true);
                    closeContextMenu();
                  }}
                  className="w-full text-left px-3.5 py-2 text-sm text-gray-200 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                >
                  <TrimIcon />
                  剪辑视频
                </button>
              )}
              <div className="border-t border-[#3D3D3D] my-1"></div>
              <button
                onClick={() => {
                  handleDeleteMedia([selectedMedia.id]);
                  closeContextMenu();
                }}
                className="w-full text-left px-3.5 py-2 text-sm text-gray-200 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
              >
                <DeleteIcon />
                删除
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
