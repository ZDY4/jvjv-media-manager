import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import ffmpeg from 'fluent-ffmpeg';
import { path as ffmpegPath } from '@ffmpeg-installer/ffmpeg';
import { getDefaultDataDir } from './utils/config';

const THUMBNAIL_SIZE = 200; // 缩略图宽度
const THUMBNAIL_EXT = '.thumb'; // 使用自定义扩展名，不被 Windows 识别为图片

// 获取缩略图目录（在数据目录中）
function getThumbnailDir(): string {
  const dataDir = getDefaultDataDir();
  const thumbnailDir = path.join(dataDir, '.thumbnails');
  return thumbnailDir;
}

// 确保缩略图目录存在
function ensureThumbnailDir(): void {
  const thumbnailDir = getThumbnailDir();
  if (!fs.existsSync(thumbnailDir)) {
    fs.mkdirSync(thumbnailDir, { recursive: true });
  }
}

// 规范化路径（统一使用正斜杠，用于哈希计算）
function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

// 转换为 Windows 路径（用于文件系统操作）
function toWindowsPath(filePath: string): string {
  return filePath.replace(/\//g, '\\');
}

// 获取缩略图路径
function getThumbnailPath(filePath: string): string {
  // 使用规范化后的路径计算哈希，确保一致性
  const normalizedPath = normalizePath(filePath);
  const hash = crypto.createHash('md5').update(normalizedPath).digest('hex');
  return path.join(getThumbnailDir(), `${hash}${THUMBNAIL_EXT}`);
}

// 检查缩略图是否存在且有效
export function hasValidThumbnail(filePath: string): boolean {
  const thumbnailPath = getThumbnailPath(filePath);
  if (!fs.existsSync(thumbnailPath)) return false;

  // 检查原文件是否比缩略图新
  // 将正斜杠路径转换为 Windows 格式以便 fs.statSync 正确工作
  const windowsPath = process.platform === 'win32' ? toWindowsPath(filePath) : filePath;
  try {
    const originalStat = fs.statSync(windowsPath);
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

    // 将正斜杠路径转换为 Windows 格式以便 sharp 正确工作
    const windowsPath = process.platform === 'win32' ? toWindowsPath(filePath) : filePath;

    // 使用 sharp 生成缩略图
    await sharp(windowsPath)
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

    // 将正斜杠路径转换为 Windows 格式以便 ffmpeg 正确工作
    const windowsPath = process.platform === 'win32' ? toWindowsPath(filePath) : filePath;

    // 使用 ffmpeg 提取第一帧
    ffmpeg.setFfmpegPath(ffmpegPath);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(windowsPath)
        .screenshots({
          timestamps: ['00:00:01'],
          filename: path.basename(thumbnailPath),
          folder: getThumbnailDir(),
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
    const thumbnailDir = getThumbnailDir();
    if (!fs.existsSync(thumbnailDir)) return;

    const validHashes = new Set(
      validFilePaths.map(p => crypto.createHash('md5').update(normalizePath(p)).digest('hex'))
    );

    const files = fs.readdirSync(thumbnailDir);
    for (const file of files) {
      // 使用新的扩展名
      const hash = path.basename(file, THUMBNAIL_EXT);
      if (!validHashes.has(hash)) {
        fs.unlinkSync(path.join(thumbnailDir, file));
        console.log('清理过期缩略图:', file);
      }
    }
  } catch (error) {
    console.error('清理缩略图失败:', error);
  }
}
