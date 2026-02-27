import fs from 'fs';
import path from 'path';

const CONFIG_FILE = 'config.json';

export interface Config {
  dataDir?: string;
}

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

export function saveConfig(config: Config): void {
  const configPath = path.join(process.cwd(), CONFIG_FILE);
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch (e) {
    console.error('保存配置失败:', e);
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
