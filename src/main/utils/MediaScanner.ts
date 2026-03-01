import fs from 'fs';
import path from 'path';
import { MediaFile } from '../../shared/types';
import { processFileExternal, VIDEO_EXT, IMAGE_EXT } from './fileProcessor';

export interface ScanProgress {
  scanned: number;
  total: number;
  currentFolder: string;
  batch: MediaFile[]; // 当前批次的文件
  isComplete: boolean; // 是否完成
}

export class MediaScanner {
  private onProgress?: (progress: ScanProgress) => void;

  constructor(onProgress?: (progress: ScanProgress) => void) {
    this.onProgress = onProgress;
  }

  async scan(folderPaths: string[]): Promise<MediaFile[]> {
    // 第一阶段：快速收集所有文件路径
    const filePaths: string[] = [];
    for (const folderPath of folderPaths) {
      await this.collectFiles(folderPath, filePaths);
    }

    // 如果没有文件，直接返回
    if (filePaths.length === 0) {
      this.onProgress?.({
        scanned: 0,
        total: 0,
        currentFolder: '',
        batch: [],
        isComplete: true,
      });
      return [];
    }

    // 第二阶段：批量处理文件，边处理边发送
    const results: MediaFile[] = [];
    const batchSize = 20; // 减小批次大小，更频繁地更新

    for (let i = 0; i < filePaths.length; i += batchSize) {
      const batch = filePaths.slice(i, i + batchSize);
      const batchResults: MediaFile[] = [];

      // 逐个处理文件，而不是并行处理，避免阻塞
      for (const filePath of batch) {
        try {
          const media = await this.processFile(filePath);
          if (media) {
            batchResults.push(media);
            results.push(media);
          }
        } catch (error) {
          console.error(`处理文件失败: ${filePath}`, error);
        }
      }

      // 发送进度更新和当前批次结果
      const currentFile = filePaths[i];
      const isLastBatch = i + batchSize >= filePaths.length;

      if (this.onProgress && currentFile) {
        this.onProgress({
          scanned: Math.min(i + batch.length, filePaths.length),
          total: filePaths.length,
          currentFolder: path.dirname(currentFile),
          batch: batchResults,
          isComplete: isLastBatch,
        });
      }

      // 让出时间片，避免阻塞主线程
      await new Promise(resolve => setImmediate(resolve));
    }

    return results;
  }

  private async collectFiles(dirPath: string, results: string[]): Promise<void> {
    try {
      const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          // 递归收集子目录
          await this.collectFiles(fullPath, results);
        } else if (entry.isFile()) {
          // 检查扩展名
          const ext = path.extname(fullPath).toLowerCase();
          if (VIDEO_EXT.includes(ext) || IMAGE_EXT.includes(ext)) {
            results.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.error(`读取目录失败: ${dirPath}`, error);
    }
  }

  private async processFile(filePath: string): Promise<MediaFile | null> {
    return processFileExternal(filePath);
  }
}
