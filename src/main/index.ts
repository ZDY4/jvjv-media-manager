import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import type { DatabaseManager } from './db/databaseManager';
import { getDefaultDataDir } from './utils/config';
import { createMainWindow } from './windows/MainWindow';
import { createApplicationMenu } from './utils/menu';
import { closePlaylistWindow } from './windows/PlaylistWindow';
import { registerSchemes, registerProtocols } from './utils/protocol';
import { initializeAutoUpdater } from './utils/autoUpdater';

let cleanupVideoWorkersFn: () => Promise<void> = async () => {};

// Register schemes before app is ready
registerSchemes();

function appendMainErrorLog(scope: string, error: unknown): void {
  try {
    const userDataDir = (() => {
      try {
        return app.getPath('userData');
      } catch {
        const appData = process.env.APPDATA || process.cwd();
        return path.join(appData, 'media-manager');
      }
    })();
    const logPath = path.join(userDataDir, 'main-errors.log');
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    const message =
      error instanceof Error
        ? `${error.name}: ${error.message}\n${error.stack || ''}`
        : String(error);
    const line = `[${new Date().toISOString()}] [${scope}] ${message}\n\n`;
    fs.appendFileSync(logPath, line, { encoding: 'utf8' });
  } catch (logError) {
    console.error('[Main] Failed to write main error log:', logError);
  }
}

process.on('uncaughtException', error => {
  console.error('[Main] uncaughtException:', error);
  appendMainErrorLog('uncaughtException', error);
});

process.on('unhandledRejection', reason => {
  console.error('[Main] unhandledRejection:', reason);
  appendMainErrorLog('unhandledRejection', reason);
});

// Set ffmpeg and ffprobe paths (after app ready)
async function initializeFfmpeg() {
  try {
    const [{ default: ffmpeg }, { getFfmpegPath, getFfprobePath }] = await Promise.all([
      import('fluent-ffmpeg'),
      import('./utils/paths'),
    ]);
    ffmpeg.setFfmpegPath(getFfmpegPath());
    ffmpeg.setFfprobePath(getFfprobePath());
  } catch (error) {
    console.error('[Main] FFmpeg initialization failed:', error);
    appendMainErrorLog('ffmpeg-init', error);
  }
}

app
  .whenReady()
  .then(async () => {
    await initializeFfmpeg();

    // Register custom protocols
    registerProtocols();

    // Initialize Database (with error handling)
    let dbManager: DatabaseManager | null = null;
    try {
      const { DatabaseManager: DatabaseManagerCtor } = await import('./db/databaseManager');
      dbManager = new DatabaseManagerCtor(getDefaultDataDir());
      console.log('[Main] Database initialized successfully');
    } catch (error) {
      console.error('[Main] Database initialization failed:', error);
      appendMainErrorLog('database-init', error);
      console.log('[Main] Continuing without database - some features may not work');
    }

    // Register IPC Handlers
    if (dbManager) {
      try {
        const ipcModule = await import('./ipc');
        ipcModule.registerAllHandlers(dbManager);
        cleanupVideoWorkersFn = ipcModule.cleanupVideoWorkers;
      } catch (error) {
        console.error('[Main] IPC initialization failed:', error);
        appendMainErrorLog('ipc-init', error);
      }
    } else {
      console.warn('[Main] Skipping IPC handlers registration - no database');
    }

    // Create Main Window
    const isDev = process.argv.includes('--dev');
    const mainWindow = await createMainWindow(isDev);
    try {
      await initializeAutoUpdater();
    } catch (error) {
      console.error('[Main] Auto updater initialization failed:', error);
      appendMainErrorLog('auto-updater-init', error);
    }

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
  .catch(error => {
    console.error('[Main] App bootstrap failed:', error);
    appendMainErrorLog('app.whenReady', error);
  });

app.on('before-quit', async () => {
  await cleanupVideoWorkersFn();
  closePlaylistWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
