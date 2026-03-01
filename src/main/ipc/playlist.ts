import { ipcMain } from 'electron';
import { DatabaseManager } from '../db/databaseManager';

export function registerPlaylistHandlers(dbManager: DatabaseManager) {
  // 获取所有播放列表
  ipcMain.handle('get-all-playlists', () => {
    try {
      return dbManager.getAllPlaylists();
    } catch (error) {
      console.error('获取播放列表失败:', error);
      return [];
    }
  });

  // 获取单个播放列表
  ipcMain.handle('get-playlist', (_, id: string) => {
    try {
      return dbManager.getPlaylist(id);
    } catch (error) {
      console.error('获取播放列表详情失败:', error);
      return null;
    }
  });

  // 创建播放列表
  ipcMain.handle('create-playlist', (_, name: string) => {
    try {
      return dbManager.createPlaylist(name);
    } catch (error) {
      console.error('创建播放列表失败:', error);
      return null;
    }
  });

  // 重命名播放列表
  ipcMain.handle('rename-playlist', (_, id: string, name: string) => {
    try {
      return dbManager.renamePlaylist(id, name);
    } catch (error) {
      console.error('重命名播放列表失败:', error);
      return false;
    }
  });

  // 删除播放列表
  ipcMain.handle('delete-playlist', (_, id: string) => {
    try {
      return dbManager.deletePlaylist(id);
    } catch (error) {
      console.error('删除播放列表失败:', error);
      return false;
    }
  });

  // 更新播放列表排序
  ipcMain.handle('update-playlist-order', (_, orders: { id: string; sortOrder: number }[]) => {
    try {
      return dbManager.updatePlaylistOrder(orders);
    } catch (error) {
      console.error('更新播放列表排序失败:', error);
      return false;
    }
  });

  // 添加媒体到播放列表
  ipcMain.handle('add-media-to-playlist', (_, playlistId: string, mediaIds: string[]) => {
    try {
      return dbManager.addMediaToPlaylist(playlistId, mediaIds);
    } catch (error) {
      console.error('添加媒体到播放列表失败:', error);
      return false;
    }
  });

  // 从播放列表移除媒体
  ipcMain.handle('remove-media-from-playlist', (_, playlistId: string, mediaIds: string[]) => {
    try {
      return dbManager.removeMediaFromPlaylist(playlistId, mediaIds);
    } catch (error) {
      console.error('从播放列表移除媒体失败:', error);
      return false;
    }
  });

  // 更新播放列表内媒体排序
  ipcMain.handle('update-playlist-media-order', (_, playlistId: string, mediaIds: string[]) => {
    try {
      return dbManager.updatePlaylistMediaOrder(playlistId, mediaIds);
    } catch (error) {
      console.error('更新播放列表媒体排序失败:', error);
      return false;
    }
  });

  // 获取播放列表中的所有媒体
  ipcMain.handle('get-playlist-media', (_, playlistId: string) => {
    try {
      return dbManager.getPlaylistMedia(playlistId);
    } catch (error) {
      console.error('获取播放列表媒体失败:', error);
      return [];
    }
  });
}
