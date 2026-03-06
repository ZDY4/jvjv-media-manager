import { useRef, useEffect } from 'react';
import { Spinner, Text, makeStyles, tokens } from '@fluentui/react-components';
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
  const styles = useStyles();

  // Initialization
  useAppInit();

  // 从 Data 目录加载密码
  useEffect(() => {
    const loadPassword = async () => {
      if (!window.electronAPI) return;
      try {
        const password = await window.electronAPI.getLockPassword();
        if (password) {
          setLockPassword(password);
        }
      } catch (error) {
        console.error('加载密码失败:', error);
      }
    };
    loadPassword();
  }, []);

  // Stores
  const {
    showSettings,
    showTrimmer,
    tagEditorOpen,
    editingMedias,
    watchedFolders,
    unlockedFolders,
    lockPassword,
    setWatchedFolders,
    setShowSettings,
    setShowTrimmer,
    setTagEditorOpen,
    setLockPassword,
    unlockFolder,
    apiReady,
  } = useAppStore();

  const { selectedMediaIds, lastSelectedId, filteredMediaList } = useMediaStore();

  // Actions
  const { handleAddFolder, handleDeleteMedia, handleSaveTags, loadMedia } = useMediaActions();

  const { handleNextMedia, handlePreviousMedia } = usePlayerActions();

  // 解锁文件夹后自动刷新媒体库
  const handleUnlockFolder = (path: string) => {
    unlockFolder(path);
    loadMedia(); // 自动刷新
  };

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
      <div className={styles.loadingRoot}>
        <div className={styles.loadingContent}>
          <Spinner size="large" />
          <Text size={400}>正在初始化...</Text>
          <Text size={200} className={styles.loadingSubText}>
            等待 Electron API 加载
          </Text>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toast />
      <div className={styles.appShell}>
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
            unlockedFolders={unlockedFolders}
            onUnlockFolder={handleUnlockFolder}
            lockPassword={lockPassword}
            onSetLockPassword={setLockPassword}
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

const useStyles = makeStyles({
  loadingRoot: {
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colorNeutralBackground1,
  },
  loadingContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    rowGap: tokens.spacingVerticalS,
  },
  loadingSubText: {
    color: tokens.colorNeutralForeground3,
  },
  appShell: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
});
