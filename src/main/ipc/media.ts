import { ipcMain, dialog, BrowserWindow, shell } from 'electron';
import type { DatabaseManager } from '../db/databaseManager';
import { MediaScanner } from '../utils/MediaScanner';
import { processFileExternal } from '../utils/fileProcessor';
import { cleanupThumbnails } from '../thumbnail';
import type { MediaFile } from '../../shared/types';
import { validateMediaId } from '../utils/validation';
import fs from 'fs';
import path from 'path';

let activeScanTaskCount = 0;

function beginScanTask(): void {
  activeScanTaskCount += 1;
}

function endScanTask(): void {
  activeScanTaskCount = Math.max(0, activeScanTaskCount - 1);
}

export function isScanInProgress(): boolean {
  return activeScanTaskCount > 0;
}

function normalizeInputPath(rawPath: string): string {
  if (!rawPath) return '';
  const trimmed = rawPath.trim();
  if (!trimmed) return '';

  if (!trimmed.startsWith('file://')) {
    return path.normalize(trimmed);
  }

  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'file:') return '';
    let pathname = decodeURIComponent(url.pathname);
    if (/^\/[a-zA-Z]:\//.test(pathname)) {
      pathname = pathname.slice(1);
    }
    return path.normalize(pathname);
  } catch {
    return '';
  }
}

export function registerMediaHandlers(dbManager: DatabaseManager) {
  // 添加文件
  ipcMain.handle('add-media-files', async (event): Promise<MediaFile[] | null> => {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) return null;

      const result = await dialog.showOpenDialog(window, {
        properties: ['openFile', 'multiSelections'],
        title: '选择媒体文件',
        filters: [
          {
            name: '媒体文件',
            extensions: [
              'mp4',
              'avi',
              'mkv',
              'mov',
              'wmv',
              'flv',
              'webm',
              'm4v',
              'jpg',
              'jpeg',
              'png',
              'gif',
              'bmp',
              'webp',
            ],
          },
          { name: '所有文件', extensions: ['*'] },
        ],
      });
      if (result.canceled || result.filePaths.length === 0) return null;

      const files: MediaFile[] = [];
      for (const filePath of result.filePaths) {
        const media = await processFileExternal(filePath);
        if (media) {
          dbManager.addMedia(media);
          files.push(media);
        }
      }
      return files;
    } catch (error) {
      console.error('添加文件失败:', error);
      throw error;
    }
  });

  // 添加文件夹（支持多选）
  ipcMain.handle('add-media-folder', async (event): Promise<MediaFile[] | null> => {
    beginScanTask();
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) return null;

      const result = await dialog.showOpenDialog(window, {
        properties: ['openDirectory', 'multiSelections'],
        title: '选择媒体文件夹（可多选）',
      });
      if (result.canceled || result.filePaths.length === 0) return null;

      // 发送开始扫描通知
      event.sender.send('scan-progress', {
        status: 'scanning',
        message: '正在扫描文件夹...',
        percent: 0,
      });

      const allFiles: MediaFile[] = [];
      const processedPaths = new Set<string>();

      // 创建带进度回调的扫描器
      const scanner = new MediaScanner(progress => {
        const percent = Math.round((progress.scanned / progress.total) * 100);

        // 发送进度更新
        event.sender.send('scan-progress', {
          status: 'scanning',
          message: `正在处理: ${progress.scanned}/${progress.total}`,
          percent,
        });

        // 发送增量批次数据
        if (progress.batch.length > 0) {
          // 去重：只发送未处理过的文件
          const newBatch = progress.batch.filter(file => {
            if (processedPaths.has(file.path)) {
              return false;
            }
            processedPaths.add(file.path);
            return true;
          });

          if (newBatch.length > 0) {
            allFiles.push(...newBatch);

            // 添加到数据库
            for (const file of newBatch) {
              dbManager.addMedia(file);
            }

            // 发送增量数据到前端
            event.sender.send('scan-batch', {
              files: newBatch,
              isComplete: progress.isComplete,
            });
          }
        }

        // 如果是最后一批，发送完成通知
        if (progress.isComplete) {
          event.sender.send('scan-progress', {
            status: 'complete',
            message: `完成，共添加 ${allFiles.length} 个文件`,
            percent: 100,
          });
        }
      });

      // 扫描所有选中的文件夹
      await scanner.scan(result.filePaths);

      return allFiles;
    } catch (error) {
      console.error('添加文件夹失败:', error);
      // 发送错误通知
      event.sender.send('scan-progress', {
        status: 'error',
        message: '扫描失败: ' + (error as Error).message,
        percent: 0,
      });
      throw error;
    } finally {
      endScanTask();
    }
  });

  // 拖拽添加文件/文件夹（支持混合）
  ipcMain.handle('add-media-paths', async (event, paths: unknown): Promise<MediaFile[] | null> => {
    beginScanTask();
    try {
      if (!Array.isArray(paths) || paths.length === 0) return null;

      const normalizedPaths = Array.from(
        new Set(
          paths
            .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
            .map(normalizeInputPath)
            .filter(Boolean)
        )
      );

      if (normalizedPaths.length === 0) return null;

      const folderPaths: string[] = [];
      const filePaths: string[] = [];

      for (const targetPath of normalizedPaths) {
        try {
          const stats = await fs.promises.stat(targetPath);
          if (stats.isDirectory()) {
            folderPaths.push(targetPath);
          } else if (stats.isFile()) {
            filePaths.push(targetPath);
          }
        } catch (error) {
          console.warn('[add-media-paths] 无法访问路径:', targetPath, error);
        }
      }

      if (folderPaths.length === 0 && filePaths.length === 0) return null;

      event.sender.send('scan-progress', {
        status: 'scanning',
        message: '正在处理拖拽内容...',
        percent: 0,
      });

      const allFiles: MediaFile[] = [];
      const processedPaths = new Set<string>();
      const dedupeAndSaveBatch = (batch: MediaFile[], isComplete: boolean) => {
        const newBatch = batch.filter(file => {
          const key = file.path.toLowerCase();
          if (processedPaths.has(key)) return false;
          processedPaths.add(key);
          return true;
        });

        if (newBatch.length > 0) {
          for (const file of newBatch) {
            dbManager.addMedia(file);
          }
          allFiles.push(...newBatch);
          event.sender.send('scan-batch', {
            files: newBatch,
            isComplete,
          });
        }
      };

      // Phase 1: 直接处理单文件（如果有）
      if (filePaths.length > 0) {
        const fileProgressWeight = folderPaths.length > 0 ? 40 : 100;
        let scannedFileCount = 0;

        for (const filePath of filePaths) {
          try {
            const media = await processFileExternal(filePath);
            if (media) {
              dedupeAndSaveBatch([media], false);
            }
          } catch (error) {
            console.error('处理拖拽文件失败:', filePath, error);
          }

          scannedFileCount++;
          const percent = Math.round((scannedFileCount / filePaths.length) * fileProgressWeight);
          event.sender.send('scan-progress', {
            status: 'scanning',
            message: `正在处理文件: ${scannedFileCount}/${filePaths.length}`,
            percent,
          });
        }
      }

      // Phase 2: 扫描拖拽的文件夹（如果有）
      if (folderPaths.length > 0) {
        const base = filePaths.length > 0 ? 40 : 0;
        const range = filePaths.length > 0 ? 60 : 100;

        const scanner = new MediaScanner(progress => {
          const progressPercent =
            progress.total > 0
              ? base + Math.round((progress.scanned / progress.total) * range)
              : base + range;

          event.sender.send('scan-progress', {
            status: 'scanning',
            message: `正在扫描文件夹: ${progress.scanned}/${progress.total}`,
            percent: Math.min(progressPercent, 99),
          });

          if (progress.batch.length > 0) {
            dedupeAndSaveBatch(progress.batch, false);
          }
        });

        await scanner.scan(folderPaths);
      }

      event.sender.send('scan-progress', {
        status: 'complete',
        message: `完成，共添加 ${allFiles.length} 个文件`,
        percent: 100,
      });

      return allFiles;
    } catch (error) {
      console.error('拖拽添加失败:', error);
      event.sender.send('scan-progress', {
        status: 'error',
        message: '拖拽添加失败: ' + (error as Error).message,
        percent: 0,
      });
      throw error;
    } finally {
      endScanTask();
    }
  });

  // 保持向后兼容
  ipcMain.handle('scan-media-folder', async () => {
    return ipcMain.emit('add-media-folder') as unknown as MediaFile[] | null;
  });

  // 重新扫描指定文件夹
  ipcMain.handle('rescan-folders', async (event, folderPaths: string[]): Promise<MediaFile[]> => {
    beginScanTask();
    try {
      if (folderPaths.length === 0) return [];

      // 发送开始扫描通知
      event.sender.send('scan-progress', {
        status: 'scanning',
        message: '正在刷新文件夹...',
        percent: 0,
      });

      // 获取现有媒体列表
      const existingMedia = dbManager.getAllMedia();
      const existingPaths = new Set(existingMedia.map(m => m.path));

      const allFiles: MediaFile[] = [];
      let addedCount = 0;
      const processedPaths = new Set<string>();

      // 创建带进度回调的扫描器
      const scanner = new MediaScanner(progress => {
        const percent = Math.round((progress.scanned / progress.total) * 100);

        // 发送进度更新
        event.sender.send('scan-progress', {
          status: 'scanning',
          message: `正在处理: ${progress.scanned}/${progress.total}`,
          percent,
        });

        // 发送增量批次数据
        if (progress.batch.length > 0) {
          // 去重并筛选新增的文件
          const newBatch = progress.batch.filter(file => {
            if (processedPaths.has(file.path)) {
              return false;
            }
            processedPaths.add(file.path);
            return true;
          });

          if (newBatch.length > 0) {
            allFiles.push(...newBatch);

            // 添加新文件到数据库
            for (const file of newBatch) {
              if (!existingPaths.has(file.path)) {
                dbManager.addMedia(file);
                addedCount++;
              }
            }

            // 发送增量数据到前端
            event.sender.send('scan-batch', {
              files: newBatch,
              isComplete: progress.isComplete,
            });
          }
        }

        // 如果是最后一批，发送完成通知
        if (progress.isComplete) {
          event.sender.send('scan-progress', {
            status: 'complete',
            message: `完成，新增 ${addedCount} 个文件`,
            percent: 100,
          });
        }
      });

      // 扫描所有指定的文件夹
      await scanner.scan(folderPaths);

      return allFiles;
    } catch (error) {
      console.error('刷新文件夹失败:', error);
      event.sender.send('scan-progress', {
        status: 'error',
        message: '刷新失败: ' + (error as Error).message,
        percent: 0,
      });
      throw error;
    } finally {
      endScanTask();
    }
  });

  ipcMain.handle('get-all-media', () => {
    const media = dbManager.getAllMedia();
    // 异步清理过期缩略图
    const validPaths = media.map(m => m.path);
    cleanupThumbnails(validPaths);
    return media;
  });

  // 删除媒体 - 移入回收站
  ipcMain.handle('delete-media', async (_, mediaId: string) => {
    try {
      // Validate input
      if (!validateMediaId(mediaId)) {
        return { success: false, error: 'Invalid mediaId' };
      }

      const media = dbManager.getMediaById(mediaId);
      if (!media) {
        return { success: false, error: '媒体不存在' };
      }

      // 检查文件是否存在
      if (!fs.existsSync(media.path)) {
        // 文件已不存在，只删除数据库记录
        dbManager.deleteMedia(mediaId);
        return { success: true, message: '已从数据库移除' };
      }

      // 移入系统回收站
      await shell.trashItem(media.path);

      // 从数据库删除记录
      dbManager.deleteMedia(mediaId);

      return { success: true, message: '已移入回收站' };
    } catch (error) {
      console.error('删除失败:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // 清空所有媒体
  ipcMain.handle('clear-all-media', async () => {
    try {
      dbManager.clearAllMedia();
      return { success: true, message: '媒体库已清空' };
    } catch (error) {
      console.error('清空媒体库失败:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // 打开文件所在目录
  ipcMain.handle('open-media-folder', async (_, mediaPath: string) => {
    try {
      // Validate and sanitize path
      if (!mediaPath || typeof mediaPath !== 'string') {
        return { success: false, error: 'Invalid mediaPath' };
      }

      const normalizedPath = path.normalize(mediaPath);
      if (normalizedPath.includes('..')) {
        return { success: false, error: 'Invalid path' };
      }

      const folderPath = path.dirname(normalizedPath);
      await shell.openPath(folderPath);
      return { success: true };
    } catch (error) {
      console.error('打开目录失败:', error);
      return { success: false, error: (error as Error).message };
    }
  });
}
