import { BrowserWindow } from 'electron';
import path from 'path';
import fs from 'fs';

let mainWindow: BrowserWindow | null = null;

export async function createMainWindow(isDev: boolean): Promise<BrowserWindow> {
  if (mainWindow) {
    mainWindow.focus();
    return mainWindow;
  }

  const preloadFromMain = path.resolve(__dirname, 'preload.js');
  const preloadFromSibling = path.resolve(__dirname, '../preload.js');
  const preloadPath = fs.existsSync(preloadFromMain) ? preloadFromMain : preloadFromSibling;

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    center: true,
    frame: false, // 使用自定义标题栏，隐藏原生边框
    backgroundColor: '#202020',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath,
      webSecurity: !isDev,
    },
    show: isDev,
  });

  if (isDev) {
    await mainWindow.loadURL('http://localhost:5173');
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'));
  }

  if (!isDev) {
    mainWindow.once('ready-to-show', () => {
      mainWindow?.show();
    });
  }

  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (!mainWindow.isVisible()) {
      mainWindow.show();
    }
    // 确保窗口在屏幕中央并最大化
    mainWindow.center();
    if (!mainWindow.isMaximized()) {
      mainWindow.maximize();
    }
    console.log('[Main] Window shown and maximized');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}
