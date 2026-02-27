import { app } from 'electron';
import ffmpeg from 'fluent-ffmpeg';
import { getFfmpegPath, getFfprobePath } from './utils/paths';
import { DatabaseManager } from './db/databaseManager';
import { getDefaultDataDir } from './utils/config';
import { createMainWindow } from './windows/MainWindow';
import { registerAllHandlers, cleanupVideoWorkers } from './ipc';
import { createApplicationMenu } from './utils/menu';
import { closePlaylistWindow } from './windows/PlaylistWindow';
import { registerSchemes, registerProtocols } from './utils/protocol';

// Register schemes before app is ready
registerSchemes();

// Set ffmpeg and ffprobe paths (after app ready)
function initializeFfmpeg() {
  ffmpeg.setFfmpegPath(getFfmpegPath());
  ffmpeg.setFfprobePath(getFfprobePath());
}

app.whenReady().then(async () => {
  initializeFfmpeg();

  // Register custom protocols
  registerProtocols();

  // Initialize Database
  const dbManager = new DatabaseManager(getDefaultDataDir());

  // Register IPC Handlers
  registerAllHandlers(dbManager);

  // Create Main Window
  const isDev = process.argv.includes('--dev');
  const mainWindow = await createMainWindow(isDev);

  // Create Menu
  createApplicationMenu(mainWindow);

  // Error handling & Logging
  mainWindow.webContents.on('preload-error', (_event, preloadPath, error) => {
    console.error('[Main] Preload error:', preloadPath, error);
  });
  
  mainWindow.webContents.on('console-message', (_event, level, message) => {
    console.log(`[Renderer:${level}] ${message}`);
  });
  
  console.log('[Main] App initialized');
}).catch(console.error);

app.on('before-quit', async () => {
  await cleanupVideoWorkers();
  closePlaylistWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
