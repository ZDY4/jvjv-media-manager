import fs from 'fs';
import path from 'path';
import { MediaFile } from '../../shared/types';
import { processFileExternal, VIDEO_EXT, IMAGE_EXT } from './fileProcessor';

export interface ScanProgress {
  scanned: number;
  total: number;
  currentFolder: string;
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

    // 第二阶段：批量处理文件
    const results: MediaFile[] = [];
    const batchSize = 50; // 每批处理 50 个文件

    for (let i = 0; i < filePaths.length; i += batchSize) {
      const batch = filePaths.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(filePath => this.processFile(filePath)));

      results.push(...batchResults.filter((m): m is MediaFile => m !== null));

      // 发送进度更新
      const currentFile = filePaths[i];
      if (this.onProgress && currentFile) {
        this.onProgress({
          scanned: Math.min(i + batchSize, filePaths.length),
          total: filePaths.length,
          currentFolder: path.dirname(currentFile),
        });
      }

      // 让出时间片，避免阻塞
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
