/**
 * Path utilities for Electron production vs development
 * Handles path resolution for native binaries and worker threads
 */

import { app } from 'electron';
import path from 'path';
import fs from 'fs';

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
    const binary = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
    const platformDir = `${process.platform}-${process.arch}`;
    const candidates = [
      path.join(
        process.resourcesPath,
        'app.asar.unpacked',
        'node_modules',
        '@ffmpeg-installer',
        platformDir,
        binary
      ),
      path.join(
        process.resourcesPath,
        'app.asar.unpacked',
        'node_modules',
        '@ffmpeg-installer',
        'ffmpeg',
        platformDir,
        binary
      ),
      path.join(
        process.resourcesPath,
        'app.asar.unpacked',
        'node_modules',
        '@ffmpeg-installer',
        'ffmpeg',
        binary
      ),
    ];

    const found = candidates.find(candidate => fs.existsSync(candidate));
    return found || candidates[0];
  }
  // Development: use @ffmpeg-installer
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg') as { path: string };
  return ffmpegInstaller.path;
}

/**
 * Get FFprobe binary path
 * Works in both development and production
 */
export function getFfprobePath(): string {
  if (app.isPackaged) {
    const binary = process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe';
    const platformDir = `${process.platform}-${process.arch}`;
    const candidates = [
      path.join(
        process.resourcesPath,
        'app.asar.unpacked',
        'node_modules',
        '@ffprobe-installer',
        platformDir,
        binary
      ),
      path.join(
        process.resourcesPath,
        'app.asar.unpacked',
        'node_modules',
        '@ffprobe-installer',
        'ffprobe',
        platformDir,
        binary
      ),
      path.join(
        process.resourcesPath,
        'app.asar.unpacked',
        'node_modules',
        '@ffprobe-installer',
        'ffprobe',
        binary
      ),
    ];

    const found = candidates.find(candidate => fs.existsSync(candidate));
    return found || candidates[0];
  }
  // Development: use @ffprobe-installer
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ffprobeInstaller = require('@ffprobe-installer/ffprobe') as { path: string };
  return ffprobeInstaller.path;
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
