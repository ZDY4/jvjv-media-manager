import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { MediaFile, MediaType } from '../../shared/types';

const VIDEO_EXT = ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.m4v'];
const IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];

export class MediaScanner {
  async scan(folderPath: string): Promise<MediaFile[]> {
    const results: MediaFile[] = [];
    await this.scanDir(folderPath, results);
    return results;
  }

  private async scanDir(dirPath: string, results: MediaFile[]): Promise<void> {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) await this.scanDir(fullPath, results);
      else if (entry.isFile()) {
        const media = this.processFile(fullPath);
        if (media) results.push(media);
      }
    }
  }

  private processFile(filePath: string): MediaFile | null {
    const ext = path.extname(filePath).toLowerCase();
    const stats = fs.statSync(filePath);
    let type: MediaType | null = null;
    if (VIDEO_EXT.includes(ext)) type = 'video';
    else if (IMAGE_EXT.includes(ext)) type = 'image';
    if (!type) return null;

    return {
      id: crypto.createHash('md5').update(filePath).digest('hex'),
      path: filePath, filename: path.basename(filePath), type,
      size: stats.size, createdAt: Math.floor(stats.birthtimeMs / 1000),
      modifiedAt: Math.floor(stats.mtimeMs / 1000), tags: [],
    };
  }
}
