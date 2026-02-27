import path from 'path';
import fs from 'fs';
import { app } from 'electron';

/**
 * 解决 Electron 打包后 Worker 线程路径问题的工具函数
 * 在开发模式和生产模式下正确解析路径
 */
export function resolveWorkerPath(workerFilename: string): string {
  const isDev = process.argv.includes('--dev');

  if (isDev) {
    // 开发模式：直接使用 __dirname
    return path.resolve(__dirname, workerFilename);
  } else {
    // 生产模式：处理 asar 打包后的路径
    const appPath = app.getAppPath();
    const workerPath = path.join(appPath, '..', '..', 'src', 'main', workerFilename);

    // 检查路径是否存在，如果不存在则尝试其他可能的路径
    if (fs.existsSync(workerPath)) {
      return workerPath;
    }

    // 备用路径：直接在 appPath 中查找
    const altPath = path.join(appPath, workerFilename);
    if (fs.existsSync(altPath)) {
      return altPath;
    }

    // 最后尝试：使用 __dirname
    return path.resolve(__dirname, workerFilename);
  }
}

/**
 * 解决资源文件路径问题（如 FFmpeg、FFprobe）
 * 在开发模式和生产模式下正确解析资源路径
 */
export function resolveResourcePath(resourcePath: string): string {
  const isDev = process.argv.includes('--dev');

  if (isDev) {
    return path.resolve(__dirname, resourcePath);
  } else {
    const appPath = app.getAppPath();
    const resolvedPath = path.join(appPath, '..', '..', resourcePath);

    if (fs.existsSync(resolvedPath)) {
      return resolvedPath;
    }

    return path.resolve(__dirname, resourcePath);
  }
}
