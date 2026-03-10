import { app } from 'electron';
import fs from 'fs';
import path from 'path';

const CONFIG_FILE = 'config.json';
const SECURE_CONFIG_FILE = '.config.json'; // 存储在 dataDir 中的配置（包含敏感信息）

export interface Config {
  dataDir?: string;
  portableMode?: boolean;
}

export interface SecureConfig {
  lockPassword?: string; // 文件夹加锁密码
}

export interface PortableModeStatus {
  enabled: boolean;
  dataDir: string;
  writable: boolean;
  reason?: string;
}

function getUserConfigPath(): string | null {
  const userDataDir = getUserDataDir();
  if (!userDataDir) return null;
  return path.join(userDataDir, CONFIG_FILE);
}

function getUserDataDir(): string | null {
  try {
    return app.getPath('userData');
  } catch {
    return null;
  }
}

function getLegacyConfigPath(): string {
  return path.join(process.cwd(), CONFIG_FILE);
}

export function getAppInstallDir(): string {
  if (app.isPackaged) {
    return path.dirname(process.execPath);
  }
  return process.cwd();
}

export function getPortableDataDir(): string {
  return path.join(getAppInstallDir(), 'data');
}

export function checkDirWritable(dirPath: string): { writable: boolean; reason?: string } {
  try {
    fs.mkdirSync(dirPath, { recursive: true });
    const probeFile = path.join(dirPath, `.write-test-${process.pid}-${Date.now()}.tmp`);
    fs.writeFileSync(probeFile, 'ok');
    fs.unlinkSync(probeFile);
    return { writable: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { writable: false, reason: message };
  }
}

function readConfig(configPath: string): Config | null {
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8')) as Config;
    }
  } catch (e) {
    console.error('读取配置失败:', e);
  }
  return null;
}

// 获取基础配置（从程序目录，包含 dataDir）
export function getConfig(): Config {
  // 优先读取 userData 下配置，兼容旧版本再读取程序目录
  const userConfigPath = getUserConfigPath();
  if (userConfigPath) {
    const userConfig = readConfig(userConfigPath);
    if (userConfig) return userConfig;
  }

  const legacyConfig = readConfig(getLegacyConfigPath());
  if (legacyConfig) return legacyConfig;

  return {};
}

// 保存基础配置（到程序目录）
export function saveConfig(config: Config): void {
  const configPath = getUserConfigPath() ?? getLegacyConfigPath();
  try {
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch (e) {
    console.error('保存配置失败:', e);
  }
}

// 获取安全配置（从 Data 目录，包含密码等敏感信息）
export function getSecureConfig(dataDir: string): SecureConfig {
  const configPath = path.join(dataDir, SECURE_CONFIG_FILE);
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8')) as SecureConfig;
    }
  } catch (e) {
    console.error('读取安全配置失败:', e);
  }
  return {};
}

// 保存安全配置（到 Data 目录）
export function saveSecureConfig(dataDir: string, config: SecureConfig): void {
  const configPath = path.join(dataDir, SECURE_CONFIG_FILE);
  try {
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch (e) {
    console.error('保存安全配置失败:', e);
  }
}

export function getDefaultDataDir(): string {
  const config = getConfig();
  if (config.portableMode) {
    return getPortableDataDir();
  }

  if (config.dataDir && typeof config.dataDir === 'string' && config.dataDir.length > 0) {
    return path.isAbsolute(config.dataDir)
      ? config.dataDir
      : path.resolve(getAppInstallDir(), config.dataDir);
  }

  // 默认使用安装目录（打包）或工程目录（开发）的 data 子目录
  return getPortableDataDir();
}

export function getPortableModeStatus(): PortableModeStatus {
  const config = getConfig();
  const dataDir = getPortableDataDir();
  const writableResult = checkDirWritable(dataDir);

  return {
    enabled: config.portableMode === true,
    dataDir,
    writable: writableResult.writable,
    reason: writableResult.reason,
  };
}

export function setPortableMode(enabled: boolean): {
  success: boolean;
  message: string;
  dataDir: string;
} {
  const status = getPortableModeStatus();
  const config = getConfig();

  if (enabled && !status.writable) {
    return {
      success: false,
      message: `安装目录不可写，无法启用便携模式: ${status.reason ?? '未知错误'}`,
      dataDir: getDefaultDataDir(),
    };
  }

  config.portableMode = enabled;
  saveConfig(config);

  return {
    success: true,
    message: enabled ? '已启用便携模式（重启应用后生效）' : '已关闭便携模式（重启应用后生效）',
    dataDir: enabled ? status.dataDir : getDefaultDataDir(),
  };
}
