const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {
  scanMediaFolder: () => ipcRenderer.invoke('scan-media-folder'),
  getAllMedia: () => ipcRenderer.invoke('get-all-media'),
  searchMediaByTags: (tags) => ipcRenderer.invoke('search-media-by-tags', tags),
  addTag: (mediaId, tag) => ipcRenderer.invoke('add-tag', mediaId, tag),
  removeTag: (mediaId, tag) => ipcRenderer.invoke('remove-tag', mediaId, tag),
  deleteMedia: (mediaId) => ipcRenderer.invoke('delete-media', mediaId),
  trimVideoKeep: (input, output, start, end) => 
    ipcRenderer.invoke('trim-video-keep', input, output, start, end),
  trimVideoRemove: (input, output, start, end) => 
    ipcRenderer.invoke('trim-video-remove', input, output, start, end),
});
