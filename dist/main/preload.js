"use strict";

// src/main/preload.ts
var import_electron = require("electron");
console.log("[Preload] \u5F00\u59CB\u521D\u59CB\u5316 Electron API...");
import_electron.contextBridge.exposeInMainWorld("electronAPI", {
  // 媒体库
  addMediaFiles: () => import_electron.ipcRenderer.invoke("add-media-files"),
  addMediaFolder: () => import_electron.ipcRenderer.invoke("add-media-folder"),
  scanMediaFolder: () => import_electron.ipcRenderer.invoke("add-media-folder"),
  // 向后兼容
  getAllMedia: () => import_electron.ipcRenderer.invoke("get-all-media"),
  searchMediaByTags: (tags) => import_electron.ipcRenderer.invoke("search-media-by-tags", tags),
  // Tag 管理
  addTag: (mediaId, tag) => import_electron.ipcRenderer.invoke("add-tag", mediaId, tag),
  removeTag: (mediaId, tag) => import_electron.ipcRenderer.invoke("remove-tag", mediaId, tag),
  // 删除媒体（移入回收站）
  deleteMedia: (mediaId) => import_electron.ipcRenderer.invoke("delete-media", mediaId),
  clearAllMedia: () => import_electron.ipcRenderer.invoke("clear-all-media"),
  // 打开文件所在目录
  openMediaFolder: (mediaPath) => import_electron.ipcRenderer.invoke("open-media-folder", mediaPath),
  // 视频剪辑
  trimVideoStart: (params) => import_electron.ipcRenderer.invoke("trim-video-start", params),
  selectOutputDir: () => import_electron.ipcRenderer.invoke("select-output-dir"),
  onTrimProgress: (callback) => {
    import_electron.ipcRenderer.removeAllListeners("trim-progress");
    import_electron.ipcRenderer.on("trim-progress", (_, data) => callback(data));
  },
  onTrimComplete: (callback) => {
    import_electron.ipcRenderer.removeAllListeners("trim-complete");
    import_electron.ipcRenderer.on("trim-complete", (_, data) => callback(data));
  },
  // 数据目录管理
  getDataDir: () => import_electron.ipcRenderer.invoke("get-data-dir"),
  setDataDir: (dirPath) => import_electron.ipcRenderer.invoke("set-data-dir", dirPath),
  selectDataDir: () => import_electron.ipcRenderer.invoke("select-data-dir"),
  // 菜单事件监听
  onMenuAddFiles: (callback) => {
    import_electron.ipcRenderer.removeAllListeners("menu-add-files");
    import_electron.ipcRenderer.on("menu-add-files", callback);
    return () => {
      import_electron.ipcRenderer.removeAllListeners("menu-add-files");
    };
  },
  onMenuAddFolder: (callback) => {
    import_electron.ipcRenderer.removeAllListeners("menu-add-folder");
    import_electron.ipcRenderer.on("menu-add-folder", callback);
    return () => {
      import_electron.ipcRenderer.removeAllListeners("menu-add-folder");
    };
  },
  onMenuSettings: (callback) => {
    import_electron.ipcRenderer.removeAllListeners("menu-settings");
    import_electron.ipcRenderer.on("menu-settings", callback);
    return () => {
      import_electron.ipcRenderer.removeAllListeners("menu-settings");
    };
  },
  // 重新扫描文件夹
  rescanFolders: (folderPaths) => import_electron.ipcRenderer.invoke("rescan-folders", folderPaths),
  // 扫描进度
  onScanProgress: (callback) => {
    import_electron.ipcRenderer.removeAllListeners("scan-progress");
    import_electron.ipcRenderer.on("scan-progress", (_, data) => callback(data));
    return () => {
      import_electron.ipcRenderer.removeAllListeners("scan-progress");
    };
  },
  // 播放列表窗口管理
  createPlaylistWindow: () => import_electron.ipcRenderer.invoke("create-playlist-window"),
  closePlaylistWindow: () => import_electron.ipcRenderer.invoke("close-playlist-window"),
  onPlaylistWindowClosed: (callback) => {
    import_electron.ipcRenderer.removeAllListeners("playlist-window-closed");
    import_electron.ipcRenderer.on("playlist-window-closed", callback);
    return () => {
      import_electron.ipcRenderer.removeAllListeners("playlist-window-closed");
    };
  },
  syncPlaylistData: (data) => import_electron.ipcRenderer.invoke("sync-playlist-data", data),
  onPlaylistAction: (callback) => {
    import_electron.ipcRenderer.removeAllListeners("playlist-action");
    import_electron.ipcRenderer.on("playlist-action", (_, action) => callback(action));
    return () => {
      import_electron.ipcRenderer.removeAllListeners("playlist-action");
    };
  },
  // 播放列表窗口专用 API
  onPlaylistDataSync: (callback) => {
    import_electron.ipcRenderer.removeAllListeners("sync-playlist-data");
    import_electron.ipcRenderer.on("sync-playlist-data", (_, data) => callback(data));
    return () => {
      import_electron.ipcRenderer.removeAllListeners("sync-playlist-data");
    };
  },
  sendPlaylistAction: (action) => {
    import_electron.ipcRenderer.send("playlist-action", action);
  },
  // 窗口控制
  minimizeWindow: () => import_electron.ipcRenderer.send("minimize-window"),
  maximizeWindow: () => import_electron.ipcRenderer.send("maximize-window"),
  closeWindow: () => import_electron.ipcRenderer.send("close-window"),
  // 播放列表窗口控制
  minimizePlaylistWindow: () => import_electron.ipcRenderer.send("minimize-playlist-window"),
  maximizePlaylistWindow: () => import_electron.ipcRenderer.send("maximize-playlist-window"),
  closePlaylistWindowDirect: () => import_electron.ipcRenderer.send("close-playlist-window-direct")
});
console.log("[Preload] Electron API \u521D\u59CB\u5316\u5B8C\u6210");
