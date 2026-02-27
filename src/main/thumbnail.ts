import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import ffmpeg from 'fluent-ffmpeg';
import { path as ffmpegPath } from '@ffmpeg-installer/ffmpeg';

const THUMBNAIL_DIR = path.join(process.cwd(), 'thumbnails');
const THUMBNAIL_SIZE = 200; // 缩略图宽度

// 确保缩略图目录存在
function ensureThumbnailDir(): void {
  if (!fs.existsSync(THUMBNAIL_DIR)) {
    fs.mkdirSync(THUMBNAIL_DIR, { recursive: true });
  }
}

// 获取缩略图路径
function getThumbnailPath(filePath: string): string {
  const hash = crypto.createHash('md5').update(filePath).digest('hex');
  return path.join(THUMBNAIL_DIR, `${hash}.jpg`);
}

// 检查缩略图是否存在且有效
export function hasValidThumbnail(filePath: string): boolean {
  const thumbnailPath = getThumbnailPath(filePath);
  if (!fs.existsSync(thumbnailPath)) return false;

  // 检查原文件是否比缩略图新
  try {
    const originalStat = fs.statSync(filePath);
    const thumbnailStat = fs.statSync(thumbnailPath);
    return thumbnailStat.mtime >= originalStat.mtime;
  } catch {
    return false;
  }
}

// 生成图片缩略图
export async function generateImageThumbnail(filePath: string): Promise<string | null> {
  try {
    ensureThumbnailDir();
    const thumbnailPath = getThumbnailPath(filePath);

    // 如果已存在有效缩略图，直接返回
    if (hasValidThumbnail(filePath)) {
      return `file://${thumbnailPath.replace(/\\/g, '/')}`;
    }

    // 使用 sharp 生成缩略图
    await sharp(filePath)
      .resize(THUMBNAIL_SIZE, null, {
        withoutEnlargement: true,
        fit: 'inside',
      })
      .jpeg({
        quality: 85,
        progressive: true,
      })
      .toFile(thumbnailPath);

    return `file://${thumbnailPath.replace(/\\/g, '/')}`;
  } catch (error) {
    console.error('生成图片缩略图失败:', filePath, error);
    return null;
  }
}

// 生成视频缩略图（使用 ffmpeg）
export async function generateVideoThumbnail(filePath: string): Promise<string | null> {
  try {
    ensureThumbnailDir();
    const thumbnailPath = getThumbnailPath(filePath);

    // 如果已存在有效缩略图，直接返回
    if (hasValidThumbnail(filePath)) {
      return `file://${thumbnailPath.replace(/\\/g, '/')}`;
    }

    // 使用 ffmpeg 提取第一帧
    ffmpeg.setFfmpegPath(ffmpegPath);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(filePath)
        .screenshots({
          timestamps: ['00:00:01'],
          filename: path.basename(thumbnailPath),
          folder: THUMBNAIL_DIR,
          size: `${THUMBNAIL_SIZE}x?`,
        })
        .on('end', () => resolve())
        .on('error', (err: Error) => reject(err));
    });

    return `file://${thumbnailPath.replace(/\\/g, '/')}`;
  } catch (error) {
    console.error('生成视频缩略图失败:', filePath, error);
    return null;
  }
}

// 批量生成缩略图（用于后台处理）
export async function batchGenerateThumbnails(
  filePaths: Array<{ path: string; type: 'image' | 'video' }>,
  onProgress?: (current: number, total: number) => void
): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  const total = filePaths.length;

  for (let i = 0; i < filePaths.length; i++) {
    const item = filePaths[i];
    if (!item) continue;

    const filePath = item.path;
    const type = item.type;

    try {
      let thumbnail: string | null = null;

      if (type === 'image') {
        thumbnail = await generateImageThumbnail(filePath);
      } else {
        thumbnail = await generateVideoThumbnail(filePath);
      }

      if (thumbnail) {
        results.set(filePath, thumbnail);
      }

      onProgress?.(i + 1, total);
    } catch (error) {
      console.error(`生成缩略图失败 [${filePath}]:`, error);
    }
  }

  return results;
}

// 清理过期缩略图
export function cleanupThumbnails(validFilePaths: string[]): void {
  try {
    if (!fs.existsSync(THUMBNAIL_DIR)) return;

    const validHashes = new Set(
      validFilePaths.map(p => crypto.createHash('md5').update(p).digest('hex'))
    );

    const files = fs.readdirSync(THUMBNAIL_DIR);
    for (const file of files) {
      const hash = path.basename(file, '.jpg');
      if (!validHashes.has(hash)) {
        fs.unlinkSync(path.join(THUMBNAIL_DIR, file));
        console.log('清理过期缩略图:', file);
      }
    }
  } catch (error) {
    console.error('清理缩略图失败:', error);
  }
}
