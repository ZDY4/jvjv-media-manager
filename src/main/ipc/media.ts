import { ipcMain, dialog, BrowserWindow, shell } from 'electron';
import { DatabaseManager } from '../db/databaseManager';
import { MediaScanner } from '../utils/MediaScanner';
import { processFileExternal } from '../utils/fileProcessor';
import { cleanupThumbnails } from '../thumbnail';
import { MediaFile } from '../../shared/types';
import { validateMediaId } from '../utils/validation';
import fs from 'fs';
import path from 'path';

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
    }
  });

  // 保持向后兼容
  ipcMain.handle('scan-media-folder', async () => {
    return ipcMain.emit('add-media-folder') as unknown as MediaFile[] | null;
  });

  // 重新扫描指定文件夹
  ipcMain.handle('rescan-folders', async (event, folderPaths: string[]): Promise<MediaFile[]> => {
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
