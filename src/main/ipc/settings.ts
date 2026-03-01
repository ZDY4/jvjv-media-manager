import { ipcMain, dialog, BrowserWindow } from 'electron';
import {
  getDefaultDataDir,
  getConfig,
  saveConfig,
  getSecureConfig,
  saveSecureConfig,
} from '../utils/config';

export function registerSettingsHandlers() {
  ipcMain.handle('select-output-dir', async event => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return null;

    const result = await dialog.showOpenDialog(window, {
      properties: ['openDirectory'],
      title: '选择输出目录',
    });
    if (result.canceled || !result.filePaths[0]) return null;
    return result.filePaths[0];
  });

  ipcMain.handle('get-data-dir', () => getDefaultDataDir());

  ipcMain.handle('set-data-dir', async (_, dirPath) => {
    const config = getConfig();
    config.dataDir = dirPath;
    saveConfig(config);
    return { success: true };
  });

  ipcMain.handle('select-data-dir', async event => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return null;

    const result = await dialog.showOpenDialog(window, {
      properties: ['openDirectory'],
      title: '选择数据存储目录',
    });
    if (result.canceled) return null;
    return result.filePaths[0] || null;
  });

  // 密码管理接口
  ipcMain.handle('get-lock-password', () => {
    const dataDir = getDefaultDataDir();
    const secureConfig = getSecureConfig(dataDir);
    return secureConfig.lockPassword || '';
  });

  ipcMain.handle('set-lock-password', (_, password: string) => {
    const dataDir = getDefaultDataDir();
    const secureConfig = getSecureConfig(dataDir);
    secureConfig.lockPassword = password;
    saveSecureConfig(dataDir, secureConfig);
    return { success: true };
  });
}
