import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import ffmpeg from 'fluent-ffmpeg';
import sharp from 'sharp';
import { MediaFile, MediaType } from '../../shared/types';
import { generateImageThumbnail, generateVideoThumbnail } from '../thumbnail';

export const VIDEO_EXT = ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.m4v'];
export const IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];

export async function processFileExternal(filePath: string): Promise<MediaFile | null> {
  const ext = path.extname(filePath).toLowerCase();
  let type: MediaType | null = null;
  if (VIDEO_EXT.includes(ext)) type = 'video';
  else if (IMAGE_EXT.includes(ext)) type = 'image';
  if (!type) return null;

  let stats: fs.Stats;
  try {
    stats = await fs.promises.stat(filePath);
  } catch (error) {
    console.error(`获取文件信息失败: ${filePath}`, error);
    return null;
  }

  // 生成缩略图（使用 Promise.race 添加超时）
  let thumbnail: string | undefined;
  try {
    const thumbnailPromise =
      type === 'image' ? generateImageThumbnail(filePath) : generateVideoThumbnail(filePath);

    // 5 秒超时
    thumbnail =
      (await Promise.race([
        thumbnailPromise,
        new Promise<undefined>(resolve => setTimeout(() => resolve(undefined), 5000)),
      ])) || undefined;
  } catch (error) {
    console.error('生成缩略图失败:', filePath, error);
  }

  // 提取元数据
  let width: number | undefined;
  let height: number | undefined;
  let duration: number | undefined;

  if (type === 'video') {
    // 使用 ffprobe 获取视频元数据
    try {
      const metadata = await new Promise<ffmpeg.FfprobeData>((resolve, reject) => {
        ffmpeg(filePath).ffprobe((err, data) => {
          if (err) reject(err);
          else resolve(data);
        });
      });

      const videoStream = metadata.streams.find(s => s.codec_type === 'video');
      if (videoStream) {
        width = videoStream.width;
        height = videoStream.height;
      }
      duration = metadata.format.duration;
    } catch (error) {
      console.error('获取视频元数据失败:', filePath, error);
    }
  } else if (type === 'image') {
    // 使用 sharp 获取图片元数据
    try {
      const metadata = await sharp(filePath).metadata();
      width = metadata.width;
      height = metadata.height;
    } catch (error) {
      console.error('获取图片元数据失败:', filePath, error);
    }
  }

  return {
    id: crypto.createHash('md5').update(filePath).digest('hex'),
    path: filePath,
    filename: path.basename(filePath),
    type,
    size: stats.size,
    width,
    height,
    duration,
    thumbnail,
    createdAt: Math.floor(stats.birthtimeMs / 1000),
    modifiedAt: Math.floor(stats.mtimeMs / 1000),
    tags: [],
  };
}
