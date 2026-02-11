const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // 媒体库
  scanMediaFolder: () => ipcRenderer.invoke('scan-media-folder'),
  getAllMedia: () => ipcRenderer.invoke('get-all-media'),
  searchMediaByTags: (tags) => ipcRenderer.invoke('search-media-by-tags', tags),
  
  // Tag 管理
  addTag: (mediaId, tag) => ipcRenderer.invoke('add-tag', mediaId, tag),
  removeTag: (mediaId, tag) => ipcRenderer.invoke('remove-tag', mediaId, tag),
  
  // 删除媒体
  deleteMedia: (mediaId) => ipcRenderer.invoke('delete-media', mediaId),
  
  // 视频剪辑
  trimVideoKeep: (input, output, start, end) => 
    ipcRenderer.invoke('trim-video-keep', input, output, start, end),
  trimVideoRemove: (input, output, start, end) => 
    ipcRenderer.invoke('trim-video-remove', input, output, start, end),
  
  // 数据目录管理
  getDataDir: () => ipcRenderer.invoke('get-data-dir'),
  setDataDir: (dirPath) => ipcRenderer.invoke('set-data-dir', dirPath),
  selectDataDir: () => ipcRenderer.invoke('select-data-dir'),
});
