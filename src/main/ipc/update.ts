import { app, ipcMain } from 'electron';
import { checkForUpdates, getAutoUpdateStatus, quitAndInstallUpdate } from '../utils/autoUpdater';

export function registerUpdateHandlers() {
  ipcMain.handle('get-app-version', () => app.getVersion());
  ipcMain.handle('get-auto-update-status', () => getAutoUpdateStatus());
  ipcMain.handle('check-for-updates', async () => checkForUpdates());
  ipcMain.handle('quit-and-install-update', async () => quitAndInstallUpdate());
}
