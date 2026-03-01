import { useCallback, useEffect } from 'react';
import { useMediaStore } from '../store/useMediaStore';
import { useAppStore } from '../store/useAppStore';
import { MediaFile } from '@/shared/types';
import {
  canAddWatchedFolder,
  addWatchedFolder,
  isMediaFromUnlockedFolder,
} from '../utils/folderUtils';

export const useMediaActions = () => {
  const {
    setMediaList,
    addMediaFiles,
    selectedMediaIds,
    lastSelectedId,
    filteredMediaList,
    setSelectedMediaIds,
    setLastSelectedId,
    setIsLoading,
  } = useMediaStore();

  const { setScanProgress, setWatchedFolders, watchedFolders } = useAppStore();

  // 监听增量扫描批次
  useEffect(() => {
    if (!window.electronAPI?.onScanBatch) return;

    const unsubscribe = window.electronAPI.onScanBatch(data => {
      if (data.files.length > 0) {
        // 过滤被锁的文件夹
        const { watchedFolders, unlockedFolders } = useAppStore.getState();
        const filteredFiles = data.files.filter(f =>
          isMediaFromUnlockedFolder(f.path, watchedFolders, unlockedFolders)
        );

        if (filteredFiles.length > 0) {
          addMediaFiles(filteredFiles);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [addMediaFiles]);

  const loadMedia = useCallback(async () => {
    if (!window.electronAPI) return;
    setIsLoading(true);
    try {
      const media = await window.electronAPI.getAllMedia();

      // 获取当前状态用于过滤
      const { watchedFolders, unlockedFolders } = useAppStore.getState();

      // 过滤掉来自加锁且未解锁文件夹的媒体
      const filteredMedia = media.filter(m =>
        isMediaFromUnlockedFolder(m.path, watchedFolders, unlockedFolders)
      );

      setMediaList(filteredMedia);
    } catch (error) {
      console.error('加载媒体失败:', error);
      window.showToast?.({ message: '加载媒体失败', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [setMediaList, setIsLoading]);

  const handleAddFiles = useCallback(async () => {
    if (!window.electronAPI) {
      window.showToast?.({ message: '错误: Electron API 未初始化，请重启应用', type: 'error' });
      return;
    }
    try {
      const newMedia = await window.electronAPI.addMediaFiles();
      if (newMedia && newMedia.length > 0) {
        window.showToast?.({ message: `已添加 ${newMedia.length} 个文件`, type: 'success' });
        loadMedia();
      }
    } catch (error) {
      console.error('添加文件失败:', error);
      window.showToast?.({ message: '添加文件失败: ' + (error as Error).message, type: 'error' });
    }
  }, [loadMedia]);

  const handleAddFolder = useCallback(async () => {
    if (!window.electronAPI) {
      window.showToast?.({ message: '错误: Electron API 未初始化，请重启应用', type: 'error' });
      return;
    }
    setScanProgress({ message: '正在扫描文件夹...', percent: 0 });
    try {
      const newMedia = await window.electronAPI.addMediaFolder();
      setScanProgress(null);
      if (newMedia && newMedia.length > 0) {
        // Extract folder paths from added media
        const addedFolderPaths = new Set<string>();
        for (const media of newMedia) {
          const folderPath = media.path.substring(
            0,
            media.path.lastIndexOf('/') !== -1
              ? media.path.lastIndexOf('/')
              : media.path.lastIndexOf('\\')
          );
          if (folderPath) {
            addedFolderPaths.add(folderPath);
          }
        }

        // Check for duplicates and add folders with deduplication
        let updatedFolders = [...watchedFolders];
        for (const folderPath of addedFolderPaths) {
          const check = canAddWatchedFolder(folderPath, updatedFolders);
          if (!check.canAdd) {
            window.showToast?.({ message: check.reason || '无法添加文件夹', type: 'info' });
            continue;
          }
          updatedFolders = addWatchedFolder(folderPath, updatedFolders);
        }

        setWatchedFolders(updatedFolders);
        window.showToast?.({ message: `已添加 ${newMedia.length} 个文件`, type: 'success' });
        // 增量加载模式下，不需要重新加载全部，数据已经通过 onScanBatch 添加
        // 但为了确保数据一致性，我们还是重新加载一次
        loadMedia();
      } else {
        window.showToast?.({ message: '未找到媒体文件', type: 'info' });
      }
    } catch (error) {
      setScanProgress(null);
      console.error('添加文件夹失败:', error);
      window.showToast?.({ message: '添加文件夹失败: ' + (error as Error).message, type: 'error' });
    }
  }, [loadMedia, watchedFolders, setWatchedFolders, setScanProgress]);

  const handleRefreshFolders = useCallback(async () => {
    if (!window.electronAPI || watchedFolders.length === 0) {
      window.showToast?.({ message: '没有监控的文件夹', type: 'info' });
      return;
    }
    setScanProgress({ message: '正在刷新文件夹...', percent: 0 });
    try {
      // Extract folder paths from WatchedFolder objects
      const folderPaths = watchedFolders.map(f => f.path);
      await window.electronAPI.rescanFolders(folderPaths);
      setScanProgress(null);
      // 增量加载模式下，数据已经通过 onScanBatch 添加
      // 但为了确保数据一致性，我们还是重新加载一次
      loadMedia();
      window.showToast?.({ message: '文件夹刷新完成', type: 'success' });
    } catch (error) {
      setScanProgress(null);
      console.error('刷新文件夹失败:', error);
      window.showToast?.({ message: '刷新文件夹失败: ' + (error as Error).message, type: 'error' });
    }
  }, [watchedFolders, loadMedia, setScanProgress]);

  const handleDeleteMedia = useCallback(
    async (mediaIds: string[]) => {
      if (!window.electronAPI || mediaIds.length === 0) return;

      const confirmMsg =
        mediaIds.length === 1
          ? '确定要删除选中的媒体文件吗？'
          : `确定要删除选中的 ${mediaIds.length} 个媒体文件吗？`;

      if (!confirm(confirmMsg)) return;

      try {
        let successCount = 0;
        let failCount = 0;

        for (const mediaId of mediaIds) {
          try {
            const result = await window.electronAPI.deleteMedia(mediaId);
            if (result.success) {
              successCount++;
            } else {
              failCount++;
            }
          } catch {
            failCount++;
          }
        }

        loadMedia();

        // Clear selection logic
        const newSet = new Set(selectedMediaIds);
        mediaIds.forEach(id => newSet.delete(id));
        setSelectedMediaIds(newSet);

        // If current playing media is deleted
        if (lastSelectedId && mediaIds.includes(lastSelectedId)) {
          const remainingMedia = filteredMediaList.filter(m => !mediaIds.includes(m.id));
          if (remainingMedia.length > 0 && remainingMedia[0]) {
            setLastSelectedId(remainingMedia[0].id);
            setSelectedMediaIds(new Set([remainingMedia[0].id]));
          } else {
            setLastSelectedId(null);
            setSelectedMediaIds(new Set());
          }
        }

        if (failCount === 0) {
          window.showToast?.({ message: `成功删除 ${successCount} 个文件`, type: 'success' });
        } else {
          window.showToast?.({
            message: `删除完成：${successCount} 成功，${failCount} 失败`,
            type: 'error',
          });
        }
      } catch (error) {
        console.error('删除失败:', error);
        window.showToast?.({ message: '删除失败', type: 'error' });
      }
    },
    [
      loadMedia,
      selectedMediaIds,
      lastSelectedId,
      filteredMediaList,
      setSelectedMediaIds,
      setLastSelectedId,
    ]
  );

  const handleClearPlaylist = useCallback(async () => {
    if (!window.electronAPI) return;
    try {
      const result = await window.electronAPI.clearAllMedia();
      if (result.success) {
        setMediaList([]);
        setSelectedMediaIds(new Set());
        setLastSelectedId(null);
        window.showToast?.({ message: result.message || '媒体库已清空', type: 'success' });
      } else {
        window.showToast?.({ message: result.error || '清空失败', type: 'error' });
      }
    } catch (error) {
      console.error('清空媒体库失败:', error);
      window.showToast?.({ message: '清空媒体库失败', type: 'error' });
    }
  }, [setMediaList, setSelectedMediaIds, setLastSelectedId]);

  const handleRemoveFromPlaylist = useCallback(
    (mediaIds: string[]) => {
      // Note: We need the current mediaList to filter
      // Ideally we should use functional update or get state, but here we can just fetch it or pass it.
      // However, since we are inside a hook, we can rely on store subscription if we used `mediaList` from store.
      // But `setMediaList` expects a new array.
      // The clean way is to access the current list.
      // Since `useMediaStore` is a hook, we can access `mediaList` directly if we import it.
      // But to avoid stale closures, it's better if `setMediaList` supported functional updates, or we read from `useMediaStore.getState()`.

      // For now, let's grab mediaList from the store hook usage at the top
      const { mediaList } = useMediaStore.getState(); // Accessing state directly for actions is often cleaner to avoid dependency hell

      const newMediaList = mediaList.filter(m => !mediaIds.includes(m.id));
      setMediaList(newMediaList);

      const { selectedMediaIds, lastSelectedId } = useMediaStore.getState();
      const newSet = new Set(selectedMediaIds);
      mediaIds.forEach(id => newSet.delete(id));
      setSelectedMediaIds(newSet);

      if (lastSelectedId && mediaIds.includes(lastSelectedId)) {
        setLastSelectedId(null);
      }

      window.showToast?.({ message: `已移除 ${mediaIds.length} 个文件`, type: 'success' });
    },
    [setMediaList, setSelectedMediaIds, setLastSelectedId]
  );

  const handleOpenMediaFolder = useCallback(async (media: MediaFile) => {
    if (!window.electronAPI) return;
    try {
      await window.electronAPI.openMediaFolder(media.path);
    } catch (error) {
      console.error('打开目录失败:', error);
      window.showToast?.({ message: '打开目录失败', type: 'error' });
    }
  }, []);

  const handleSaveTags = useCallback(
    async (tags: string[]) => {
      const { editingMedias } = useAppStore.getState();
      if (editingMedias.length === 0 || !window.electronAPI) return;

      let successCount = 0;

      for (const media of editingMedias) {
        try {
          const oldTags = media.tags;
          for (const tag of oldTags) {
            await window.electronAPI.removeTag(media.id, tag);
          }
          for (const tag of tags) {
            await window.electronAPI.addTag(media.id, tag);
          }
          successCount++;
        } catch (error) {
          console.error(`更新标签失败: ${media.filename}`, error);
        }
      }

      loadMedia();

      if (editingMedias.length === 1) {
        window.showToast?.({ message: '标签已更新', type: 'success' });
      } else {
        window.showToast?.({
          message: `已更新 ${successCount}/${editingMedias.length} 个文件的标签`,
          type: 'success',
        });
      }
    },
    [loadMedia]
  );

  return {
    loadMedia,
    handleAddFiles,
    handleAddFolder,
    handleRefreshFolders,
    handleDeleteMedia,
    handleClearPlaylist,
    handleRemoveFromPlaylist,
    handleOpenMediaFolder,
    handleSaveTags,
  };
};
