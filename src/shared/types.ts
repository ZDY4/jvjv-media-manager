export type MediaType = 'video' | 'image';

export interface WatchedFolder {
  path: string;
  locked: boolean;
}

export interface MediaFile {
  id: string;
  path: string;
  filename: string;
  type: MediaType;
  size: number;
  duration?: number;
  width?: number;
  height?: number;
  thumbnail?: string;
  createdAt: number;
  modifiedAt: number;
  lastPlayed?: number;
  playCount?: number;
  tags: string[];
}

export interface Tag {
  id: number;
  mediaId: string;
  name: string;
  createdAt: number;
}

// 播放列表
export interface Playlist {
  id: string;
  name: string;
  sortOrder: number;
  createdAt: number;
}

export interface PlaylistWithMedia extends Playlist {
  mediaIds: string[];
}

// Electron API Types
export interface ElectronAPI {
  addMediaFiles: () => Promise<MediaFile[] | null>;
  addMediaFolder: () => Promise<MediaFile[] | null>;
  scanMediaFolder: () => Promise<MediaFile[] | null>; // 向后兼容
  getAllMedia: () => Promise<MediaFile[]>;
  searchMediaByTags: (tags: string[]) => Promise<MediaFile[]>;
  addTag: (mediaId: string, tag: string) => Promise<boolean>;
  removeTag: (mediaId: string, tag: string) => Promise<boolean>;

  // 视频剪辑
  trimVideoStart: (params: {
    mode: 'keep' | 'remove';
    input: string;
    output: string;
    start: number;
    end: number;
  }) => Promise<{ success: boolean; output?: string; error?: string }>;
  selectOutputDir: () => Promise<string>;
  onTrimProgress: (callback: (data: { percent: number; mode: string }) => void) => void;
  onTrimComplete: (
    callback: (data: { success: boolean; output?: string; error?: string }) => void
  ) => void;

  // 数据目录管理
  getDataDir: () => Promise<string>;
  setDataDir: (dirPath: string) => Promise<boolean>;
  selectDataDir: () => Promise<string | null>;

  // 密码管理
  getLockPassword: () => Promise<string>;
  setLockPassword: (password: string) => Promise<{ success: boolean }>;

  deleteMedia: (mediaId: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  clearAllMedia: () => Promise<{ success: boolean; message?: string; error?: string }>;

  // 打开文件所在目录
  openMediaFolder: (mediaPath: string) => Promise<{ success: boolean; error?: string }>;

  // 菜单事件监听
  onMenuAddFiles: (callback: () => void) => () => void;
  onMenuAddFolder: (callback: () => void) => () => void;
  onMenuSettings: (callback: () => void) => () => void;

  // 重新扫描文件夹
  rescanFolders: (folderPaths: string[]) => Promise<MediaFile[]>;

  // 扫描进度
  onScanProgress: (
    callback: (data: { status: string; message: string; percent: number }) => void
  ) => () => void;

  // 扫描增量批次
  onScanBatch: (
    callback: (data: { files: MediaFile[]; isComplete: boolean }) => void
  ) => () => void;

  // 媒体库窗口管理
  createPlaylistWindow: () => Promise<boolean>;
  closePlaylistWindow: () => Promise<boolean>;
  onPlaylistWindowClosed: (callback: () => void) => () => void;
  syncPlaylistData: (data: {
    mediaList: MediaFile[];
    selectedId: string | null;
    viewMode?: 'list' | 'grid';
    iconSize?: number;
  }) => Promise<boolean>;
  onPlaylistAction: (callback: (action: { type: string; payload?: unknown }) => void) => () => void;

  // 媒体库窗口专用 API
  onPlaylistDataSync: (
    callback: (data: {
      mediaList: MediaFile[];
      selectedId: string | null;
      viewMode?: 'list' | 'grid';
      iconSize?: number;
    }) => void
  ) => () => void;
  sendPlaylistAction: (action: { type: string; payload?: unknown }) => void;

  // 窗口控制
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;

  // 媒体库窗口控制
  minimizePlaylistWindow: () => void;
  maximizePlaylistWindow: () => void;
  closePlaylistWindowDirect: () => void;

  // 播放列表管理
  getAllPlaylists: () => Promise<Playlist[]>;
  getPlaylist: (id: string) => Promise<PlaylistWithMedia | null>;
  getPlaylistMedia: (playlistId: string) => Promise<MediaFile[]>;
  createPlaylist: (name: string) => Promise<Playlist | null>;
  renamePlaylist: (id: string, name: string) => Promise<boolean>;
  deletePlaylist: (id: string) => Promise<boolean>;
  updatePlaylistOrder: (orders: { id: string; sortOrder: number }[]) => Promise<boolean>;
  addMediaToPlaylist: (playlistId: string, mediaIds: string[]) => Promise<boolean>;
  removeMediaFromPlaylist: (playlistId: string, mediaIds: string[]) => Promise<boolean>;
  updatePlaylistMediaOrder: (playlistId: string, mediaIds: string[]) => Promise<boolean>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
    showToast?: (config: {
      message: string;
      type?: 'success' | 'error' | 'info';
      duration?: number;
    }) => void;
  }
}

export {};
