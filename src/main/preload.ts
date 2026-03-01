import { contextBridge, ipcRenderer } from 'electron';
import type { MediaFile } from '../shared/types';

console.log('[Preload] 开始初始化 Electron API...');

contextBridge.exposeInMainWorld('electronAPI', {
  // 媒体库
  addMediaFiles: () => ipcRenderer.invoke('add-media-files'),
  addMediaFolder: () => ipcRenderer.invoke('add-media-folder'),
  scanMediaFolder: () => ipcRenderer.invoke('add-media-folder'), // 向后兼容
  getAllMedia: () => ipcRenderer.invoke('get-all-media'),
  searchMediaByTags: (tags: string[]) => ipcRenderer.invoke('search-media-by-tags', tags),

  // Tag 管理
  addTag: (mediaId: string, tag: string) => ipcRenderer.invoke('add-tag', mediaId, tag),
  removeTag: (mediaId: string, tag: string) => ipcRenderer.invoke('remove-tag', mediaId, tag),

  // 删除媒体（移入回收站）
  deleteMedia: (mediaId: string) => ipcRenderer.invoke('delete-media', mediaId),
  clearAllMedia: () => ipcRenderer.invoke('clear-all-media'),

  // 打开文件所在目录
  openMediaFolder: (mediaPath: string) => ipcRenderer.invoke('open-media-folder', mediaPath),

  // 视频剪辑
  trimVideoStart: (params: {
    mode: 'keep' | 'remove';
    input: string;
    output: string;
    start: number;
    end: number;
  }) => ipcRenderer.invoke('trim-video-start', params),
  selectOutputDir: () => ipcRenderer.invoke('select-output-dir'),
  onTrimProgress: (callback: (data: { percent: number; mode: string }) => void) => {
    // 移除旧的监听器以避免重复
    ipcRenderer.removeAllListeners('trim-progress');
    ipcRenderer.on('trim-progress', (_, data) => callback(data));
  },
  onTrimComplete: (
    callback: (data: { success: boolean; output?: string; error?: string }) => void
  ) => {
    // 移除旧的监听器以避免重复
    ipcRenderer.removeAllListeners('trim-complete');
    ipcRenderer.on('trim-complete', (_, data) => callback(data));
  },

  // 数据目录管理
  getDataDir: () => ipcRenderer.invoke('get-data-dir'),
  setDataDir: (dirPath: string) => ipcRenderer.invoke('set-data-dir', dirPath),
  selectDataDir: () => ipcRenderer.invoke('select-data-dir'),

  // 密码管理
  getLockPassword: () => ipcRenderer.invoke('get-lock-password'),
  setLockPassword: (password: string) => ipcRenderer.invoke('set-lock-password', password),

  // 菜单事件监听
  onMenuAddFiles: (callback: () => void) => {
    ipcRenderer.removeAllListeners('menu-add-files');
    ipcRenderer.on('menu-add-files', callback);
    return () => {
      ipcRenderer.removeAllListeners('menu-add-files');
    };
  },
  onMenuAddFolder: (callback: () => void) => {
    ipcRenderer.removeAllListeners('menu-add-folder');
    ipcRenderer.on('menu-add-folder', callback);
    return () => {
      ipcRenderer.removeAllListeners('menu-add-folder');
    };
  },
  onMenuSettings: (callback: () => void) => {
    ipcRenderer.removeAllListeners('menu-settings');
    ipcRenderer.on('menu-settings', callback);
    return () => {
      ipcRenderer.removeAllListeners('menu-settings');
    };
  },

  // 重新扫描文件夹
  rescanFolders: (folderPaths: string[]) => ipcRenderer.invoke('rescan-folders', folderPaths),

  // 扫描进度
  onScanProgress: (
    callback: (data: { status: string; message: string; percent: number }) => void
  ) => {
    ipcRenderer.removeAllListeners('scan-progress');
    ipcRenderer.on('scan-progress', (_, data) => callback(data));
    return () => {
      ipcRenderer.removeAllListeners('scan-progress');
    };
  },

  // 扫描增量批次
  onScanBatch: (callback: (data: { files: MediaFile[]; isComplete: boolean }) => void) => {
    ipcRenderer.removeAllListeners('scan-batch');
    ipcRenderer.on('scan-batch', (_, data) => callback(data));
    return () => {
      ipcRenderer.removeAllListeners('scan-batch');
    };
  },

  // 媒体库窗口管理
  createPlaylistWindow: () => ipcRenderer.invoke('create-playlist-window'),
  closePlaylistWindow: () => ipcRenderer.invoke('close-playlist-window'),
  onPlaylistWindowClosed: (callback: () => void) => {
    ipcRenderer.removeAllListeners('playlist-window-closed');
    ipcRenderer.on('playlist-window-closed', callback);
    return () => {
      ipcRenderer.removeAllListeners('playlist-window-closed');
    };
  },
  syncPlaylistData: (data: {
    mediaList: MediaFile[];
    selectedId: string | null;
    viewMode?: 'list' | 'grid';
    iconSize?: number;
  }) => ipcRenderer.invoke('sync-playlist-data', data),
  onPlaylistAction: (callback: (action: { type: string; payload?: unknown }) => void) => {
    ipcRenderer.removeAllListeners('playlist-action');
    ipcRenderer.on('playlist-action', (_, action) => callback(action));
    return () => {
      ipcRenderer.removeAllListeners('playlist-action');
    };
  },

  // 媒体库窗口专用 API
  onPlaylistDataSync: (
    callback: (data: {
      mediaList: MediaFile[];
      selectedId: string | null;
      viewMode?: 'list' | 'grid';
      iconSize?: number;
    }) => void
  ) => {
    ipcRenderer.removeAllListeners('sync-playlist-data');
    ipcRenderer.on('sync-playlist-data', (_, data) => callback(data));
    return () => {
      ipcRenderer.removeAllListeners('sync-playlist-data');
    };
  },
  sendPlaylistAction: (action: { type: string; payload?: unknown }) => {
    ipcRenderer.send('playlist-action', action);
  },

  // 窗口控制
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),

  // 媒体库窗口控制
  minimizePlaylistWindow: () => ipcRenderer.send('minimize-playlist-window'),
  maximizePlaylistWindow: () => ipcRenderer.send('maximize-playlist-window'),
  closePlaylistWindowDirect: () => ipcRenderer.send('close-playlist-window-direct'),

  // 播放列表管理
  getAllPlaylists: () => ipcRenderer.invoke('get-all-playlists'),
  getPlaylist: (id: string) => ipcRenderer.invoke('get-playlist', id),
  getPlaylistMedia: (playlistId: string) => ipcRenderer.invoke('get-playlist-media', playlistId),
  createPlaylist: (name: string) => ipcRenderer.invoke('create-playlist', name),
  renamePlaylist: (id: string, name: string) => ipcRenderer.invoke('rename-playlist', id, name),
  deletePlaylist: (id: string) => ipcRenderer.invoke('delete-playlist', id),
  updatePlaylistOrder: (orders: { id: string; sortOrder: number }[]) =>
    ipcRenderer.invoke('update-playlist-order', orders),
  addMediaToPlaylist: (playlistId: string, mediaIds: string[]) =>
    ipcRenderer.invoke('add-media-to-playlist', playlistId, mediaIds),
  removeMediaFromPlaylist: (playlistId: string, mediaIds: string[]) =>
    ipcRenderer.invoke('remove-media-from-playlist', playlistId, mediaIds),
  updatePlaylistMediaOrder: (playlistId: string, mediaIds: string[]) =>
    ipcRenderer.invoke('update-playlist-media-order', playlistId, mediaIds),
});

console.log('[Preload] Electron API 初始化完成');
