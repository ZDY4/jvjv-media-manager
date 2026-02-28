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

app
  .whenReady()
  .then(async () => {
    initializeFfmpeg();

    // Register custom protocols
    registerProtocols();

    // Initialize Database (with error handling)
    let dbManager: DatabaseManager | null = null;
    try {
      dbManager = new DatabaseManager(getDefaultDataDir());
      console.log('[Main] Database initialized successfully');
    } catch (error) {
      console.error('[Main] Database initialization failed:', error);
      console.log('[Main] Continuing without database - some features may not work');
    }

    // Register IPC Handlers
    if (dbManager) {
      registerAllHandlers(dbManager);
    } else {
      console.warn('[Main] Skipping IPC handlers registration - no database');
    }

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
  })
  .catch(console.error);

app.on('before-quit', async () => {
  await cleanupVideoWorkers();
  closePlaylistWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
