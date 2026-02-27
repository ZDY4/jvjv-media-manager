import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useMediaStore } from '../store/useMediaStore';
import { useMediaActions } from './useMediaActions';

export const useAppInit = () => {
  const {
    apiReady,
    setApiReady,
    watchedFolders,
    setScanProgress,
    setShowSettings,
    setIsSidebarDetached,
    setSidebarVisible,
    isSidebarDetached
  } = useAppStore();

  const {
    filteredMediaList,
    lastSelectedId,
    setLastSelectedId,
    setSelectedMediaIds
  } = useMediaStore();

  const {
    loadMedia,
    handleAddFiles,
    handleAddFolder,
    handleRefreshFolders
  } = useMediaActions();

  // API Check
  useEffect(() => {
    const checkApi = () => {
      if (window.electronAPI) {
        console.log('[App] Electron API 已加载');
        setApiReady(true);
        loadMedia();
        return true;
      }
      return false;
    };

    if (checkApi()) return;

    console.log('[App] 等待 Electron API 加载...');

    let attempts = 0;
    const maxAttempts = 100;
    const interval = setInterval(() => {
      attempts++;
      if (checkApi() || attempts >= maxAttempts) {
        clearInterval(interval);
        if (attempts >= maxAttempts) {
          console.error('[App] Electron API 初始化超时，尝试次数:', attempts);
          window.showToast?.({
            message: '初始化失败: Electron API 未加载，请重启应用',
            type: 'error',
          });
        }
      }
    }, 200);

    return () => clearInterval(interval);
  }, [setApiReady, loadMedia]);

  // Initial Scan
  useEffect(() => {
    if (apiReady && watchedFolders.length > 0 && window.electronAPI) {
      const timer = setTimeout(() => {
        handleRefreshFolders().catch(console.error);
      }, 2000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [apiReady, watchedFolders.length, handleRefreshFolders]);

  // Menu Listeners
  useEffect(() => {
    if (!apiReady || !window.electronAPI) return;

    const unsubscribeMenuFiles = window.electronAPI.onMenuAddFiles(() => {
      handleAddFiles();
    });

    const unsubscribeMenuFolder = window.electronAPI.onMenuAddFolder(() => {
      handleAddFolder();
    });

    const unsubscribeMenuSettings = window.electronAPI.onMenuSettings(() => {
      setShowSettings(true);
    });

    const unsubscribeScan = window.electronAPI.onScanProgress(data => {
      if (data.status === 'scanning') {
        setScanProgress({ message: data.message, percent: data.percent });
      } else if (data.status === 'complete' || data.status === 'error') {
        setScanProgress(null);
      }
    });

    return () => {
      unsubscribeMenuFiles?.();
      unsubscribeMenuFolder?.();
      unsubscribeMenuSettings?.();
      unsubscribeScan?.();
    };
  }, [apiReady, handleAddFiles, handleAddFolder, setShowSettings, setScanProgress]);

  // Playlist Window Listeners
  useEffect(() => {
    if (!window.electronAPI?.onPlaylistWindowClosed) return;

    const unsubscribe = window.electronAPI.onPlaylistWindowClosed(() => {
      setIsSidebarDetached(false);
      setSidebarVisible(true);
    });

    return () => {
      unsubscribe();
    };
  }, [setIsSidebarDetached, setSidebarVisible]);

  // Sync Playlist Data
  useEffect(() => {
    if (!isSidebarDetached || !window.electronAPI?.syncPlaylistData) return;

    window.electronAPI.syncPlaylistData({
      mediaList: filteredMediaList,
      selectedId: lastSelectedId,
    });
  }, [filteredMediaList, lastSelectedId, isSidebarDetached]);

  // Playlist Action Listener
  useEffect(() => {
    if (!window.electronAPI?.onPlaylistAction) return;

    const unsubscribe = window.electronAPI.onPlaylistAction(action => {
      switch (action.type) {
        case 'play': {
          const mediaId = (action.payload as { mediaId: string })?.mediaId;
          if (mediaId) {
            setLastSelectedId(mediaId);
            setSelectedMediaIds(new Set([mediaId]));
          }
          break;
        }
        case 'ready': {
          if (window.electronAPI?.syncPlaylistData) {
            window.electronAPI.syncPlaylistData({
              mediaList: filteredMediaList,
              selectedId: lastSelectedId,
            });
          }
          break;
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [filteredMediaList, lastSelectedId, setLastSelectedId, setSelectedMediaIds]);
};
