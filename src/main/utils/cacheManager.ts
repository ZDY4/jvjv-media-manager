import fs from 'fs';
import path from 'path';
import type { DatabaseManager } from '../db/databaseManager';
import type { CacheClearResult, CacheClearScope, CacheStatus } from '../../shared/types';
import { checkDirWritable, getDefaultDataDir } from './config';

const TEMP_DIR_CANDIDATES = ['tmp', 'temp', '.tmp', '.cache', 'cache'];

type DeleteStats = {
  deletedEntries: number;
};

function ensureDataDir(dataDir: string): void {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function getDirSize(targetPath: string): number {
  try {
    const stat = fs.statSync(targetPath);
    if (stat.isFile()) {
      return stat.size;
    }

    if (!stat.isDirectory()) {
      return 0;
    }

    let total = 0;
    for (const entry of fs.readdirSync(targetPath)) {
      total += getDirSize(path.join(targetPath, entry));
    }
    return total;
  } catch {
    return 0;
  }
}

function removePathRecursive(targetPath: string): DeleteStats {
  if (!fs.existsSync(targetPath)) {
    return { deletedEntries: 0 };
  }

  try {
    const stat = fs.statSync(targetPath);
    if (stat.isDirectory()) {
      let deletedEntries = 1;
      for (const entry of fs.readdirSync(targetPath)) {
        const child = removePathRecursive(path.join(targetPath, entry));
        deletedEntries += child.deletedEntries;
      }
      fs.rmdirSync(targetPath);
      return { deletedEntries };
    }

    fs.unlinkSync(targetPath);
    return { deletedEntries: 1 };
  } catch {
    return { deletedEntries: 0 };
  }
}

function clearCacheOnly(dataDir: string): DeleteStats {
  let deletedEntries = 0;

  const thumbnailPath = path.join(dataDir, '.thumbnails');
  deletedEntries += removePathRecursive(thumbnailPath).deletedEntries;

  for (const dirName of TEMP_DIR_CANDIDATES) {
    const tempPath = path.join(dataDir, dirName);
    deletedEntries += removePathRecursive(tempPath).deletedEntries;
  }

  try {
    const entries = fs.readdirSync(dataDir);
    for (const entry of entries) {
      if (entry.toLowerCase().endsWith('.tmp') || entry.toLowerCase().endsWith('.temp')) {
        const target = path.join(dataDir, entry);
        deletedEntries += removePathRecursive(target).deletedEntries;
      }
    }
  } catch {
    // ignore
  }

  return { deletedEntries };
}

function clearAllDataExceptDatabase(dataDir: string): DeleteStats {
  let deletedEntries = 0;

  try {
    const entries = fs.readdirSync(dataDir);
    for (const entry of entries) {
      if (entry === 'media.db' || entry === 'media.db-shm' || entry === 'media.db-wal') {
        continue;
      }
      deletedEntries += removePathRecursive(path.join(dataDir, entry)).deletedEntries;
    }
  } catch {
    // ignore
  }

  return { deletedEntries };
}

export function getCacheStatus(): CacheStatus {
  const dataDir = getDefaultDataDir();
  ensureDataDir(dataDir);

  const writable = checkDirWritable(dataDir);
  return {
    dataDir,
    writable: writable.writable,
    reason: writable.reason,
    sizeBytes: getDirSize(dataDir),
  };
}

export function clearCache(scope: CacheClearScope, dbManager: DatabaseManager): CacheClearResult {
  const started = Date.now();
  const dataDir = getDefaultDataDir();
  ensureDataDir(dataDir);

  const writable = checkDirWritable(dataDir);
  if (!writable.writable) {
    return {
      success: false,
      scope,
      dataDir,
      durationMs: Date.now() - started,
      freedBytes: 0,
      deletedEntries: 0,
      message: `当前目录不可写: ${writable.reason ?? '未知错误'}`,
    };
  }

  const sizeBefore = getDirSize(dataDir);
  let deletedEntries = 0;

  try {
    if (scope === 'cache_only') {
      deletedEntries += clearCacheOnly(dataDir).deletedEntries;
    } else if (scope === 'cache_and_library') {
      deletedEntries += clearCacheOnly(dataDir).deletedEntries;
      dbManager.resetLibrary();
    } else {
      dbManager.rebuildDatabase();
      dbManager.resetLibrary();
      deletedEntries += clearAllDataExceptDatabase(dataDir).deletedEntries;
    }

    const sizeAfter = getDirSize(dataDir);
    const durationMs = Date.now() - started;
    const freedBytes = Math.max(0, sizeBefore - sizeAfter);

    return {
      success: true,
      scope,
      dataDir,
      durationMs,
      freedBytes,
      deletedEntries,
      message:
        scope === 'cache_only'
          ? '已清理缩略图与临时缓存'
          : scope === 'cache_and_library'
            ? '已清理缓存并重置媒体库'
            : '已清理全部应用数据（数据库已重建）',
    };
  } catch (error) {
    return {
      success: false,
      scope,
      dataDir,
      durationMs: Date.now() - started,
      freedBytes: 0,
      deletedEntries,
      message: `清理失败: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
