import { app, BrowserWindow } from 'electron';
import type { AutoUpdateStatus } from '../../shared/types';
import type { AppUpdater } from 'electron-updater';

let initialized = false;
let updateDownloaded = false;
let updater: AppUpdater | null = null;
let updaterLoadPromise: Promise<AppUpdater | null> | null = null;
let listenersBound = false;
let currentStatus: AutoUpdateStatus = {
  status: 'idle',
  message: '尚未检查更新',
};

const broadcastStatus = (status: AutoUpdateStatus): void => {
  currentStatus = status;
  const windows = BrowserWindow.getAllWindows();
  for (const win of windows) {
    if (!win.isDestroyed()) {
      win.webContents.send('auto-update-status', status);
    }
  }
};

const updateDisabledMessage = '开发环境不支持自动更新，请打包后测试';

function toSafeMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error.trim().length > 0) return error;
  return fallback;
}

function resolveVersion(info: unknown): string | undefined {
  if (info && typeof info === 'object' && 'version' in info) {
    const value = (info as { version?: unknown }).version;
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }
  return undefined;
}

async function getUpdater(): Promise<AppUpdater | null> {
  if (updater) return updater;

  if (!updaterLoadPromise) {
    updaterLoadPromise = import('electron-updater')
      .then(module => {
        updater = module.autoUpdater ?? null;
        return updater;
      })
      .catch(error => {
        const message = toSafeMessage(error, '加载自动更新模块失败');
        broadcastStatus({
          status: 'error',
          message: `更新模块不可用: ${message}`,
        });
        return null;
      });
  }

  return updaterLoadPromise;
}

export function getAutoUpdateStatus(): AutoUpdateStatus {
  return currentStatus;
}

async function ensureUpdaterReady(): Promise<AppUpdater | null> {
  const autoUpdater = await getUpdater();
  if (!autoUpdater) return null;
  if (listenersBound) return autoUpdater;

  listenersBound = true;

  try {
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on('checking-for-update', () => {
      broadcastStatus({
        status: 'checking',
        message: '正在检查更新...',
      });
    });

    autoUpdater.on('update-available', info => {
      const version = resolveVersion(info);
      broadcastStatus({
        status: 'available',
        message: version ? `发现新版本 ${version}，开始下载` : '发现新版本，开始下载',
        version,
      });
    });

    autoUpdater.on('update-not-available', info => {
      const version = resolveVersion(info);
      broadcastStatus({
        status: 'not-available',
        message: version ? `当前已是最新版本（${version}）` : '当前已是最新版本',
        version,
      });
    });

    autoUpdater.on('download-progress', progress => {
      const rawPercent =
        progress && typeof progress === 'object' && 'percent' in progress
          ? (progress as { percent?: number }).percent
          : undefined;
      const percent = Math.max(0, Math.min(100, Math.round(rawPercent || 0)));
      broadcastStatus({
        status: 'download-progress',
        message: `更新下载中 ${percent}%`,
        percent,
      });
    });

    autoUpdater.on('update-downloaded', info => {
      updateDownloaded = true;
      const version = resolveVersion(info);
      broadcastStatus({
        status: 'downloaded',
        message: version
          ? `更新 ${version} 已下载，点击“重启并安装更新”生效`
          : '更新已下载，点击“重启并安装更新”生效',
        version,
        percent: 100,
      });
    });

    autoUpdater.on('error', error => {
      const message = toSafeMessage(error, '未知错误');
      broadcastStatus({
        status: 'error',
        message: `更新失败: ${message}`,
      });
    });
  } catch (error) {
    const message = toSafeMessage(error, '初始化自动更新时发生未知错误');
    broadcastStatus({
      status: 'error',
      message: `自动更新初始化失败: ${message}`,
    });
    return null;
  }

  return autoUpdater;
}

export async function initializeAutoUpdater(): Promise<void> {
  if (initialized) return;
  initialized = true;

  if (!app.isPackaged) {
    broadcastStatus({
      status: 'disabled',
      message: updateDisabledMessage,
    });
    return;
  }
  broadcastStatus({
    status: 'idle',
    message: '可手动检查更新',
  });
}

export async function checkForUpdates(): Promise<{ success: boolean; message: string }> {
  if (!app.isPackaged) {
    const message = updateDisabledMessage;
    broadcastStatus({
      status: 'disabled',
      message,
    });
    return { success: false, message };
  }

  const autoUpdater = await ensureUpdaterReady();
  if (!autoUpdater) {
    return { success: false, message: '自动更新模块不可用' };
  }

  try {
    await autoUpdater.checkForUpdates();
    return { success: true, message: '已开始检查更新' };
  } catch (error) {
    const message = `检查更新失败: ${(error as Error).message}`;
    broadcastStatus({
      status: 'error',
      message,
    });
    return { success: false, message };
  }
}

export async function quitAndInstallUpdate(): Promise<{ success: boolean; message: string }> {
  if (!app.isPackaged) {
    return { success: false, message: updateDisabledMessage };
  }

  const autoUpdater = await ensureUpdaterReady();
  if (!autoUpdater) {
    return { success: false, message: '自动更新模块不可用' };
  }

  if (!updateDownloaded) {
    return { success: false, message: '当前没有已下载的更新' };
  }

  setImmediate(() => {
    autoUpdater.quitAndInstall(false, true);
  });

  return { success: true, message: '应用即将重启并安装更新' };
}
