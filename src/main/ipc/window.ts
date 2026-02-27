import { ipcMain, BrowserWindow } from 'electron';
import { createPlaylistWindow, closePlaylistWindow, getPlaylistWindow } from '../windows/PlaylistWindow';
import { getMainWindow } from '../windows/MainWindow';

export function registerWindowHandlers() {
  // 窗口控制
  ipcMain.on('minimize-window', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    window?.minimize();
  });

  ipcMain.on('maximize-window', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window) {
      if (window.isMaximized()) {
        window.unmaximize();
      } else {
        window.maximize();
      }
    }
  });

  ipcMain.on('close-window', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    window?.close();
  });

  // 播放列表窗口管理
  ipcMain.handle('create-playlist-window', async (event) => {
    try {
      const window = await createPlaylistWindow();
      const sender = event.sender;
      
      window.on('closed', () => {
        if (!sender.isDestroyed()) {
          sender.send('playlist-window-closed');
        }
      });
      return true;
    } catch (error) {
      console.error('创建播放列表窗口失败:', error);
      return false;
    }
  });

  ipcMain.handle('close-playlist-window', () => {
    closePlaylistWindow();
    return true;
  });

  ipcMain.handle(
    'sync-playlist-data',
    (_event, data) => {
      const playlistWindow = getPlaylistWindow();
      if (playlistWindow && !playlistWindow.isDestroyed()) {
        playlistWindow.webContents.send('sync-playlist-data', data);
      }
      return true;
    }
  );

  // 转发播放列表操作到主窗口
  ipcMain.on('playlist-action', (_event, action) => {
    const mainWindow = getMainWindow();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('playlist-action', action);
    }
  });

  // 播放列表窗口控制
  ipcMain.on('minimize-playlist-window', () => {
    const playlistWindow = getPlaylistWindow();
    playlistWindow?.minimize();
  });

  ipcMain.on('maximize-playlist-window', () => {
    const playlistWindow = getPlaylistWindow();
    if (playlistWindow) {
      if (playlistWindow.isMaximized()) {
        playlistWindow.unmaximize();
      } else {
        playlistWindow.maximize();
      }
    }
  });

  ipcMain.on('close-playlist-window-direct', () => {
    const playlistWindow = getPlaylistWindow();
    playlistWindow?.close();
  });
}
