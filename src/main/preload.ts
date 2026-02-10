import { contextBridge, ipcRenderer } from 'electron';
import { MediaFile } from '../shared/types';

contextBridge.exposeInMainWorld('electronAPI', {
  // 媒体库
  scanMediaFolder: (): Promise<MediaFile[] | null> => 
    ipcRenderer.invoke('scan-media-folder'),
  getAllMedia: (): Promise<MediaFile[]> => 
    ipcRenderer.invoke('get-all-media'),
  searchMediaByTags: (tags: string[]): Promise<MediaFile[]> => 
    ipcRenderer.invoke('search-media-by-tags', tags),
  
  // Tag 管理
  addTag: (mediaId: string, tag: string): Promise<boolean> => 
    ipcRenderer.invoke('add-tag', mediaId, tag),
  removeTag: (mediaId: string, tag: string): Promise<boolean> => 
    ipcRenderer.invoke('remove-tag', mediaId, tag),
  
  // 删除媒体
  deleteMedia: (mediaId: string): Promise<boolean> => 
    ipcRenderer.invoke('delete-media', mediaId),
  
  // 视频剪辑
  trimVideoKeep: (input: string, output: string, start: number, end: number): Promise<boolean> => 
    ipcRenderer.invoke('trim-video-keep', input, output, start, end),
  trimVideoRemove: (input: string, output: string, start: number, end: number): Promise<boolean> => 
    ipcRenderer.invoke('trim-video-remove', input, output, start, end),
});
