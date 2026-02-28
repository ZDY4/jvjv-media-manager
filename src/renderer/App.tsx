import { useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { PlayerArea } from './components/PlayerArea';
import { TitleBar } from './components/TitleBar';
import { ScanProgressOverlay } from './components/ScanProgressOverlay';
import { Settings } from './components/Settings';
import { VideoTrimmer } from './components/VideoTrimmer';
import { TagEditor } from './components/TagEditor';
import { Toast } from './components/Toast';
import { VideoPlayerRef } from './components/VideoPlayer';

import { useAppStore } from './store/useAppStore';
import { useMediaStore } from './store/useMediaStore';
import { useAppInit } from './hooks/useAppInit';
import { useMediaActions } from './hooks/useMediaActions';
import { usePlayerActions } from './hooks/usePlayerActions';
import { useKeyboard } from './hooks/useKeyboard';

function App() {
  // Initialization
  useAppInit();

  // Stores
  const {
    showSettings,
    showTrimmer,
    tagEditorOpen,
    editingMedias,
    watchedFolders,
    setWatchedFolders,
    setShowSettings,
    setShowTrimmer,
    setTagEditorOpen,
    apiReady,
  } = useAppStore();

  const { selectedMediaIds, lastSelectedId, filteredMediaList } = useMediaStore();

  // Actions
  const { handleAddFolder, handleDeleteMedia, handleSaveTags, loadMedia } = useMediaActions();

  const { handleNextMedia, handlePreviousMedia } = usePlayerActions();

  // Refs
  const playerRef = useRef<VideoPlayerRef>(null);

  // 获取当前选中的媒体类型
  const selectedMedia = lastSelectedId
    ? filteredMediaList.find(m => m.id === lastSelectedId) || null
    : null;

  // Global Keyboard Shortcuts
  useKeyboard({
    onScanFolder: handleAddFolder,
    onPlayPause: () => {
      // 只有视频时才可以播放/暂停
      if (selectedMedia?.type === 'video') {
        playerRef.current?.togglePlayPause();
      }
    },
    onSeekBackward: () => {
      if (selectedMedia?.type === 'video') {
        playerRef.current?.seek(-5);
      }
    },
    onSeekForward: () => {
      if (selectedMedia?.type === 'video') {
        playerRef.current?.seek(5);
      }
    },
    onDelete: () => {
      if (selectedMediaIds.size > 0) {
        handleDeleteMedia(Array.from(selectedMediaIds));
      } else if (lastSelectedId) {
        handleDeleteMedia([lastSelectedId]);
      }
    },
    onPrevious: handlePreviousMedia,
    onNext: handleNextMedia,
    onEscape: () => {
      if (showTrimmer) {
        setShowTrimmer(false);
      } else if (showSettings) {
        setShowSettings(false);
      }
    },
    // Note: onFocusSearch is handled in Sidebar.tsx
  });

  if (!apiReady) {
    return (
      <div className="flex h-screen bg-[#202020] items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#005FB8] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#e0e0e0] text-lg mb-2">正在初始化...</p>
          <p className="text-gray-400 text-sm">等待 Electron API 加载</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toast />
      <div className="flex flex-col h-screen bg-[#202020] overflow-hidden">
        <TitleBar />

        <div className="flex-1 relative overflow-hidden">
          <ScanProgressOverlay />

          <Sidebar />

          <PlayerArea ref={playerRef} />

          {/* Modals */}
          <Settings
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            onDataDirChanged={loadMedia}
            watchedFolders={watchedFolders}
            onWatchedFoldersChange={setWatchedFolders}
          />

          {showTrimmer && selectedMedia && (
            <VideoTrimmer
              media={selectedMedia}
              onClose={() => setShowTrimmer(false)}
              onComplete={loadMedia}
            />
          )}

          <TagEditor
            isOpen={tagEditorOpen}
            onClose={() => setTagEditorOpen(false)}
            tags={editingMedias[0]?.tags || []}
            onSave={handleSaveTags}
            mediaName={
              editingMedias.length === 1
                ? (editingMedias[0]?.filename ?? '')
                : `已选择 ${editingMedias.length} 个文件`
            }
          />
        </div>
      </div>
    </>
  );
}

export default App;
