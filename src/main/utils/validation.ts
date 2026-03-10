import path from 'path';
import fs from 'fs';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  return input.replace(/[<>]/g, '').trim();
}

export function sanitizeFilePath(inputPath: string, allowedBaseDir?: string): string {
  if (typeof inputPath !== 'string') {
    return '';
  }

  const normalizedPath = path.normalize(inputPath).replace(/\\/g, '/');

  if (normalizedPath.includes('../') || normalizedPath.includes('..\\')) {
    return '';
  }

  if (allowedBaseDir) {
    const baseDir = path.normalize(allowedBaseDir).replace(/\\/g, '/');
    if (!normalizedPath.startsWith(baseDir)) {
      return '';
    }
  }

  return normalizedPath;
}

export function validateMediaId(id: string): boolean {
  return typeof id === 'string' && id.length > 0 && /^[a-zA-Z0-9_-]+$/.test(id);
}

export function validateTag(tag: string): boolean {
  return typeof tag === 'string' && tag.length > 0 && tag.length <= 50;
}

export function validateFolderPath(folderPath: unknown): string {
  if (typeof folderPath !== 'string') {
    throw new ValidationError('folderPath must be a string');
  }
  const sanitized = sanitizeFilePath(folderPath);
  if (!sanitized) {
    throw new ValidationError('Invalid folderPath');
  }
  return sanitized;
}

export function validateMediaPath(mediaPath: unknown, allowedBasePath?: string): string {
  if (typeof mediaPath !== 'string') {
    throw new ValidationError('mediaPath must be a string');
  }
  const sanitized = sanitizeFilePath(mediaPath, allowedBasePath);
  if (!sanitized) {
    throw new ValidationError('Invalid mediaPath');
  }
  return sanitized;
}

export function validateFolderPaths(paths: unknown): string[] {
  if (!Array.isArray(paths)) {
    throw new ValidationError('folderPaths must be an array');
  }
  return paths.map((p, index) => {
    try {
      return validateFolderPath(p);
    } catch (error) {
      throw new ValidationError(`folderPaths[${index}]: ${(error as Error).message}`);
    }
  });
}

export function isValidFilePath(filePath: string): boolean {
  if (typeof filePath !== 'string') {
    return false;
  }

  try {
    const stats = fs.statSync(filePath);
    return stats.isFile();
  } catch {
    return false;
  }
}

export function isValidDirectoryPath(dirPath: string): boolean {
  if (typeof dirPath !== 'string') {
    return false;
  }

  try {
    const stats = fs.statSync(dirPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

export function validateTimestamp(time: number): boolean {
  return typeof time === 'number' && Number.isFinite(time) && time >= 0;
}

export function validateTrimParams(params: {
  mode: string;
  input: string;
  output: string;
  segments: Array<{ start: number; end: number }>;
}): { valid: boolean; error?: string } {
  if (params.mode !== 'keep' && params.mode !== 'remove') {
    return { valid: false, error: '无效的剪辑模式' };
  }

  if (!isValidFilePath(params.input)) {
    return { valid: false, error: '输入文件不存在或不可访问' };
  }

  const outputDir = path.dirname(params.output);
  if (!isValidDirectoryPath(outputDir)) {
    return { valid: false, error: '输出目录不存在或不可访问' };
  }

  if (!Array.isArray(params.segments) || params.segments.length === 0) {
    return { valid: false, error: '至少需要一个剪辑区间' };
  }

  let lastEnd = -1;
  for (let i = 0; i < params.segments.length; i++) {
    const segment = params.segments[i];
    if (!validateTimestamp(segment.start) || !validateTimestamp(segment.end)) {
      return { valid: false, error: `第 ${i + 1} 个区间时间无效` };
    }
    if (segment.start >= segment.end) {
      return { valid: false, error: `第 ${i + 1} 个区间开始时间必须小于结束时间` };
    }
    if (segment.start < lastEnd) {
      return { valid: false, error: '剪辑区间不能重叠，且必须按时间顺序排列' };
    }
    lastEnd = segment.end;
  }

  return { valid: true };
}
