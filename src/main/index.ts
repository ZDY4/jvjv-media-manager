import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { DatabaseManager } from './db/DatabaseManager';
import { MediaScanner } from './utils/MediaScanner';
import { VideoProcessor } from './utils/VideoProcessor';

let mainWindow: BrowserWindow | null = null;
let dbManager: DatabaseManager;

async function createWindow() {
  try {
    dbManager = new DatabaseManager();
    
    mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1000,
      minHeight: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
      },
      show: false,
    });

    const vitePort = process.env.VITE_DEV_SERVER_PORT || '5173';
    const viteUrl = `http://localhost:${vitePort}`;

    if (process.env.VITE_DEV_SERVER_URL) {
      await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    } else {
      await mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    mainWindow.once('ready-to-show', () => mainWindow?.show());
    mainWindow.on('closed', () => mainWindow = null);
  } catch (error) {
    console.error('Failed to create window:', error);
    app.quit();
  }
}

// IPC Handlers
ipcMain.handle('scan-media-folder', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: '选择媒体文件夹',
  });
  if (result.canceled) return null;
  
  const scanner = new MediaScanner();
  const files = await scanner.scan(result.filePaths[0]);
  for (const f of files) await dbManager.addMedia(f);
  return files;
});

ipcMain.handle('get-all-media', async () => dbManager.getAllMedia());

ipcMain.handle('search-media-by-tags', async (_, tags: string[]) => 
  dbManager.searchByTags(tags));

ipcMain.handle('add-tag', async (_, mediaId: string, tag: string) => {
  await dbManager.addTag(mediaId, tag);
  return true;
});

ipcMain.handle('remove-tag', async (_, mediaId: string, tag: string) => {
  await dbManager.removeTag(mediaId, tag);
  return true;
});

ipcMain.handle('delete-media', async (_, mediaId: string) => {
  await dbManager.deleteMedia(mediaId);
  return true;
});

ipcMain.handle('trim-video-keep', async (_, input: string, output: string, start: number, end: number) => {
  await new VideoProcessor().trimKeep(input, output, start, end);
  return true;
});

ipcMain.handle('trim-video-remove', async (_, input: string, output: string, start: number, end: number) => {
  await new VideoProcessor().trimRemove(input, output, start, end);
  return true;
});

app.whenReady().then(createWindow).catch(console.error);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
