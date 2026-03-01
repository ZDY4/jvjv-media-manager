import fs from 'fs';
import path from 'path';

const CONFIG_FILE = 'config.json';
const SECURE_CONFIG_FILE = '.config.json'; // 存储在 dataDir 中的配置（包含敏感信息）

export interface Config {
  dataDir?: string;
}

export interface SecureConfig {
  lockPassword?: string; // 文件夹加锁密码
}

// 获取基础配置（从程序目录，包含 dataDir）
export function getConfig(): Config {
  const configPath = path.join(process.cwd(), CONFIG_FILE);
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8')) as Config;
    }
  } catch (e) {
    console.error('读取配置失败:', e);
  }
  return {};
}

// 保存基础配置（到程序目录）
export function saveConfig(config: Config): void {
  const configPath = path.join(process.cwd(), CONFIG_FILE);
  try {
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
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch (e) {
    console.error('保存安全配置失败:', e);
  }
}

export function getDefaultDataDir(): string {
  const config = getConfig();
  if (config.dataDir && typeof config.dataDir === 'string' && config.dataDir.length > 0) {
    return config.dataDir;
  }
  // 默认使用项目目录
  return process.cwd();
}
