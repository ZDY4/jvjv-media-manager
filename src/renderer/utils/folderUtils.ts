import { WatchedFolder } from '@/shared/types';

/**
 * 检查两个路径是否存在包含关系（一个是另一个的子文件夹）
 */
function isPathContained(path1: string, path2: string): boolean {
  const normalizePath = (p: string) => {
    // 统一使用正斜杠，移除末尾的斜杠，转小写（Windows 不区分大小写）
    return p.replace(/\\/g, '/').replace(/\/$/, '').toLowerCase();
  };

  const normalized1 = normalizePath(path1);
  const normalized2 = normalizePath(path2);

  // 完全相同
  if (normalized1 === normalized2) return true;

  // path1 包含 path2 (path2 是 path1 的子文件夹)
  if (normalized2.startsWith(normalized1 + '/')) return true;

  // path2 包含 path1 (path1 是 path2 的子文件夹)
  if (normalized1.startsWith(normalized2 + '/')) return true;

  return false;
}

/**
 * 检查新文件夹是否可以添加到监控列表（去重）
 * 返回结果：{ canAdd: boolean, reason?: string }
 */
export function canAddWatchedFolder(
  newPath: string,
  existingFolders: WatchedFolder[]
): { canAdd: boolean; reason?: string } {
  for (const folder of existingFolders) {
    if (isPathContained(newPath, folder.path)) {
      if (folder.path.toLowerCase() === newPath.toLowerCase()) {
        return { canAdd: false, reason: '该文件夹已在监控列表中' };
      } else if (folder.path.length < newPath.length) {
        return {
          canAdd: false,
          reason: `该文件夹已被 "${folder.path}" 包含`,
        };
      } else {
        return {
          canAdd: false,
          reason: `该文件夹包含了已监控的 "${folder.path}"`,
        };
      }
    }
  }
  return { canAdd: true };
}

/**
 * 添加文件夹到监控列表（自动处理包含关系，移除被包含的子文件夹）
 */
export function addWatchedFolder(
  newPath: string,
  existingFolders: WatchedFolder[]
): WatchedFolder[] {
  const normalizePath = (p: string) => p.replace(/\\/g, '/').replace(/\/$/, '');
  const normalizedNew = normalizePath(newPath).toLowerCase();

  // 过滤掉被新文件夹包含的子文件夹
  const filtered = existingFolders.filter(folder => {
    const normalizedExisting = normalizePath(folder.path).toLowerCase();
    // 如果现有文件夹被新文件夹包含，则移除
    return !normalizedExisting.startsWith(normalizedNew + '/');
  });

  // 添加新文件夹
  return [...filtered, { path: newPath, locked: false }];
}

/**
 * 检查文件夹是否已解锁
 */
export function isFolderUnlocked(folderPath: string, unlockedFolders: string[]): boolean {
  return unlockedFolders.includes(folderPath);
}

/**
 * 检查媒体文件是否来自已解锁的文件夹
 */
export function isMediaFromUnlockedFolder(
  mediaPath: string,
  watchedFolders: WatchedFolder[],
  unlockedFolders: string[]
): boolean {
  const normalizePath = (p: string) => p.replace(/\\/g, '/');
  const normalizedMedia = normalizePath(mediaPath).toLowerCase();

  for (const folder of watchedFolders) {
    const normalizedFolder = normalizePath(folder.path).toLowerCase();

    // 检查媒体是否属于该文件夹
    if (normalizedMedia.startsWith(normalizedFolder + '/')) {
      // 如果文件夹未加锁，或者是已解锁的，则返回 true
      if (!folder.locked || unlockedFolders.includes(folder.path)) {
        return true;
      }
    }
  }

  return false;
}
