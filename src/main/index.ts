import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { DatabaseManager } from './db/DatabaseManager';
import { MediaScanner } from './utils/MediaScanner';
import { VideoProcessor } from './utils/VideoProcessor';

let mainWindow: BrowserWindow | null = null;
let dbManager: DatabaseManager;

async function createWindow() {
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

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => mainWindow?.show());
  mainWindow.on('closed', () => mainWindow = null);
}

// IPC Handlers
ipcMain.handle('scan-media-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory'],
    title: '选择媒体文件夹',
  });
  if (result.canceled) return null;
  
  const scanner = new MediaScanner();
  const files = await scanner.scan(result.filePaths[0]);
  for (const f of files) await dbManager.addMedia(f);
  return files;
});

ipcMain.handle('get-all-media', () => dbManager.getAllMedia());

ipcMain.handle('search-media-by-tags', (_, tags: string[]) => 
  dbManager.searchByTags(tags));

ipcMain.handle('add-tag', (_, mediaId: string, tag: string) => 
  dbManager.addTag(mediaId, tag));

ipcMain.handle('remove-tag', (_, mediaId: string, tag: string) => 
  dbManager.removeTag(mediaId, tag));

ipcMain.handle('delete-media', (_, mediaId: string) => 
  dbManager.deleteMedia(mediaId));

ipcMain.handle('trim-video-keep', async (_, input: string, output: string, start: number, end: number) => {
  await new VideoProcessor().trimKeep(input, output, start, end);
  return true;
});

ipcMain.handle('trim-video-remove', async (_, input: string, output: string, start: number, end: number) => {
  await new VideoProcessor().trimRemove(input, output, start, end);
  return true;
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
