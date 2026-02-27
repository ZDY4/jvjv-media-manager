/**
 * Path utilities for Electron production vs development
 * Handles path resolution for native binaries and worker threads
 */

import { app } from 'electron';
import path from 'path';
import { path as devFfmpegPath } from '@ffmpeg-installer/ffmpeg';
import { path as devFfprobePath } from '@ffprobe-installer/ffprobe';

/**
 * Get the base path for resources
 * In production: resources/app.asar.unpacked/
 * In development: project root
 */
export function getResourcesPath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'app.asar.unpacked');
  }
  return process.cwd();
}

/**
 * Get FFmpeg binary path
 * Works in both development and production
 */
export function getFfmpegPath(): string {
  if (app.isPackaged) {
    return path.join(
      process.resourcesPath,
      'app.asar.unpacked',
      'node_modules',
      '@ffmpeg-installer',
      'ffmpeg',
      process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'
    );
  }
  // Development: use @ffmpeg-installer
  return devFfmpegPath;
}

/**
 * Get FFprobe binary path
 * Works in both development and production
 */
export function getFfprobePath(): string {
  if (app.isPackaged) {
    return path.join(
      process.resourcesPath,
      'app.asar.unpacked',
      'node_modules',
      '@ffprobe-installer',
      'ffprobe',
      process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe'
    );
  }
  // Development: use @ffprobe-installer
  return devFfprobePath;
}

/**
 * Get Worker thread path
 * Works in both development and production
 */
export function getWorkerPath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'app.asar.unpacked', 'dist', 'main', 'videoWorker.js');
  }
  return path.join(__dirname, 'videoWorker.js');
}
